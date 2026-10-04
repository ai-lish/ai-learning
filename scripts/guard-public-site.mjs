#!/usr/bin/env node

import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { assertPublicFirebaseConfig } from './firebase-public-config.mjs';

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, 'publish.allowlist.json'), 'utf8'));
const siteRoot = path.resolve(root, manifest.publicRoot);

function assertSafeHost(value) {
  if (typeof value !== 'string' || value.length === 0 || value !== value.toLowerCase() || /[/:?#\s*]/.test(value)) {
    throw new Error(`external host is not a bare lowercase hostname: ${value}`);
  }
}

function assertSafeExternalUrl(value) {
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim() || /[<>\s]/.test(value)) {
    throw new Error(`external URL is not a clean URL: ${value}`);
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`external URL is invalid: ${value}`);
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) {
    throw new Error(`external URL must use HTTPS without credentials, port, query, or hash: ${value}`);
  }
}

if (manifest.version !== 2 || manifest.publicRoot !== 'site' || !Array.isArray(manifest.entries) || !Array.isArray(manifest.generatedFiles) || !Array.isArray(manifest.allowedExternalHosts) || !Array.isArray(manifest.allowedExternalUrls)) {
  throw new Error('invalid publish manifest');
}
for (const host of manifest.allowedExternalHosts) assertSafeHost(host);
for (const externalUrl of manifest.allowedExternalUrls) assertSafeExternalUrl(externalUrl);
const allowedExternalHosts = new Set(manifest.allowedExternalHosts);
const allowedExternalUrls = new Set(manifest.allowedExternalUrls);
const binaryExtensions = new Set([".mp3"]);
const forbiddenName = /(?:^|\/)(?:.*\.map|.*(?:token|secret|credential|api[-_]?key).*|.*(?:\.bak|~))$/i;
const forbiddenContent = [
  /ghp_[A-Za-z0-9_]+/i,
  /github_pat_[A-Za-z0-9_]+/i,
  /\bsk-[A-Za-z0-9_-]{12,}\b/i,
  /\bxox[baprs]-[A-Za-z0-9-]{8,}\b/i,
  /-----BEGIN(?: [A-Z0-9]+)* PRIVATE KEY-----/,
  /(?:API_TOKEN|TEACHER_PASSWORD|TEACHER_EMAILS|API_KEY|firebaseConfig|google_api_key|MINIMAX_API_KEY|DISCORD_WEBHOOK_URL|GITHUB_TOKEN|spreadsheetId|driveId)\s*[:=]/i,
  /(?:Authorization|x-api-key|x-goog-api-key)\s*[:=]/i,
  /\bmethod\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i,
  /(?:studentId|teacherId|classId|spreadsheetId|driveId)\s*[:=]/i,
  /[?&](?:id|fileId|driveId|spreadsheetId|studentId|teacherId|classId|token|key)=/i
];
const externalUrlPattern = /\bhttps?:\/\/[^\s"'<>`)]+/gi;
const nonNetworkUrls = new Set(['http://www.w3.org/2000/svg']);
const recentUpdateIds = new Set(['s1', 's4', 'm2']);
const linkViolations = [];
let checkedLinkTargets = 0;

async function walk(current, files = []) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name);
    const relative = path.relative(siteRoot, full).split(path.sep).join('/');
    const stat = await lstat(full);
    if (stat.isSymbolicLink()) throw new Error(`symbolic link in public output: ${relative}`);
    if (stat.isDirectory()) await walk(full, files);
    else if (stat.isFile()) files.push({ full, relative });
  }
  return files;
}

