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

async function buildRecentUpdates() {
  const publicEntries = manifest.entries.filter((entry) => entry && typeof entry.source === 'string' && typeof entry.destination === 'string');
  const allowlistedDestinations = new Set(publicEntries.map((entry) => entry.destination));
  const updates = [];
  await assertCompleteHistory();

  for (const definition of recentUpdateDefinitions) {
    const candidates = publicEntries
      .filter((entry) => entry.source === entry.destination && definition.pattern.test(entry.source))
      .sort((left, right) => left.source.localeCompare(right.source));
    if (candidates.length === 0) throw new Error(`no allowlisted chapter entry for ${definition.code}`);

    const datedCandidates = await Promise.all(candidates.map(async (entry) => ({
      entry,
      timestamp: await readLatestCommit(entry.source)
    })));
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

async function renderPublicIndex() {
  const source = await readFile(path.join(root, 'index.html'), 'utf8');
  const startMarker = '<!-- RECENT_UPDATES_START -->';
  const endMarker = '<!-- RECENT_UPDATES_END -->';
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) throw new Error('index.html is missing recent updates markers');
  const updates = await buildRecentUpdates();
  return `${source.slice(0, start)}${startMarker}\n${renderRecentUpdates(updates)}\n          ${endMarker}${source.slice(end + endMarker.length)}`;
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
  if (entry.source === 'index.html') await writeFile(destinationPath, await renderPublicIndex());
  else await copyFile(sourcePath, destinationPath);
}

if (manifest.generatedFiles.length !== 1 || manifest.generatedFiles[0] !== '.nojekyll') throw new Error('generatedFiles must contain only .nojekyll');
await writeFile(path.join(siteRoot, '.nojekyll'), '');
console.log(`Built ${manifest.entries.length + manifest.generatedFiles.length} exact public files.`);
