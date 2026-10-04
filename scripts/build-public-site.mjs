#!/usr/bin/env node

import { copyFile, lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, 'publish.allowlist.json'), 'utf8'));
const siteRoot = path.resolve(root, manifest.publicRoot);
const execFile = promisify(execFileCallback);

function assertSafeRelative(value, label) {
  if (typeof value !== 'string' || value.length === 0 || path.isAbsolute(value) || value.includes('..') || value.includes('\\') || value.split('/').some((part) => part === '' || part === '.')) {
    throw new Error(`${label} is not a safe relative path: ${value}`);
  }
}

function assertSafeHost(value) {
  if (typeof value !== 'string' || value.length === 0 || value !== value.toLowerCase() || /[/:?#\s*]/.test(value)) {
    throw new Error(`external host is not a bare lowercase hostname: ${value}`);
  }
}

if (manifest.version !== 2 || manifest.publicRoot !== 'site' || !Array.isArray(manifest.entries) || !Array.isArray(manifest.generatedFiles) || !Array.isArray(manifest.allowedExternalHosts)) {
  throw new Error('invalid publish manifest');
}

for (const host of manifest.allowedExternalHosts) assertSafeHost(host);

const recentUpdateDefinitions = [
  { id: 's1', code: 'S1', pattern: /^S1Ch\d+\.html$/i },
  { id: 's4', code: 'S4', pattern: /^S4Ch\d+\.html$/i },
  { id: 'm2', code: 'M2', pattern: /^M2Ch\d+\.html$/i, titlePattern: /<span class="m2-title-zh[^>]*>([\s\S]*?)<\/span>/i }
];

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function compactTitle(title, definition, filePath) {
  const normalized = title.replace(/\s+/g, ' ').trim();
  const prefix = new RegExp(`^${definition.code}\\s+Ch\\d+\\s*[｜|·]\\s*`, 'i');
  const compact = normalized.replace(prefix, '').split('|')[0].trim();
  if (!compact || compact.length > 80) throw new Error(`recent update title is missing or too long: ${filePath}`);
  return compact;
}

function formatHongKongDate(timestamp) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(Number(timestamp) * 1000));
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  if (!/^\d{4}$/.test(values.year) || !/^\d{2}$/.test(values.month) || !/^\d{2}$/.test(values.day)) {
    throw new Error(`could not format recent update date: ${timestamp}`);
  }
  return { iso: `${values.year}-${values.month}-${values.day}`, display: `${values.year}.${values.month}.${values.day}` };
}

async function readLatestCommit(filePath) {
  const { stdout } = await execFile('git', ['log', '-1', '--format=%ct', '--', filePath], {
    cwd: root,
    maxBuffer: 1024 * 1024
  });
  const timestamp = stdout.trim();
  if (!/^\d+$/.test(timestamp)) throw new Error(`no complete git history for recent update source: ${filePath}`);
  return Number(timestamp);
}

async function assertCompleteHistory() {
  const { stdout } = await execFile('git', ['rev-parse', '--is-shallow-repository'], {
    cwd: root,
    maxBuffer: 1024 * 1024
  });
  if (stdout.trim() !== 'false') throw new Error('recent updates require a complete git history; shallow checkout is not allowed');
}

function recentUpdateCandidates() {
  const publicEntries = manifest.entries.filter((entry) => entry && typeof entry.source === 'string' && typeof entry.destination === 'string');
  const candidates = new Map();

  for (const definition of recentUpdateDefinitions) {
    const matchingEntries = publicEntries
      .filter((entry) => entry.source === entry.destination && definition.pattern.test(entry.source))
      .sort((left, right) => left.source.localeCompare(right.source));
    if (matchingEntries.length === 0) throw new Error(`no allowlisted chapter entry for ${definition.code}`);
    for (const entry of matchingEntries) candidates.set(entry.source, entry);
  }

  return [...candidates.values()].sort((left, right) => left.source.localeCompare(right.source));
}