function validateRecentUpdates(content) {
  const sectionMatch = content.match(/<section class="recent-updates-section"[\s\S]*?<\/section>/);
  if (!sectionMatch) throw new Error('recent updates section is missing from public index');
  const cards = [...sectionMatch[0].matchAll(/<a class="recent-update-card (s1|s4|m2)" href="([^"]+)">/g)];
  if (cards.length !== recentUpdateIds.size || new Set(cards.map((card) => card[1])).size !== recentUpdateIds.size) {
    throw new Error('recent updates must contain exactly one card for S1, S4 and M2');
  }
  const allowlistedDestinations = new Set(manifest.entries.map((entry) => entry.destination));
  for (const card of cards) {
    if (!allowlistedDestinations.has(card[2])) throw new Error(`recent update href is not allowlisted: ${card[2]}`);
  }
  const dates = [...sectionMatch[0].matchAll(/<time class="recent-update-date" datetime="(\d{4}-\d{2}-\d{2})">更新於 (\d{4}\.\d{2}\.\d{2})<\/time>/g)];
  if (dates.length !== recentUpdateIds.size) throw new Error('recent updates must contain one valid date for each card');
}

function blankNonNewlines(value) {
  return value.replace(/[^\n]/g, ' ');
}

function lineNumberAt(content, offset) {
  return content.slice(0, offset).split('\n').length;
}

function reportLinkViolation(file, content, offset, kind, target, reason) {
  linkViolations.push(file.relative + ':' + lineNumberAt(content, offset) + ' ' + kind + ' -> ' + JSON.stringify(target) + ' (' + reason + ')');
}

function normalizeHtmlTarget(value) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x2f;/gi, '/')
    .trim();
}

