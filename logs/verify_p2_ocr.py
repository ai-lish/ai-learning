#!/usr/bin/env python3
"""
HKDSE P2 PDF vs OCR sampled verification (20 questions)
Seed: 20260412
Compares Minimax VLM OCR text against Tesseract OCR on same images.
LaTeX-aware normalization for math-heavy content.
"""
import json, os, random, subprocess, re
from pathlib import Path

BASE = Path.home() / "ai-learning"
OCR_JSON = BASE / "hkdse/pages/p2_final_results.json"
IMAGES_DIR = BASE / "hkdse/ocr-output/images-p2"
OUT_REPORT = BASE / "logs/pdf_vs_ocr_report_20260412.json"
OUT_SUMMARY = BASE / "logs/pdf_vs_ocr_summary_20260412.md"
OUT_SUMMARY_JSON = BASE / "logs/hkdse_p2_step1_summary.json"

def make_image_path(qid, json_path):
    if json_path and os.path.exists(json_path):
        return json_path
    constructed = IMAGES_DIR / (qid + ".jpg")
    return str(constructed) if constructed.exists() else None

with open(OCR_JSON) as f:
    ocr_data = json.load(f)

# Only questions with non-empty OCR text
has_ocr = {k: v for k, v in ocr_data.items() if v.get("ocr_text", "").strip()}
print(f"Total: {len(ocr_data)}, with OCR text: {len(has_ocr)}")

valid_keys = []
for k in has_ocr:
    path = ocr_data[k].get("path", "")
    if make_image_path(k, path):
        valid_keys.append(k)
print(f"With images: {len(valid_keys)}")

valid_keys_sorted = sorted(valid_keys)
n = len(valid_keys_sorted)

