#!/usr/bin/env node

import { createHash } from 'node:crypto';
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
const goatCounterMarker = '<!-- GoatCounter: send a path only, without query or referrer -->';
const offlineSlideCatalogSources = new Set([
  'data/example-slides/s1ch4.json',
  'data/example-slides/m2ch3.json',
  'data/example-slides/s4ch3.json',
  'data/example-slides/s4revision.json'
]);
const offlineSlideScriptHashes = new Set([
  '450f60c27a6ca1193c462136f44767af8be55ee961779576030ef727a568fd8a',
  '946159680c70354c665dbf4f3c9023a737d8b14b48c6c9af452553717a046729',
  'b84d8724317fd1d30488e5f67ffb031b0babce7d1e62251bc3c3c4e49bcb763f'
]);
const offlineSlideScriptSources = [...offlineSlideScriptHashes]
  .map((hash) => `'sha256-${Buffer.from(hash, 'hex').toString('base64')}'`)
  .sort();
const offlineSlideCsp = `default-src 'none'; script-src ${offlineSlideScriptSources.join(' ')}; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'`;
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

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stripHtmlCommentsOutsideScripts(content) {
  const lower = content.toLowerCase();
  let output = '';
  let index = 0;
  while (index < content.length) {
    const commentStart = content.indexOf('<!--', index);
    const scriptStart = lower.indexOf('<script', index);
    if (commentStart !== -1 && (scriptStart === -1 || commentStart < scriptStart)) {
      output += content.slice(index, commentStart);
      const commentEnd = content.indexOf('-->', commentStart + 4);
      if (commentEnd === -1) throw new Error('unterminated HTML comment in offline slide');
      output += blankNonNewlines(content.slice(commentStart, commentEnd + 3));
      index = commentEnd + 3;
    } else if (scriptStart !== -1) {
      output += content.slice(index, scriptStart);
      const openingEnd = content.indexOf('>', scriptStart + 7);
      const closingStart = lower.indexOf('</script', openingEnd + 1);
      const closingEnd = closingStart === -1 ? -1 : content.indexOf('>', closingStart + 8);
      if (openingEnd === -1 || closingStart === -1 || closingEnd === -1) {
        throw new Error('malformed script element in offline slide');
      }
      output += content.slice(scriptStart, closingEnd + 1);
      index = closingEnd + 1;
    } else {
      output += content.slice(index);
      break;
    }
  }
  return output;
}

function attributesFromTag(tagSource) {
  const attributes = new Map();
  const attributeSource = tagSource
    .slice(1, -1)
    .replace(/^\s*[a-z][a-z0-9:-]*/i, '');
  const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of attributeSource.matchAll(attributePattern)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    if (attributes.has(name)) throw new Error(`duplicate HTML attribute in offline slide: ${name}`);
    attributes.set(name, value);
  }
  return attributes;
}

function assertEmbeddedUrl(value, file, label) {
  const target = value.trim();
  if (!target || target.startsWith('#') || /^(?:data|blob):/i.test(target)) return;
  if (label === 'iframe src' && target === 'about:blank') return;
  throw new Error(`offline slide has an external or non-embedded ${label}: ${file.relative} (${target.slice(0, 100)})`);
}