function checkSiteTarget(rawTarget, file, content, offset, kind) {
  checkedLinkTargets += 1;
  const target = normalizeHtmlTarget(rawTarget);
  if (!target || target.startsWith('#') || /^mailto:/i.test(target)) return;
  if (/[\u0000-\u001f]/.test(target)) {
    reportLinkViolation(file, content, offset, kind, target, 'control character in target');
    return;
  }

  if (/^(?:https?:)?\/\//i.test(target)) {
    let url;
    try {
      url = new URL(target, 'https://site.invalid/');
    } catch {
      reportLinkViolation(file, content, offset, kind, target, 'invalid network URL');
      return;
    }
    if (!allowedExternalHosts.has(url.hostname)) {
      reportLinkViolation(file, content, offset, kind, target, 'external host is not in manifest allowlist: ' + url.hostname);
    }
    return;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) {
    reportLinkViolation(file, content, offset, kind, target, 'unsupported URL scheme');
    return;
  }

  const rawPath = target.split(/[?#]/, 1)[0];
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    reportLinkViolation(file, content, offset, kind, target, 'malformed percent-encoding');
    return;
  }

  const rooted = decodedPath.startsWith('/');
  const candidate = path.posix.normalize(rooted
    ? decodedPath.replace(/^\/+/, '')
    : path.posix.join(path.posix.dirname(file.relative), decodedPath || path.posix.basename(file.relative)));
  if (candidate === '..' || candidate.startsWith('../') || candidate.startsWith('/')) {
    reportLinkViolation(file, content, offset, kind, target, 'target escapes public output root');
    return;
  }

  const resolved = decodedPath.endsWith('/') ? path.posix.join(candidate, 'index.html') : candidate;
  if (!actual.has(resolved)) {
    reportLinkViolation(file, content, offset, kind, target, 'no output file for ' + (resolved || file.relative));
  }
}

function maskJavaScriptNonCode(source) {
  const chars = source.split('');
  let state = 'code';
  let quote = '';
  for (let index = 0; index < chars.length; index += 1) {
    const current = chars[index];
    const next = chars[index + 1];

    if (state === 'line-comment') {
      if (current === '\n') state = 'code';
      else chars[index] = ' ';
      continue;
    }
    if (state === 'block-comment') {
      if (current === '*' && next === '/') {
        chars[index] = ' ';
        chars[index + 1] = ' ';
        index += 1;
        state = 'code';
      } else if (current !== '\n') {
        chars[index] = ' ';
      }
      continue;
    }
    if (state === 'string') {
      if (current === '\\') {
        chars[index] = ' ';
        if (index + 1 < chars.length) {
          if (chars[index + 1] !== '\n') chars[index + 1] = ' ';
          index += 1;
        }
      } else if (current === quote) {
        chars[index] = ' ';
        state = 'code';
      } else if (current !== '\n') {
        chars[index] = ' ';
      }
      continue;
    }

    if (current === '/' && next === '/') {
      chars[index] = ' ';
      chars[index + 1] = ' ';
      index += 1;
      state = 'line-comment';
    } else if (current === '/' && next === '*') {
      chars[index] = ' ';
      chars[index + 1] = ' ';
      index += 1;
      state = 'block-comment';
    } else if (current === "'" || current === '"' || current === '\x60') {
      quote = current;
      chars[index] = ' ';
      state = 'string';
    }
  }
  return chars.join('');
}

function readJavaScriptString(source, start) {
  let index = start;
  while (/\s/.test(source[index] || '')) index += 1;
  const quote = source[index];
  if (quote !== "'" && quote !== '"' && quote !== '\x60') return null;
  const valueStart = ++index;
  let raw = '';
  while (index < source.length) {
    const character = source[index];
    if (character === '\\') {
      raw += character + (source[index + 1] || '');
      index += 2;
      continue;
    }
    if (character === quote) {
      if (quote === '\x60' && raw.includes(String.fromCharCode(36) + '{')) return null;
      let value;
      try {
        value = quote === '"'
          ? JSON.parse('"' + raw + '"')
          : raw.replace(/\\([\\'"\x60])/g, '$1').replace(/\\n/g, '\n').replace(/\\r/g, '\r');
      } catch {
        return null;
      }
      return { value, end: index + 1, valueStart };
    }
    raw += character;
    index += 1;
  }
  return null;
}

function firstExpressionPreview(source, start) {
  return source.slice(start, Math.min(source.length, start + 180)).split(/[;\n]/, 1)[0].trim();
}

function scanJavaScriptTargets(source, file, content, sourceOffset) {
  const code = maskJavaScriptNonCode(source);
  const locationPattern = /(?:\bwindow\s*\.\s*)?\blocation\s*\.\s*href\s*(?:\+=|=(?!=))\s*/gi;
  for (const match of code.matchAll(locationPattern)) {
    const targetStart = match.index + match[0].length;
    const literal = readJavaScriptString(source, targetStart);
    const tail = literal ? source.slice(literal.end).trimStart() : '';
    if (literal && (!tail || /^[;)\n]/.test(tail))) {
      checkSiteTarget(literal.value, file, content, sourceOffset + targetStart, 'location.href');
    } else {
      checkedLinkTargets += 1;
      reportLinkViolation(file, content, sourceOffset + targetStart, 'location.href', firstExpressionPreview(source, targetStart), 'dynamic destination cannot be verified');
    }
  }

  const openPattern = /\bwindow\s*\.\s*open\s*\(/gi;
  for (const match of code.matchAll(openPattern)) {
    const targetStart = match.index + match[0].length;
    const literal = readJavaScriptString(source, targetStart);
    const tail = literal ? source.slice(literal.end).trimStart() : '';
    if (literal && (/^[,)]/.test(tail) || !tail)) {
      checkSiteTarget(literal.value, file, content, sourceOffset + targetStart, 'window.open');
    } else {
      checkedLinkTargets += 1;
      reportLinkViolation(file, content, sourceOffset + targetStart, 'window.open', firstExpressionPreview(source, targetStart), 'dynamic destination cannot be verified');
    }
  }
}

function checkHtmlNavigation(file, content) {
  const withoutComments = content.replace(/<!--[\s\S]*?-->/g, blankNonNewlines);
  const scriptPattern = /<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi;
  const scripts = [...withoutComments.matchAll(scriptPattern)];
  const markup = withoutComments.replace(scriptPattern, blankNonNewlines);
  const tagPattern = /<[a-z][^>]*>/gi;
  const linkAttributePattern = /(?:^|\s)(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/gi;
  const eventAttributePattern = /(?:^|\s)(on[a-z]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/gi;

  for (const tag of markup.matchAll(tagPattern)) {
    for (const attribute of tag[0].matchAll(linkAttributePattern)) {
      const value = attribute[2] ?? attribute[3] ?? attribute[4] ?? '';
      const valueOffset = tag[0].indexOf(value, attribute.index);
      checkSiteTarget(value, file, content, tag.index + Math.max(valueOffset, 0), attribute[1].toLowerCase());
    }
    for (const attribute of tag[0].matchAll(eventAttributePattern)) {
      const value = attribute[2] ?? attribute[3] ?? attribute[4] ?? '';
      const valueOffset = tag[0].indexOf(value, attribute.index);
      scanJavaScriptTargets(value, file, content, tag.index + Math.max(valueOffset, 0));
    }
  }

  for (const script of scripts) {
    const scriptSource = script[1];
    const sourceOffset = script.index + script[0].indexOf(scriptSource);
    scanJavaScriptTargets(scriptSource, file, content, sourceOffset);
  }
}

const expected = new Set([...manifest.entries.map((entry) => entry.destination), ...manifest.generatedFiles]);
const files = await walk(siteRoot);
const actual = new Set(files.map((file) => file.relative));
const extra = [...actual].filter((file) => !expected.has(file));
const missing = [...expected].filter((file) => !actual.has(file));
if (extra.length || missing.length) throw new Error(`public output differs from exact allowlist; extra=${extra.join(',')} missing=${missing.join(',')}`);

for (const file of files) {
  if (forbiddenName.test(file.relative)) throw new Error(`forbidden public filename: ${file.relative}`);
  if (binaryExtensions.has(path.extname(file.relative).toLowerCase())) continue;
  const content = (await readFile(file.full)).toString('utf8');
  if (/\b[A-Z0-9._%+-]+@gmail\.com\b/i.test(content)) {
    throw new Error(`Gmail email address in public output: ${file.relative}`);
  }
  if (file.relative === 'js/firebase-config.js') {
    assertPublicFirebaseConfig(content);
  } else if (/\bapiKey\s*[:=]/i.test(content)) {
    throw new Error(`public Firebase API key field outside the validated web config: ${file.relative}`);
  }
  if (forbiddenContent.some((pattern) => pattern.test(content))) throw new Error(`forbidden credential/backend reference in public output: ${file.relative}`);
  if (file.relative === 'index.html') validateRecentUpdates(content);
  for (const match of content.matchAll(externalUrlPattern)) {
    if (nonNetworkUrls.has(match[0])) continue;
    let url;
    try {
      url = new URL(match[0]);
    } catch {
      throw new Error(`invalid external URL in public output: ${file.relative}`);
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) {
      throw new Error(`unsafe external URL form in public output: ${file.relative}`);
    }
    if (!allowedExternalUrls.has(url.toString()) && !allowedExternalHosts.has(url.hostname)) {
      throw new Error(`external host is not in manifest allowlist: ${file.relative} (${url.hostname})`);
    }
    if (/[?&](?:id|fileId|driveId|spreadsheetId|studentId|teacherId|classId|token|key)=/i.test(url.search)) {
      throw new Error(`identifier-like query parameter in public output: ${file.relative}`);
    }
  }
}

for (const file of files.filter((candidate) => path.extname(candidate.relative).toLowerCase() === '.html')) {
  checkHtmlNavigation(file, (await readFile(file.full)).toString('utf8'));
}
if (linkViolations.length) {
  console.error(`Site link guard failed (${linkViolations.length} violations across ${checkedLinkTargets} checked targets).`);
  for (const violation of linkViolations) console.error(` - ${violation}`);
  process.exitCode = 1;
} else {
  console.log(`Site link guard passed (${checkedLinkTargets} navigation targets checked).`);
  console.log(`Public-site guard passed (${files.length} exact files).`);
}
