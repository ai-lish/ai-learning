#!/usr/bin/env python3
"""
HKDSE P2 Step1 Full Vision Verification using MiniMax Vision API
Verifies all 495 OCR results against source images using MiniMax Vision.
Uses the same API endpoint as the original OCR.
"""
import json
import os
import sys
import time
import base64
import threading
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

# Config
JSON_PATH = "/Users/zachli/ai-learning/hkdse/pages/p2_final_results.json"
IMAGES_DIR = "/Users/zachli/ai-learning/hkdse/ocr-output/images-p2"
OUTPUT_DIR = "/Users/zachli/ai-learning/logs"
ANNOTATED_DIR = "/Users/zachli/ai-learning/hkdse/images/recheck-samples/annotated"
PROGRESS_FILE = "/Users/zachli/ai-learning/logs/hkdse_p2_step1_progress.json"
REPORT_FILE = "/Users/zachli/ai-learning/logs/pdf_vs_ocr_report_20260412_full_minimax.json"
SUMMARY_MD = "/Users/zachli/ai-learning/logs/pdf_vs_ocr_summary_20260412_full_minimax.md"
STEP1_SUMMARY = "/Users/zachli/ai-learning/logs/hkdse_p2_step1_summary_full_minimax.json"
VAULT_FILE = os.path.expanduser("~/.openclaw/secrets.json")

API_URL = "https://api.minimax.io/v1/coding_plan/vlm"
CONCURRENCY = 4
MAX_RETRIES = 2
REQUEST_TIMEOUT = 120
BATCH_PROGRESS = 25
OVERALL_TIMEOUT = 7200

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ANNOTATED_DIR, exist_ok=True)

# Load API key
def get_api_key():
    with open(VAULT_FILE) as f:
        secrets = json.load(f)
    return secrets.get("minimax-api-key", "")

API_KEY = get_api_key()
if not API_KEY:
    print("ERROR: No MiniMax API key found!")
    sys.exit(1)
print(f"API key loaded: {API_KEY[:10]}...")

# Load questions
with open(JSON_PATH) as f:
    questions = json.load(f)

question_ids = sorted(questions.keys())
total = len(question_ids)
print(f"Loaded {total} questions: {question_ids[0]} to {question_ids[-1]}")

# Progress tracking
progress_lock = threading.Lock()
progress = {
    "started_at": datetime.now().isoformat(),
    "total": total,
    "processed": 0,
    "pass_count": 0,
    "fail_count": 0,
    "error_count": 0,
    "errors": []
}

def save_progress():
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2, ensure_ascii=False)