function isWithinDirectory(directory, target) {
  const relative = path.relative(directory, target);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

async function collectRecentUpdateTimestamps(candidates) {
  const timestamps = {};
  for (const entry of candidates) timestamps[entry.source] = await readLatestCommit(entry.source);
  return timestamps;
}

async function readRecentUpdateTimestamps(filePath, candidates) {
  const metadataPath = path.resolve(filePath);
  const metadataStat = await lstat(metadataPath);
  if (!metadataStat.isFile() || metadataStat.isSymbolicLink()) throw new Error('recent-update timestamp metadata must be a regular file');

  let timestamps;
  try {
    timestamps = JSON.parse(await readFile(metadataPath, 'utf8'));
  } catch (error) {
    throw new Error(`could not read recent-update timestamp metadata: ${error.message}`);
  }
  if (!timestamps || typeof timestamps !== 'object' || Array.isArray(timestamps)) {
    throw new Error('recent-update timestamp metadata must be a source-to-timestamp object');
  }

  const expectedSources = candidates.map((entry) => entry.source).sort();
  const actualSources = Object.keys(timestamps).sort();
  if (actualSources.length !== expectedSources.length || actualSources.some((source, index) => source !== expectedSources[index])) {
    throw new Error('recent-update timestamp metadata sources do not match allowlisted chapter sources');
  }
  for (const source of expectedSources) {
    if (!Number.isSafeInteger(timestamps[source]) || timestamps[source] <= 0) {
      throw new Error(`recent-update timestamp metadata has an invalid timestamp for ${source}`);
    }
  }

  return timestamps;
}

async function recentUpdateTimestamps(candidates) {
  const metadataPath = process.env.RECENT_UPDATE_TIMESTAMPS_FILE;
  if (metadataPath) return readRecentUpdateTimestamps(metadataPath, candidates);
  return collectRecentUpdateTimestamps(candidates);
}

function requestedMetadataOutputPath() {
  const args = process.argv.slice(2);
  if (args.length === 0) return null;
  if (args.length !== 2 || args[0] !== '--write-recent-update-timestamps' || !args[1]) {
    throw new Error('usage: build-public-site.mjs [--write-recent-update-timestamps <path>]');
  }
  if (process.env.RECENT_UPDATE_TIMESTAMPS_FILE) {
    throw new Error('cannot read and write recent-update timestamp metadata in one build');
  }

  const outputPath = path.resolve(args[1]);
  if (isWithinDirectory(root, outputPath)) {
    throw new Error('recent-update timestamp metadata output must be outside the repository and Pages output');
  }
  return outputPath;
}

async function buildRecentUpdates(timestamps) {
  const publicEntries = manifest.entries.filter((entry) => entry && typeof entry.source === 'string' && typeof entry.destination === 'string');
  const allowlistedDestinations = new Set(publicEntries.map((entry) => entry.destination));
  const updates = [];

  for (const definition of recentUpdateDefinitions) {
    const candidates = publicEntries
      .filter((entry) => entry.source === entry.destination && definition.pattern.test(entry.source))
      .sort((left, right) => left.source.localeCompare(right.source));
    if (candidates.length === 0) throw new Error(`no allowlisted chapter entry for ${definition.code}`);

    const datedCandidates = candidates.map((entry) => ({
      entry,
      timestamp: timestamps[entry.source]
    }));
    datedCandidates.sort((left, right) => right.timestamp - left.timestamp || left.entry.source.localeCompare(right.entry.source));
    const latest = datedCandidates[0];
    const html = await readFile(path.resolve(root, latest.entry.source), 'utf8');
    const titleMatch = html.match(definition.titlePattern || /<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!titleMatch) throw new Error(`recent update source has no title: ${latest.entry.source}`);
    if (!allowlistedDestinations.has(latest.entry.destination)) throw new Error(`recent update destination is not allowlisted: ${latest.entry.destination}`);
    const date = formatHongKongDate(latest.timestamp);
    updates.push({
      id: definition.id,
      code: definition.code,
      title: compactTitle(titleMatch[1], definition, latest.entry.source),
      href: latest.entry.destination,
      date,
      timestamp: latest.timestamp
    });
  }

  return updates.sort((left, right) => right.timestamp - left.timestamp || left.code.localeCompare(right.code));
}

function renderRecentUpdates(updates) {
  return updates.map((update) => `            <a class="recent-update-card ${update.id}" href="${escapeHtml(update.href)}">
              <div class="recent-update-meta"><span class="recent-update-code">${escapeHtml(update.code)}</span><time class="recent-update-date" datetime="${update.date.iso}">更新於 ${update.date.display}</time></div>
              <h4>${escapeHtml(update.title)}</h4>
              <span class="recent-update-action">進入 →</span>
            </a>`).join('\n');
}

function injectAuthWidget(html, destination) {
  if (!/class=["'][^"']*\blayout-auth-(?:slot|placeholder)\b/i.test(html)) return html;
  if (/auth-state\.js|firebase-config\.js|auth-widget\.css/i.test(html)) {
    throw new Error(`auth widget assets are already present in source HTML: ${destination}`);
  }

  const relativeAsset = (asset) => {
    const relative = path.posix.relative(path.posix.dirname(destination), asset);
    return relative.startsWith('.') ? relative : `./${relative}`;
  };
  const stylesheet = `<link rel="stylesheet" href="${relativeAsset('css/auth-widget.css')}">`;
  const scripts = [
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
    relativeAsset('js/firebase-config.js'),
    relativeAsset('js/auth-state.js')
  ].map((source) => `<script defer src="${source}"></script>`).join('\n');

  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) {
    throw new Error(`auth widget target must have closing head and body tags: ${destination}`);
  }
  return html
    .replace(/<\/head>/i, `${stylesheet}\n</head>`)
    .replace(/<\/body>/i, `${scripts}\n</body>`);
}

async function renderPublicIndex(sourcePath) {
  const source = await readFile(path.join(root, sourcePath), 'utf8');
  const startMarker = '<!-- RECENT_UPDATES_START -->';
  const endMarker = '<!-- RECENT_UPDATES_END -->';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) throw new Error(`${sourcePath} is missing recent updates markers`);
  const updates = await buildRecentUpdates(currentRecentUpdateTimestamps);
  return `${source.slice(0, start)}${startMarker}\n${renderRecentUpdates(updates)}\n          ${endMarker}${source.slice(end + endMarker.length)}`;
}

await assertCompleteHistory();
const metadataOutputPath = requestedMetadataOutputPath();
const updateCandidates = recentUpdateCandidates();
const currentRecentUpdateTimestamps = await recentUpdateTimestamps(updateCandidates);
if (metadataOutputPath) {
  await writeFile(metadataOutputPath, `${JSON.stringify(currentRecentUpdateTimestamps, null, 2)}\n`);
}

await rm(siteRoot, { recursive: true, force: true });
await mkdir(siteRoot, { recursive: true });

for (const entry of manifest.entries) {
  assertSafeRelative(entry.source, 'source');
  assertSafeRelative(entry.destination, 'destination');
  const sourcePath = path.resolve(root, entry.source);
  const destinationPath = path.resolve(siteRoot, entry.destination);
  const sourceStat = await lstat(sourcePath);
  if (!sourceStat.isFile() || sourceStat.isSymbolicLink()) throw new Error(`allowlisted source is not a regular file: ${entry.source}`);
  await mkdir(path.dirname(destinationPath), { recursive: true });
  if (path.posix.extname(entry.destination).toLowerCase() === '.html') {
    const html = entry.destination === 'index.html'
      ? await renderPublicIndex(entry.source)
      : await readFile(sourcePath, 'utf8');
    await writeFile(destinationPath, injectAuthWidget(html, entry.destination));
  } else {
    await copyFile(sourcePath, destinationPath);
  }
}

if (manifest.generatedFiles.length !== 1 || manifest.generatedFiles[0] !== '.nojekyll') throw new Error('generatedFiles must contain only .nojekyll');
await writeFile(path.join(siteRoot, '.nojekyll'), '');
console.log(`Built ${manifest.entries.length + manifest.generatedFiles.length} exact public files.`);
