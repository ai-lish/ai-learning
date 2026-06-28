#!/usr/bin/env node
/**
 * scripts/link-check.mjs — Phase 0 internal-link checker
 * ai-lish/ai-learning
 *
 * Scans all site-source files (HTML / CSS / JS) for internal relative links
 * and reports:
 *
 *   DANGLING   — target file does not exist anywhere in the repo
 *   UNDEPLOYED — target exists but its top-level directory is NOT in the
 *                current deploy whitelist (pages-deploy.yml before Phase 4)
 *   DYNAMIC    — link is assembled at runtime (e.g. goToCh(n)); needs human
 *                review after Phase 3 file moves
 *   ABS        — link starts with "/" (absolute server path); recorded for
 *                awareness, not checked for existence here
 *
 * Usage (run from repo root):
 *   node scripts/link-check.mjs
 *   node scripts/link-check.mjs --json
 *   node scripts/link-check.mjs --output REFERENCE/20260628_PHASE0_BASELINE.txt
 *
 * No external dependencies — only Node.js built-ins.
 */

import {
  readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync, statSync,
} from 'node:fs';
import { resolve, dirname, join, relative, extname, sep } from 'node:path';

// ─── Configuration ───────────────────────────────────────────────────────────

const ROOT = resolve('.');

/**
 * Top-level directories currently copied by pages-deploy.yml (whitelist build).
 * '' represents root-level files (*.html, etc. at the repo root).
 * Source: .github/workflows/pages-deploy.yml — cp -v *.html site/ and the
 * explicit directory copies.
 */
const CURRENTLY_DEPLOYED = new Set([
  '',            // root-level files (all *.html, etc.)
  'games',
  'student',
  'login',
  'css',
  'images',
  'js',
  'projects',
  'hkdse',
  'exam',
  's1',
  's3',
  'tools',
  'infographics',
]);

/**
 * Directories excluded from the file walk (not scanned as link sources).
 * Mirrors the rsync exclude list used in the new blacklist deploy.
 */
const SKIP_SCAN = new Set([
  '.git', '.github',
  'gas', 'tests', 'scripts',
  'PLANNING', 'REFERENCE',
  'prompts', 'content', 'planning',
  'node_modules', 'archive', 'site',
]);

const HTML_EXTS = new Set(['.html', '.htm']);
const CSS_EXTS  = new Set(['.css']);
const JS_EXTS   = new Set(['.js', '.mjs', '.cjs']);

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const useJson  = args.includes('--json');
const outIdx   = args.indexOf('--output');
const outFile  = outIdx >= 0 ? args[outIdx + 1] : null;

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Pre-compute line-start offsets for fast O(log n) line-number lookup. */
function buildLineIndex(src) {
  const idx = [0];
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '\n') idx.push(i + 1);
  }
  return idx;
}

/** Return 1-based line number for character offset `pos`. */
function lineAt(idx, pos) {
  let lo = 0, hi = idx.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (idx[mid] <= pos) lo = mid; else hi = mid - 1;
  }
  return lo + 1;
}

/** Return true if the reference should be ignored outright (external, etc.). */
function isExternal(ref) {
  if (!ref) return true;
  const r = ref.trim();
  return !r ||
    r.startsWith('#') ||
    /^(https?:)?\/\//i.test(r) ||
    /^(mailto:|tel:|data:|javascript:|blob:)/i.test(r);
}

/** Return true if the reference is an absolute server path (starts with /). */
function isAbsPath(ref) {
  return ref.trim().startsWith('/');
}

/** URL-decode a path string (handles CJK and other Unicode via %HH escaping). */
function urlDecode(s) {
  if (!s.includes('%')) return s;
  try { return decodeURIComponent(s); } catch { return s; }
}

/**
 * Strip query string and fragment from a URL-reference, then URL-decode.
 * Handles CJK filenames such as s3甲部基礎練習.html and their encoded form.
 */