# Stratified: early 7, mid 7, late 6
e = max(1, n // 10)
m_start = n // 2 - e
m_end = n // 2 + e

strata = {
    "early": valid_keys_sorted[:e*4],
    "mid":   valid_keys_sorted[m_start:m_end],
    "late":  valid_keys_sorted[-e*4:],
}
print(f"Strata: early={len(strata['early'])}, mid={len(strata['mid'])}, late={len(strata['late'])}")

random.seed(20260412)
samples = []
for label, keys in strata.items():
    n_s = 7 if label != "late" else 6
    chosen = random.sample(keys, min(n_s, len(keys)))
    samples.extend([(k, label) for k in chosen])
samples = samples[:20]
print(f"\nSampled {len(samples)} questions:")
for k, l in samples:
    print(f"  {k} ({l}) — chars: {len(ocr_data[k].get('ocr_text',''))}")

def extract_math_latex(text):
    """Extract LaTeX math content: $...$ and \[ ... \] blocks."""
    parts = re.findall(r'\$\$?([\s\S]*?)\$\$?', text)
    return " ".join(parts).strip()

def extract_plain(text):
    """Strip all LaTeX, keep only plain alphanumeric + basic punctuation."""
    # Remove inline and display math
    text = re.sub(r'\$\$?([\s\S]*?)\$\$?', r'\1', text)
    # Remove remaining LaTeX commands
    text = re.sub(r'\\[a-zA-Z]+', ' ', text)
    # Remove braces, brackets, carets, underscores
    text = re.sub(r'[{}^_]', ' ', text)
    # Lowercase
    text = text.lower()
    # Remove non-alphanumeric except spaces
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def token_overlap(s1, s2):
    t1 = set(extract_plain(s1).split())
    t2 = set(extract_plain(s2).split())
    if not t1 and not t2: return 1.0
    if not t1 or not t2: return 0.0
    inter = len(t1 & t2)
    union = len(t1 | t2)
    return inter / union if union else 0.0

def math_overlap(s1, s2):
    """Compare LaTeX math expressions after normalization."""
    m1 = extract_math_latex(s1)
    m2 = extract_math_latex(s2)
    # Normalize: remove spaces, lower
    n1 = re.sub(r'\s+', '', m1).lower()
    n2 = re.sub(r'\s+', '', m2).lower()
    if not n1 and not n2: return 1.0
    if not n1 or not n2: return 0.0
    # Simple token overlap on normalized math tokens
    tokens1 = set(re.findall(r'[a-z0-9]+', n1))
    tokens2 = set(re.findall(r'[a-z0-9]+', n2))
    if not tokens1 and not tokens2: return 1.0
    if not tokens1 or not tokens2: return 0.0
    inter = len(tokens1 & tokens2)
    union = len(tokens1 | tokens2)
    return inter / union if union else 0.0

def run_tesseract(img_path):
    try:
        r = subprocess.run(
            ["tesseract", str(img_path), "stdout", "-l", "eng", "--psm", "6",
             "-c", "tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,+-=(){}[]<> /\\|$@#%^&_~?"],
            capture_output=True, text=True, timeout=30
        )
        return r.stdout if r.returncode == 0 else None
    except Exception as e:
        return None

report_entries = []
failures = []

for idx, (qid, stratum) in enumerate(samples, 1):
    entry = ocr_data.get(qid, {})
    json_path = entry.get("path", "")
    resolved = make_image_path(qid, json_path)

    if not resolved:
        failures.append({"question_id": qid, "sample_index": idx, "error": "image_not_found"})
        continue

    ocr_text = entry.get("ocr_text", "")
    tess_text = run_tesseract(resolved)

    if tess_text is None:
        failures.append({"question_id": qid, "sample_index": idx, "error": "tesseract_failed"})
        continue

    # Multiple scoring approaches
    plain_score = token_overlap(ocr_text, tess_text)
    math_score = math_overlap(ocr_text, tess_text)
    # Weighted: 40% plain overlap, 60% math overlap (math is the content)
    match_score = round(0.4 * plain_score + 0.6 * math_score, 4)
    # Threshold: 0.35 for LaTeX vs plain comparison
    match_bool = match_score >= 0.35

    if not match_bool:
        failures.append({"question_id": qid, "sample_index": idx, "error": "low_match", "score": match_score})

    print(f"[{idx}] {qid} ({stratum}): plain={plain_score:.3f}, math={math_score:.3f}, combined={match_score:.3f}, match={match_bool}")
    print(f"     OCR [{len(ocr_text)}]: {repr(ocr_text[:100])}")
    print(f"     TESS [{len(tess_text)}]: {repr(tess_text[:100])}")

    report_entries.append({
        "question_id": qid,
        "sample_index": idx,
        "stratum": stratum,
        "ocr_text_snippet": ocr_text[:300],
        "image_text_snippet": tess_text[:300],
        "plain_overlap_score": round(plain_score, 4),
        "math_overlap_score": round(math_score, 4),
        "match_score": match_score,
        "match_boolean": match_bool,
        "notes": f"Tesseract vs Minimax VLM; image={os.path.basename(resolved)}"
    })

# Reports
with open(OUT_REPORT, "w") as f:
    json.dump(report_entries, f, ensure_ascii=False, indent=2)
print(f"\nReport: {OUT_REPORT}")

pass_count = len([e for e in report_entries if e["match_boolean"]])
fail_count = len(failures)

summary_md = [
    "# PDF vs OCR Verification Summary — HKDSE P2 (2026-04-12)\n",
    "## Overview\n",
    f"- **Questions with OCR text:** {len(has_ocr)} / {len(ocr_data)}",
    f"- **Sampled:** {len(samples)} (stratified: early/mid/late, seed=20260412)",
    f"- **Processed:** {len(report_entries)}",
    f"- **Failures:** {fail_count}",
    f"- **Passes:** {pass_count}",
    f"- **Pass rate:** {round(pass_count/len(report_entries)*100,1) if report_entries else 'N/A'}%\n",
    "## Method\n",
    "- **OCR source:** Minimax VLM (minimax-vlm) stored in `p2_final_results.json`",
    "- **Verification:** Tesseract 5.5.2 on same image",
    "- **Scoring:** 40% plain-text token overlap + 60% LaTeX math overlap",
    "- **Threshold:** ≥ 0.35 = pass (adjusted for LaTeX vs plain text mismatch)\n",
    "## Failures\n",
]
if failures:
    for f in failures:
        summary_md.append(f"- `{f['question_id']}` (index {f['sample_index']}): {f['error']}")
else:
    summary_md.append("No failures recorded.\n")

scores = [e["match_score"] for e in report_entries]
summary_md.extend([
    "## Score Distribution\n",
    f"- Min: {min(scores):.4f}, Max: {max(scores):.4f}, Avg: {sum(scores)/len(scores):.4f}\n",
    "## All Samples\n",
    "| # | QID | Stratum | Plain | Math | **Score** | Pass | Notes |\n",
    "|---|-----|---------|-------|------|-----------|------|-------|\n",
])
for e in report_entries:
    summary_md.append(
        f"| {e['sample_index']} | `{e['question_id']}` | {e['stratum']} | "
        f"{e['plain_overlap_score']:.3f} | {e['math_overlap_score']:.3f} | "
        f"**{e['match_score']:.3f}** | {'✅' if e['match_boolean'] else '❌'} | "
        f"{e['notes']} |"
    )

with open(OUT_SUMMARY, "w") as f:
    f.write("\n".join(summary_md))

step = {
    "status": "complete",
    "processed_samples": len(report_entries),
    "failures": fail_count,
    "passes": pass_count,
    "pass_rate": round(pass_count/len(report_entries)*100,1) if report_entries else None,
    "method": "Tesseract vs Minimax VLM, LaTeX-aware scoring, threshold=0.35",
    "warnings": [f["error"] for f in failures],
}
with open(OUT_SUMMARY_JSON, "w") as f:
    json.dump(step, f, ensure_ascii=False, indent=2)

print(f"Summary: {OUT_SUMMARY}")
print(f"Step JSON: {OUT_SUMMARY_JSON}")