def save_report(results):
    with open(REPORT_FILE, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

def encode_image(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def call_minimax_vision(image_path, ocr_text, question_id):
    """Call MiniMax Vision API to compare image with OCR text."""
    import urllib.request
    import urllib.error
    
    b64_image = encode_image(image_path)
    
    payload = {
        "prompt": f"""You are verifying OCR output from a math exam question image.

STORED OCR TEXT:
{ocr_text}

TASK: Look at the image and compare it with the stored OCR text above. Check carefully for:
1. Chinese character errors (wrong/missing/substituted characters)
2. Mathematical notation errors (LaTeX math expressions)
3. Number errors
4. Question structure errors

Respond ONLY with valid JSON (no markdown, no explanation):
{{"match_score": 0.0-1.0, "mismatch_type": "none|typo|format|math_symbol|missing_text", "explanation": "brief explanation"}}

match_score: 1.0 = perfect match, 0.0 = completely different
mismatch_type: "none" if score >= 0.9, otherwise typo/format/math_symbol/missing_text""",
        "image_url": f"data:image/jpeg;base64,{b64_image}"
    }
    
    data = json.dumps(payload).encode("utf-8")
    
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    for attempt in range(MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                content = result.get("content", "")
                if not content:
                    return {
                        "match_score": 0.0,
                        "mismatch_type": "error",
                        "explanation": "Empty response from API"
                    }
                # Try to extract JSON
                try:
                    # Remove markdown code blocks
                    content_clean = content.strip()
                    if content_clean.startswith("```"):
                        lines = content_clean.split("\n")
                        if lines[-1].startswith("```"):
                            content_clean = "\n".join(lines[1:-1])
                        else:
                            content_clean = "\n".join(lines[1:])
                    # Find JSON object
                    start = content_clean.find("{")
                    end = content_clean.rfind("}") + 1
                    if start >= 0 and end > start:
                        parsed = json.loads(content_clean[start:end])
                        return parsed
                    return {
                        "match_score": 0.0,
                        "mismatch_type": "error",
                        "explanation": f"Could not find JSON in response: {content[:200]}"
                    }
                except json.JSONDecodeError as e:
                    return {
                        "match_score": 0.0,
                        "mismatch_type": "error",
                        "explanation": f"JSON parse error: {str(e)}, content: {content[:200]}"
                    }
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")[:300] if e.fp else ""
            if e.code == 429 or "rate" in err_body.lower():
                if attempt < MAX_RETRIES:
                    time.sleep(10 * (attempt + 1))
                    continue
            return {
                "match_score": 0.0,
                "mismatch_type": "error",
                "explanation": f"HTTP {e.code}: {err_body[:150]}"
            }
        except Exception as e:
            if attempt < MAX_RETRIES:
                time.sleep(3 * (attempt + 1))
                continue
            return {
                "match_score": 0.0,
                "mismatch_type": "error",
                "explanation": str(e)
            }
    
    return {
        "match_score": 0.0,
        "mismatch_type": "error",
        "explanation": "Max retries exceeded"
    }

def process_question(qid, qdata, idx):
    image_path = qdata.get("path", "")
    
    if not os.path.exists(image_path):
        alt_path = os.path.join(IMAGES_DIR, f"{qid}.jpg")
        if os.path.exists(alt_path):
            image_path = alt_path
        else:
            return {
                "question_id": qid,
                "index": idx,
                "status": "error",
                "error": f"Image not found: {image_path} or {alt_path}",
                "match_score": None,
                "mismatch_type": None,
                "explanation": None
            }
    
    ocr_text = qdata.get("ocr_text", qdata.get("question", ""))
    
    result = call_minimax_vision(image_path, ocr_text, qid)
    
    return {
        "question_id": qid,
        "index": idx,
        "image_path": image_path,
        "ocr_text": ocr_text,
        "match_score": result.get("match_score", 0.0),
        "mismatch_type": result.get("mismatch_type", "unknown"),
        "explanation": result.get("explanation", ""),
        "status": "ok"
    }

def main():
    start_time = time.time()
    results = []
    
    def do_batch(items):
        batch_results = []
        with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
            futures = {
                executor.submit(process_question, qid, questions[qid], idx): (qid, idx)
                for qid, idx in items
            }
            for future in as_completed(futures):
                try:
                    result = future.result()
                    batch_results.append(result)
                except Exception as e:
                    qid, idx = futures[future]
                    batch_results.append({
                        "question_id": qid,
                        "index": idx,
                        "status": "error",
                        "error": str(e),
                        "match_score": None,
                        "mismatch_type": None,
                        "explanation": str(e)
                    })
        return batch_results
    
    items = [(qid, idx) for idx, qid in enumerate(question_ids)]
    
    for batch_start in range(0, total, CONCURRENCY):
        elapsed = time.time() - start_time
        if elapsed > OVERALL_TIMEOUT:
            print(f"TIMEOUT at {elapsed:.0f}s, stopping")
            break
        
        batch_items = items[batch_start:batch_start + CONCURRENCY]
        batch_results = do_batch(batch_items)
        results.extend(batch_results)
        
        with progress_lock:
            for r in batch_results:
                progress["processed"] += 1
                if r.get("status") == "error":
                    progress["error_count"] += 1
                    progress["errors"].append({
                        "question_id": r["question_id"],
                        "error": r.get("error", r.get("explanation", ""))
                    })
                elif r.get("match_score", 0) >= 0.8:
                    progress["pass_count"] += 1
                else:
                    progress["fail_count"] += 1
        
        save_progress()
        
        processed = progress["processed"]
        elapsed = time.time() - start_time
        rate = processed / elapsed if elapsed > 0 else 0
        
        print(f"[{processed}/{total}] pass={progress['pass_count']} fail={progress['fail_count']} err={progress['error_count']} | {elapsed:.0f}s")
        
        save_report(results)
    
    save_report(results)
    
    pass_count = progress["pass_count"]
    fail_count = progress["fail_count"]
    error_count = progress["error_count"]
    processed = progress["processed"]
    
    mismatch_counts = {}
    for r in results:
        mt = r.get("mismatch_type", "unknown")
        mismatch_counts[mt] = mismatch_counts.get(mt, 0) + 1
    
    # Also collect a sample of scores for the summary
    scores = [r.get("match_score", 0) for r in results if r.get("match_score") is not None]
    avg_score = sum(scores) / len(scores) if scores else 0
    
    # Generate markdown summary
    summary_md = f"""# PDF vs OCR Verification Summary — HKDSE P2 (MiniMax Vision) — {datetime.now().strftime('%Y-%m-%d %H:%M')}

## Overview

- **Total questions:** {total}
- **Processed:** {processed}
- **Pass (match_score >= 0.8):** {pass_count}
- **Fail (match_score < 0.8):** {fail_count}
- **Errors:** {error_count}
- **Pass rate:** {pass_count/processed*100:.1f}% (of processed)
- **Average match_score:** {avg_score:.3f}

## Method

- **OCR source:** Minimax VLM stored in `p2_final_results.json`
- **Verification:** MiniMax Vision (second independent pass) on original images
- **Scoring:** match_score 0..1 (1 = perfect match, comparing stored OCR vs what model sees in image)
- **Threshold:** >= 0.8 = pass

## Mismatch Type Breakdown

| Type | Count |
|------|-------|
"""
    for mt, cnt in sorted(mismatch_counts.items(), key=lambda x: -x[1]):
        summary_md += f"| {mt} | {cnt} |\n"
    
    # Show sample failures (first 20)
    failures = [r for r in results if r.get("match_score", 1) < 0.8 and r.get("status") == "ok"][:20]
    if failures:
        summary_md += f"""
## Sample Failures (first 20 of {fail_count})

| QID | Score | Type | Explanation |
|-----|-------|------|-------------|
"""
        for r in failures:
            exp = r.get("explanation", "")[:80].replace("\n", " ")
            summary_md += f"| {r['question_id']} | {r['match_score']:.2f} | {r['mismatch_type']} | {exp} |\n"
    
    with open(SUMMARY_MD, "w") as f:
        f.write(summary_md)
    
    step1_summary = {
        "status": "OK" if processed > 0 else "ERROR",
        "processed": processed,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "error_count": error_count,
        "warnings": [],
        "completed_at": datetime.now().isoformat(),
        "elapsed_seconds": time.time() - start_time,
        "mismatch_types": mismatch_counts,
        "avg_match_score": avg_score
    }
    
    if error_count > 0:
        step1_summary["warnings"].append(f"{error_count} questions had errors")
    if processed < total:
        step1_summary["warnings"].append(f"Only processed {processed}/{total} due to timeout")
        step1_summary["status"] = "PARTIAL"
    
    with open(STEP1_SUMMARY, "w") as f:
        json.dump(step1_summary, f, indent=2, ensure_ascii=False)
    
    print(f"\nDONE!")
    print(f"   Report: {REPORT_FILE}")
    print(f"   Summary MD: {SUMMARY_MD}")
    print(f"   Step1 JSON: {STEP1_SUMMARY}")
    print(f"   Status: {step1_summary['status']}")
    print(f"   Pass: {pass_count}, Fail: {fail_count}, Error: {error_count}")
    print(f"   Avg score: {avg_score:.3f}")

if __name__ == "__main__":
    main()