function cleanRef(ref) {
  return urlDecode(ref.trim().split(/[?#]/)[0].trim());
}

/**
 * Return the top-level directory name for an absolute path relative to ROOT.
 * Returns '' for root-level files, the directory name for top-level directories,
 * and null if the path escapes ROOT.
 *
 * Handles the case where a link target is a directory itself (e.g. href="ch11-flashcard/")
 * — resolves to a directory path with no path separator after ROOT.
 */
function topDir(absPath) {
  const rel = relative(ROOT, absPath);
  if (!rel || rel.startsWith('..')) return null;
  const i = rel.indexOf(sep);
  if (i < 0) {
    // No separator: either a root-level file (→ '') or a top-level directory
    // (→ rel itself).  Distinguish by checking whether the path is a directory.
    try {
      if (statSync(absPath).isDirectory()) return rel;
    } catch { /* ignore */ }
    return ''; // root-level file
  }
  return rel.slice(0, i);
}

// ─── File walker ──────────────────────────────────────────────────────────────

/** Recursively collect files with extensions in `extSet`, skipping SKIP_SCAN dirs. */
function walkFiles(dir, extSet, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!e.name.startsWith('.') && !SKIP_SCAN.has(e.name)) {
        walkFiles(join(dir, e.name), extSet, out);
      }
    } else if (e.isFile() && extSet.has(extname(e.name).toLowerCase())) {
      out.push(join(dir, e.name));
    }
  }
  return out;
}

// ─── Link extractors ──────────────────────────────────────────────────────────

/**
 * Add a link entry.  `li` = line-start index from buildLineIndex.
 */
function addLink(links, ref, pos, type, li) {
  links.push({ ref, line: lineAt(li, pos), type });
}

/**
 * Extract all internal link candidates from an HTML file (including
 * embedded <style> and <script> content).
 */