function validateOfflineSlideHtml(file, content, asset) {
  const withoutComments = stripHtmlCommentsOutsideScripts(content);
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  const scripts = [...withoutComments.matchAll(scriptPattern)];
  const unparsedScriptMarkup = withoutComments.replace(scriptPattern, blankNonNewlines);
  if (scripts.length !== 3 || /<script\b/i.test(unparsedScriptMarkup)) {
    throw new Error(`offline slide must contain exactly three closed inline scripts: ${file.relative}`);
  }
  const actualScriptHashes = new Set();
  for (const script of scripts) {
    const attributes = attributesFromTag(`<script ${script[1]}>`);
    if (attributes.has('src')) throw new Error(`offline slide cannot load an external script: ${file.relative}`);
    actualScriptHashes.add(sha256(script[2]));
  }
  if (actualScriptHashes.size !== offlineSlideScriptHashes.size ||
      [...offlineSlideScriptHashes].some((hash) => !actualScriptHashes.has(hash))) {
    throw new Error(`offline slide inline script hashes are not the reviewed set: ${file.relative}`);
  }

  const cspMetas = [...withoutComments.matchAll(/<meta\b[^>]*>/gi)]
    .filter((tag) => attributesFromTag(tag[0]).get('http-equiv')?.toLowerCase() === 'content-security-policy');
  if (cspMetas.length !== 1 || attributesFromTag(cspMetas[0][0]).get('content') !== offlineSlideCsp) {
    throw new Error(`offline slide CSP is missing or differs from the restrictive policy: ${file.relative}`);
  }

  const markup = withoutComments
    .replace(scriptPattern, blankNonNewlines)
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, blankNonNewlines);
  const tagPattern = /<[a-z][^>]*>/gi;
  const resourceAttributes = new Set(['src', 'poster', 'data-src', 'data-background', 'data-background-image', 'data-background-video']);
  const styleSources = [];
  for (const tag of markup.matchAll(tagPattern)) {
    const nameMatch = tag[0].match(/^<([a-z][a-z0-9:-]*)/i);
    if (!nameMatch) continue;
    const tagName = nameMatch[1].toLowerCase();
    const attributes = attributesFromTag(tag[0]);
    if (tagName === 'base' || attributes.has('srcdoc') || attributes.has('srcset') || attributes.has('ping') ||
        attributes.has('action') || attributes.has('formaction') || [...attributes.keys()].some((name) => /^on[a-z]+$/i.test(name))) {
      throw new Error(`offline slide contains an active navigation or event attribute: ${file.relative}`);
    }
    for (const name of resourceAttributes) {
      if (attributes.has(name)) assertEmbeddedUrl(attributes.get(name), file, `${tagName} ${name}`);
    }
    if (attributes.has('href')) {
      const href = attributes.get('href').trim();
      if (href && !href.startsWith('#') && !/^(?:data|blob):/i.test(href)) {
        throw new Error(`offline slide contains a non-local href: ${file.relative} (${href.slice(0, 100)})`);
      }
    }
    if (attributes.has('style')) styleSources.push(attributes.get('style'));
  }

  for (const style of withoutComments.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) styleSources.push(style[1]);
  for (const style of styleSources) {
    if (/@import\s+(?!url\(\s*["']?data:)[^;]+/i.test(style)) {
      throw new Error(`offline slide CSS contains a non-embedded import: ${file.relative}`);
    }
    for (const match of style.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi)) {
      const url = (match[1] ?? match[2] ?? match[3] ?? '').trim();
      assertEmbeddedUrl(url, file, 'CSS url()');
    }
  }

  const pageCount = [...content.matchAll(/<section\b/gi)].length;
  if (sha256(Buffer.from(content, 'utf8')) !== asset.sha256 || Buffer.byteLength(content, 'utf8') !== asset.bytes || pageCount !== asset.pages) {
    throw new Error(`offline slide SHA, byte count, or page count differs from its catalog: ${file.relative}`);
  }
}

async function validateOfflineSlideCatalog(files) {
  const catalogEntries = manifest.entries.filter((entry) => offlineSlideCatalogSources.has(entry.source));
  if (catalogEntries.length !== offlineSlideCatalogSources.size) throw new Error('offline slides require exactly the S1Ch4, M2Ch3, S4Ch3 and S4Revision catalogs');
  const catalogAssets = new Map();
  for (const entry of catalogEntries) {
    if (entry.source !== entry.destination) throw new Error(`offline slide catalog destination must mirror its source: ${entry.source}`);
    const catalog = JSON.parse(await readFile(path.join(siteRoot, entry.destination), 'utf8'));
    const expectedChapter = entry.source.includes('/s1ch4.') ? 'S1Ch4' : entry.source.includes('/m2ch3.') ? 'M2Ch3' : entry.source.includes('/s4revision.') ? 'S4Revision' : 'S4Ch3';
    if (catalog.version !== 2 || catalog.format !== 'offline-html' || catalog.chapter !== expectedChapter || !Array.isArray(catalog.items)) {
      throw new Error(`invalid offline slide catalog: ${entry.source}`);
    }
    const ids = new Set();
    for (const item of catalog.items) {
      if (!/^[0-9]+(?:\.[0-9]+)?[a-z]?$/.test(item.id) || ids.has(item.id) || !item.questionNumber || !item.title || !item.summary || !item.section || !item.textbookPage) {
        throw new Error(`invalid or duplicate offline slide catalog item: ${entry.source}`);
      }
      ids.add(item.id);
      if (item.slidePath === null) {
        if (item.status !== 'wip') throw new Error(`offline slide placeholder must be marked wip: ${entry.source} (${item.id})`);
        continue;
      }
      if (typeof item.slidePath !== 'string' || !item.slidePath.startsWith(`slides/${expectedChapter}/`) ||
          !/^slides\/(?:S1Ch4|M2Ch3|S4Ch3|S4Revision)\/Ex[\d.]+[a-z]?-[A-Za-z0-9-]+\.html$/.test(item.slidePath) ||
          !/^[a-f0-9]{64}$/.test(item.sha256) || !/^[a-f0-9]{64}$/.test(item.sourceSha256) ||
          !Number.isSafeInteger(item.bytes) || item.bytes <= 0 || !Number.isSafeInteger(item.pages) || item.pages < 1) {
        throw new Error(`invalid offline slide metadata: ${entry.source} (${item.id})`);
      }
      if (catalogAssets.has(item.slidePath)) throw new Error(`duplicate offline slide catalog path: ${item.slidePath}`);
      catalogAssets.set(item.slidePath, { chapter: expectedChapter, sha256: item.sha256, sourceSha256: item.sourceSha256, bytes: item.bytes, pages: item.pages });
    }
  }

  const allowlistedSlides = new Map();
  for (const entry of manifest.entries.filter((candidate) => candidate.source.startsWith('slides/'))) {
    if (path.posix.extname(entry.source).toLowerCase() !== '.html' || entry.source !== entry.destination || !/^[a-f0-9]{64}$/.test(entry.offlineSlideSha256 || '')) {
      throw new Error(`offline slide allowlist entry is out of scope: ${entry.source}`);
    }
    if (allowlistedSlides.has(entry.source)) throw new Error(`duplicate offline slide allowlist entry: ${entry.source}`);
    allowlistedSlides.set(entry.source, entry.offlineSlideSha256);
  }
  if (allowlistedSlides.size !== catalogAssets.size) throw new Error(`offline slide allowlist/catalog counts differ: ${allowlistedSlides.size}/${catalogAssets.size}`);
  for (const [slidePath, asset] of catalogAssets) {
    if (allowlistedSlides.get(slidePath) !== asset.sha256) throw new Error(`offline slide allowlist SHA differs from catalog: ${slidePath}`);
    const file = files.find((candidate) => candidate.relative === slidePath);
    if (!file) throw new Error(`offline slide file is missing from public output: ${slidePath}`);
    const content = (await readFile(file.full)).toString('utf8');
    validateOfflineSlideHtml(file, content, asset);
  }
  return catalogAssets;
}

const expected = new Set([...manifest.entries.map((entry) => entry.destination), ...manifest.generatedFiles]);
const files = await walk(siteRoot);
const actual = new Set(files.map((file) => file.relative));
const extra = [...actual].filter((file) => !expected.has(file));
const missing = [...expected].filter((file) => !actual.has(file));
if (extra.length || missing.length) throw new Error(`public output differs from exact allowlist; extra=${extra.join(',')} missing=${missing.join(',')}`);
const offlineSlideAssets = await validateOfflineSlideCatalog(files);

for (const file of files) {
  if (forbiddenName.test(file.relative)) throw new Error(`forbidden public filename: ${file.relative}`);
  if (binaryExtensions.has(path.extname(file.relative).toLowerCase())) continue;
  const content = (await readFile(file.full)).toString('utf8');
  const isOfflineSlide = offlineSlideAssets.has(file.relative);
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
  if (path.extname(file.relative).toLowerCase() === '.html') {
    if (isOfflineSlide) {
      if (content.includes(goatCounterMarker) || /data-goatcounter\s*=|gc\.zgo\.at\/count\.js/.test(content)) {
        throw new Error(`offline slide must not contain GoatCounter markup: ${file.relative}`);
      }
    } else {
      const markerCount = content.split(goatCounterMarker).length - 1;
      const endpointCount = [...content.matchAll(/data-goatcounter="https:\/\/ai-learning-lsh\.goatcounter\.com\/count"/g)].length;
      const loaderCount = [...content.matchAll(/<script\b[^>]*\bsrc="https:\/\/gc\.zgo\.at\/count\.js"[^>]*><\/script>/gi)].length;
      const settingsStart = content.indexOf(goatCounterMarker);
      const settingsEnd = settingsStart < 0 ? -1 : content.indexOf('</script>', settingsStart);
      const settings = settingsStart < 0 || settingsEnd < 0 ? '' : content.slice(settingsStart, settingsEnd + '</script>'.length);
      if (markerCount !== 1 || endpointCount !== 1 || loaderCount !== 1 ||
          !/path:\s*function\s*\(\)\s*\{\s*return\s+window\.location\.pathname;\s*\}/.test(settings) ||
          !/referrer:\s*''/.test(settings) || /location\.search|document\.referrer/.test(settings)) {
        throw new Error(`GoatCounter must send a path without query/referrer exactly once: ${file.relative}`);
      }
    }
  }
  if (!isOfflineSlide) for (const match of content.matchAll(externalUrlPattern)) {
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

for (const file of files.filter((candidate) => path.extname(candidate.relative).toLowerCase() === '.html' && !offlineSlideAssets.has(candidate.relative))) {
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