function extractHtml(src, li) {
  const links = [];
  const add = (ref, pos, type) => addLink(links, ref, pos, type, li);

  // ── HTML attributes ────────────────────────────────────────────────────────
  // href / src / action (covers <a>, <link>, <script>, <img>, <iframe>, <form>…)
  // (?<![.\w]) negative lookbehind: prevents matching JS property .href = '...'
  // (?!\s*\+)  negative lookahead:  excludes string-concat fragments 'S1Ch' + n
  for (const m of src.matchAll(/(?<![.\w])(?:href|src|action|data-src|poster)\s*=\s*"([^"]*?)"(?!\s*\+)/gi))
    add(m[1], m.index, 'attr');
  for (const m of src.matchAll(/(?<![.\w])(?:href|src|action|data-src|poster)\s*=\s*'([^']*?)'(?!\s*\+)/gi))
    add(m[1], m.index, 'attr');

  // ── CSS inside <style> blocks ──────────────────────────────────────────────
  // url("…") / url('…') / url(…)
  for (const m of src.matchAll(/\burl\s*\(\s*"([^"]+?)"\s*\)/g)) add(m[1], m.index, 'css-url');
  for (const m of src.matchAll(/\burl\s*\(\s*'([^']+?)'\s*\)/g)) add(m[1], m.index, 'css-url');
  for (const m of src.matchAll(/\burl\s*\(\s*([^"')\s][^)\s]*?)\s*\)/g)) add(m[1], m.index, 'css-url');
  // @import
  for (const m of src.matchAll(/@import\s+["']([^"']+?)["']/g)) add(m[1], m.index, 'css-import');

  // ── JavaScript inside <script> blocks and onclick="…" attributes ───────────
  // location.href = '…' / window.location.href = '…'
  // (?!\s*\+) excludes string-concat fragments like location.href = 'S1Ch' + n
  for (const m of src.matchAll(/(?:location|window\.location)\.href\s*=\s*"([^"]+?)"(?!\s*\+)/g))
    add(m[1], m.index, 'js-nav');
  for (const m of src.matchAll(/(?:location|window\.location)\.href\s*=\s*'([^']+?)'(?!\s*\+)/g))
    add(m[1], m.index, 'js-nav');

  // onclick="location.href='…'" inline style (literal, not concatenated)
  for (const m of src.matchAll(/onclick\s*=\s*["'][^"']*?location\.href\s*=\s*'([^']+?)'(?!\s*\+)[^"']*?["']/g))
    add(m[1], m.index, 'js-nav');
  for (const m of src.matchAll(/onclick\s*=\s*["'][^"']*?location\.href\s*=\s*"([^"]+?)"(?!\s*\+)[^"']*?["']/g))
    add(m[1], m.index, 'js-nav');

  // fetch('./…') or fetch('../…')  — only relative paths
  for (const m of src.matchAll(/\bfetch\s*\(\s*"([^"]+?)"/g)) add(m[1], m.index, 'fetch');
  for (const m of src.matchAll(/\bfetch\s*\(\s*'([^']+?)'/g)) add(m[1], m.index, 'fetch');

  // ── Dynamic navigation patterns (e.g. goToCh) ─────────────────────────────
  // Heuristic: detect 'SxCh' + var  or  "SxCh" + var concatenation
  for (const m of src.matchAll(/'(S\dCh)'\s*\+/g))
    add(`DYNAMIC:'${m[1]}'+N+'.html'`, m.index, 'js-dynamic');
  for (const m of src.matchAll(/"(S\dCh)"\s*\+/g))
    add(`DYNAMIC:"${m[1]}"+N+".html"`, m.index, 'js-dynamic');

  return links;
}

/** Extract links from a standalone CSS file. */
function extractCss(src, li) {
  const links = [];
  const add = (ref, pos, type) => addLink(links, ref, pos, type, li);

  for (const m of src.matchAll(/\burl\s*\(\s*"([^"]+?)"\s*\)/g)) add(m[1], m.index, 'css-url');
  for (const m of src.matchAll(/\burl\s*\(\s*'([^']+?)'\s*\)/g)) add(m[1], m.index, 'css-url');
  for (const m of src.matchAll(/\burl\s*\(\s*([^"')\s][^)\s]*?)\s*\)/g)) add(m[1], m.index, 'css-url');
  for (const m of src.matchAll(/@import\s+["']([^"']+?)["']/g)) add(m[1], m.index, 'css-import');

  return links;
}

/** Extract links from a standalone JS file. */
function extractJs(src, li) {
  const links = [];
  const add = (ref, pos, type) => addLink(links, ref, pos, type, li);

  for (const m of src.matchAll(/(?:location|window\.location)\.href\s*=\s*"([^"]+?)"/g))
    add(m[1], m.index, 'js-nav');
  for (const m of src.matchAll(/(?:location|window\.location)\.href\s*=\s*'([^']+?)'/g))
    add(m[1], m.index, 'js-nav');
  for (const m of src.matchAll(/\bfetch\s*\(\s*"([^"]+?)"/g)) add(m[1], m.index, 'fetch');
  for (const m of src.matchAll(/\bfetch\s*\(\s*'([^']+?)'/g)) add(m[1], m.index, 'fetch');
  for (const m of src.matchAll(/'(S\dCh)'\s*\+/g))
    add(`DYNAMIC:'${m[1]}'+N+'.html'`, m.index, 'js-dynamic');
  for (const m of src.matchAll(/"(S\dCh)"\s*\+/g))
    add(`DYNAMIC:"${m[1]}"+N+".html"`, m.index, 'js-dynamic');

  return links;
}

// ─── Scanner ──────────────────────────────────────────────────────────────────

const results = {
  dangling:   [],   // { file, line, type, ref, resolved }
  undeployed: [],   // { file, line, type, ref, resolved, dir }
  dynamic:    [],   // { file, line, type, ref }
  absolute:   [],   // { file, line, type, ref }
  stats: {
    filesScanned:   0,
    linksFound:     0,
    externalSkipped:0,
    danglingCount:  0,
    undeployedCount:0,
    dynamicCount:   0,
    absoluteCount:  0,
  },
};

function scanFile(filePath) {
  let src;
  try { src = readFileSync(filePath, 'utf8'); } catch { return; }

  const relFile = relative(ROOT, filePath);
  results.stats.filesScanned++;

  const ext = extname(filePath).toLowerCase();
  const li  = buildLineIndex(src);

  let rawLinks;
  if (HTML_EXTS.has(ext))      rawLinks = extractHtml(src, li);
  else if (CSS_EXTS.has(ext))  rawLinks = extractCss(src, li);
  else if (JS_EXTS.has(ext))   rawLinks = extractJs(src, li);
  else                          return;

  for (const { ref, line, type } of rawLinks) {
    results.stats.linksFound++;

    // Dynamic navigation — record for human review
    if (type === 'js-dynamic') {
      results.dynamic.push({ file: relFile, line, type, ref });
      results.stats.dynamicCount++;
      continue;
    }

    if (isExternal(ref)) {
      results.stats.externalSkipped++;
      continue;
    }

    if (isAbsPath(ref)) {
      results.absolute.push({ file: relFile, line, type, ref });
      results.stats.absoluteCount++;
      continue;
    }

    const c = cleanRef(ref);
    if (!c) { results.stats.externalSkipped++; continue; }

    // Skip template-literal placeholders (${...}) and JS string-concat fragments
    // (e.g. ' + svgUrl + ' that appear as attr values in dynamically built HTML)
    if (c.includes('${') || c.includes("' + ") || c.includes('" + ') ||
        c.includes("'+") || c.includes('+"') ||
        c.endsWith(" + '") || c.endsWith(' + "')) {
      results.stats.externalSkipped++;
      continue;
    }

    // Skip placeholder values with no file extension or path separator
    // (e.g. bare words like "URL" in code comments matched as src="URL")
    if (!c.includes('/') && !c.includes('.') && !c.includes('\\')) {
      results.stats.externalSkipped++;
      continue;
    }

    // Resolve relative to the source file's directory
    const resolved = resolve(dirname(filePath), c);

    // Must stay inside the repo root
    if (!resolved.startsWith(ROOT + sep) && resolved !== ROOT) continue;

    const resolvedRel = relative(ROOT, resolved);
    const entry = { file: relFile, line, type, ref, resolved: resolvedRel };

    if (!existsSync(resolved)) {
      results.dangling.push(entry);
      results.stats.danglingCount++;
    } else {
      // Check whether the target's top-level directory is deployed
      const td = topDir(resolved);
      if (td !== null && !CURRENTLY_DEPLOYED.has(td)) {
        results.undeployed.push({ ...entry, dir: td === '' ? '(root)' : td });
        results.stats.undeployedCount++;
      }
    }
  }
}

// ─── Collect and scan all files ───────────────────────────────────────────────

const allFiles = [
  ...walkFiles(ROOT, HTML_EXTS),
  ...walkFiles(ROOT, CSS_EXTS),
  ...walkFiles(ROOT, JS_EXTS),
];

for (const f of allFiles) scanFile(f);

// ─── Compute referenced-but-not-deployed directory summary ────────────────────

/** Unique not-deployed directories referenced from deployed pages. */
const undeployedDirSet = new Map(); // dir → Set of source files
for (const u of results.undeployed) {
  if (!undeployedDirSet.has(u.dir)) undeployedDirSet.set(u.dir, new Set());
  undeployedDirSet.get(u.dir).add(u.file);
}

// ─── Output ───────────────────────────────────────────────────────────────────

function fmt(lines) { return lines.join('\n'); }

function textReport() {
  const out = [];
  const { stats } = results;

  out.push('═══════════════════════════════════════════════════════════════════');
  out.push('  ai-lish/ai-learning — Phase 0 Link Checker Baseline');
  out.push(`  Generated: ${new Date().toISOString()}`);
  out.push('═══════════════════════════════════════════════════════════════════');
  out.push('');
  out.push('── SCAN STATISTICS ────────────────────────────────────────────────');
  out.push(`  Files scanned      : ${stats.filesScanned}`);
  out.push(`  Raw links found    : ${stats.linksFound}`);
  out.push(`  External / ignored : ${stats.externalSkipped}`);
  out.push(`  DANGLING           : ${stats.danglingCount}`);
  out.push(`  UNDEPLOYED dirs    : ${stats.undeployedCount}`);
  out.push(`  DYNAMIC (JS)       : ${stats.dynamicCount}`);
  out.push(`  ABS server paths   : ${stats.absoluteCount}`);
  out.push('');

  // ── Dangling ──────────────────────────────────────────────────────────────
  out.push('── DANGLING LINKS (target missing from repo) ──────────────────────');
  if (results.dangling.length === 0) {
    out.push('  (none)');
  } else {
    // Group by source file
    const byFile = groupBy(results.dangling, d => d.file);
    for (const [file, entries] of byFile) {
      out.push(`  ${file}`);
      for (const e of entries) {
        out.push(`    line ${String(e.line).padStart(4)} [${e.type.padEnd(10)}] → ${e.ref}`);
        out.push(`           resolved: ${e.resolved}`);
      }
    }
  }
  out.push('');

  // ── Undeployed ───────────────────────────────────────────────────────────
  out.push('── REFERENCED-BUT-NOT-DEPLOYED DIRECTORIES ────────────────────────');
  out.push('   (target file exists in repo but its directory is not published)');
  if (undeployedDirSet.size === 0) {
    out.push('  (none)');
  } else {
    for (const [dir, sources] of undeployedDirSet) {
      out.push(`  Directory: ${dir}/`);
      for (const src of sources) out.push(`    referenced from: ${src}`);
      // List specific broken entries for this dir
      const entries = results.undeployed.filter(u => u.dir === dir);
      for (const e of entries.slice(0, 10)) {
        out.push(`      line ${String(e.line).padStart(4)} [${e.type.padEnd(10)}] ${e.ref}`);
        out.push(`             → ${e.resolved}`);
      }
      if (entries.length > 10)
        out.push(`      … and ${entries.length - 10} more`);
    }
  }
  out.push('');

  // ── Dynamic navigation ────────────────────────────────────────────────────
  out.push('── DYNAMIC JS NAVIGATION (needs human review after Phase 3) ───────');
  if (results.dynamic.length === 0) {
    out.push('  (none detected)');
  } else {
    // Deduplicate by (file, pattern)
    const seen = new Set();
    const dedup = results.dynamic.filter(d => {
      const k = `${d.file}::${d.ref}`;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    const byFile = groupBy(dedup, d => d.file);
    for (const [file, entries] of byFile) {
      out.push(`  ${file}`);
      for (const e of entries) {
        out.push(`    line ${String(e.line).padStart(4)} [${e.type.padEnd(10)}] ${e.ref}`);
      }
    }
  }
  out.push('');

  // ── Absolute paths ────────────────────────────────────────────────────────
  out.push('── ABSOLUTE SERVER PATHS (/ prefix — not checked for existence) ───');
  out.push('   (Must resolve under /ai-learning/; root / paths are broken)');
  if (results.absolute.length === 0) {
    out.push('  (none)');
  } else {
    // Deduplicate consecutive same refs
    const byFile = groupBy(results.absolute, d => d.file);
    for (const [file, entries] of byFile) {
      out.push(`  ${file}`);
      for (const e of entries) {
        out.push(`    line ${String(e.line).padStart(4)} [${e.type.padEnd(10)}] ${e.ref}`);
      }
    }
  }
  out.push('');

  // ── ch11-geometry-flashcard specific check ───────────────────────────────
  out.push('── ch11-geometry-flashcard/ DEPLOYMENT STATUS ──────────────────────');
  const ch11InDeployed = CURRENTLY_DEPLOYED.has('ch11-geometry-flashcard');
  out.push(`  In current deploy whitelist: ${ch11InDeployed ? 'YES ✓' : 'NO ✗'}`);
  const ch11Refs = results.undeployed.filter(u => u.dir === 'ch11-geometry-flashcard');
  const ch11DanglingRefs = results.dangling.filter(
    d => d.resolved.startsWith('ch11-geometry-flashcard')
  );
  out.push(`  Referenced as UNDEPLOYED: ${ch11Refs.length} link(s)`);
  out.push(`  Dangling references to it: ${ch11DanglingRefs.length}`);
  if (ch11Refs.length > 0) {
    out.push('  Detail:');
    for (const e of ch11Refs) {
      out.push(`    ${e.file}:${e.line} → ${e.ref}`);
    }
  }
  out.push('');

  out.push('═══════════════════════════════════════════════════════════════════');
  out.push('  END OF REPORT');
  out.push('═══════════════════════════════════════════════════════════════════');

  return fmt(out);
}

function groupBy(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  }
  return map;
}

// ─── Write output ─────────────────────────────────────────────────────────────

const report = useJson ? JSON.stringify(results, null, 2) : textReport();

if (outFile) {
  const dir = outFile.split('/').slice(0, -1).join('/');
  if (dir) {
    try { mkdirSync(dir, { recursive: true }); } catch {}
  }
  writeFileSync(outFile, report, 'utf8');
  console.log(`Report written to: ${outFile}`);
} else {
  console.log(report);
}

// Exit code: 1 if any dangling links found
process.exit(results.stats.danglingCount > 0 ? 1 : 0);
