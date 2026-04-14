#!/usr/bin/env python3
"""
HKDSE P2 Dual-Path Verification Processor
Processes all 495 questions comparing Vision path vs OCR-text path
"""

import json
import os
import sys
import time
import base64
import subprocess
from pathlib import Path
from datetime import datetime

# Paths
BASE_DIR = Path.home() / "ai-learning"
PAGES_JSON = BASE_DIR / "hkdse/pages/p2_final_results.json"
IMAGES_DIR = BASE_DIR / "hkdse/images-p2"
EVIDENCE_DIR = BASE_DIR / "hkdse/evidence"
LOGS_DIR = BASE_DIR / "logs"
PROGRESS_FILE = LOGS_DIR / "p2_test_progress.json"
HISTORY_FILE = LOGS_DIR / "p2_progress_history.log"
FULL_REPORT_FILE = LOGS_DIR / "p2_dualpath_compare_full_20260412.json"
SUMMARY_FILE = LOGS_DIR / "p2_dualpath_summary_20260412.md"

# Load API key
with open(Path.home() / ".openclaw/secrets.json") as f:
    secrets = json.load(f)
API_KEY = secrets.get("minimax-api-key", "")
if not API_KEY:
    print("ERROR: minimax-api-key not found in secrets")
    sys.exit(1)

# Load pages data
print(f"Loading pages data from {PAGES_JSON}...")
with open(PAGES_JSON) as f:
    pages_data = json.load(f)
question_ids = sorted(pages_data.keys())
print(f"Loaded {len(question_ids)} questions")

# Ensure directories exist
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

def call_minimax_vision(image_path: str, retry_count=0) -> dict:
    """Call MiniMax Vision API with image"""
    with open(image_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode()
    
    import urllib.request
    
    payload = {
        "model": "MiniMax-VL-01",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}},
                    {"type": "text", "text": "Read the attached image of a HKDSE math question (Chinese + math notation). Output JSON {visible_text: '...', answer: '...', reasoning: 'brief steps (1-2 lines)'}."}
                ]
            }
        ],
        "max_tokens": 512,
        "temperature": 0.1
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.minimax.chat/v1/chat/completions?GroupId=1723083103284005",
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
            content = result["choices"][0]["message"]["content"]
            # Try to parse as JSON
            try:
                return json.loads(content)
            except:
                return {"raw": content, "error": "Failed to parse JSON"}
    except Exception as e:
        if retry_count < 2:
            wait = 2 ** retry_count * 5
            print(f"  Vision API error (retry {retry_count+1}): {e}, waiting {wait}s")
            time.sleep(wait)
            return call_minimax_vision(image_path, retry_count + 1)
        return {"error": str(e), "retry_count": retry_count}

def call_minimax_m2(text: str, retry_count=0) -> dict:
    """Call MiniMax M2.7 API with text"""
    import urllib.request
    
    prompt = f"""Read this OCR text (Chinese + LaTeX). Output JSON {{"visible_text": "...", "answer": "...", "reasoning": "brief steps"}}.

OCR TEXT:
{text}

Output JSON only, no markdown formatting:"""

    payload = {
        "model": "MiniMax-M2.7",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 512,
        "temperature": 0.1
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.minimax.chat/v1/chat/completions?GroupId=1723083103284005",
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
            content = result["choices"][0]["message"]["content"]
            try:
                return json.loads(content)
            except:
                return {"raw": content, "error": "Failed to parse JSON"}
    except Exception as e:
        if retry_count < 2:
            wait = 2 ** retry_count * 5
            print(f"  M2 API error (retry {retry_count+1}): {e}, waiting {wait}s")
            time.sleep(wait)
            return call_minimax_m2(text, retry_count + 1)
        return {"error": str(e), "retry_count": retry_count}

def normalize_text(t: str) -> str:
    """Normalize text for comparison"""
    if not t:
        return ""
    import re
    # Lowercase, remove extra spaces, normalize LaTeX
    t = t.lower().strip()
    t = re.sub(r'\s+', ' ', t)
    # Normalize common LaTeX variants
    t = t.replace('\\,', ' ')
    t = t.replace('\\ ', ' ')
    t = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'(\1)/(\2)', t)
    t = re.sub(r'\\sqrt\{([^}]+)\}', r'sqrt(\1)', t)
    t = re.sub(r'\$+', '', t)
    return t

def normalize_answer(a: str) -> str:
    """Normalize answer for comparison"""
    if not a:
        return ""
    import re
    a = a.lower().strip()
    a = re.sub(r'\s+', '', a)
    a = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'(\1)/(\2)', a)
    a = re.sub(r'\\sqrt\{([^}]+)\}', r'sqrt(\1)', a)
    a = re.sub(r'\$+', '', a)
    a = re.sub(r'\\text\{([^}]+)\}', r'\1', a)
    # Extract just the letter if it's a multiple choice answer
    letter_match = re.search(r'\b([a-d])\b', a)
    if letter_match:
        return letter_match.group(1)
    return a

def compare_values(v1, v2, tolerance=0.01):
    """Compare two values with numeric tolerance"""
    try:
        n1 = float(v1)
        n2 = float(v2)
        return abs(n1 - n2) < tolerance
    except:
        return str(v1).strip().lower() == str(v2).strip().lower()

def update_progress(completed, total, pass_count, fail_count):
    """Write progress snapshot"""
    progress = {
        "completed": completed,
        "remaining": total - completed,
        "last_updated": datetime.now().isoformat(),
        "pass_count": pass_count,
        "fail_count": fail_count,
        "total": total
    }
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)
    
    # Also append to history
    with open(HISTORY_FILE, "a") as f:
        f.write(f"{datetime.now().isoformat()} | {completed}/{total} | pass={pass_count} fail={fail_count}\n")

# Main processing loop
results = []
pass_count = 0
fail_count = 0
total = len(question_ids)

print(f"Starting dual-path verification of {total} questions...")
print(f"Evidence dir: {EVIDENCE_DIR}")
print(f"Images dir: {IMAGES_DIR}")

start_time = time.time()

for i, qid in enumerate(question_ids):
    qdata = pages_data[qid]
    ocr_text = qdata.get("ocr_text", "")
    
    # Get image path
    year = qid[:4]
    qnum = qid[5:]  # e.g., "Q01" -> "01" but we need to check actual image naming
    # Images are like 2012Q01.jpg
    img_path = IMAGES_DIR / f"{year}Q{int(qnum):02d}.jpg"
    
    if not img_path.exists():
        print(f"[{i+1}/{total}] {qid}: Image not found at {img_path}, skipping vision path")
        a_result = {"error": "Image not found"}
    else:
        a_result = call_minimax_vision(str(img_path))
    
    b_result = call_minimax_m2(ocr_text)
    
    # Extract visible text
    a_visible = a_result.get("visible_text", a_result.get("raw", "")) if "error" not in a_result else ""
    b_visible = b_result.get("visible_text", b_result.get("raw", "")) if "error" not in b_result else ""
    
    # Extract answers
    a_answer = a_result.get("answer", "") if "error" not in a_result else ""
    b_answer = b_result.get("answer", "") if "error" not in b_result else ""
    
    # Normalize
    a_visible_norm = normalize_text(a_visible)
    b_visible_norm = normalize_text(b_visible)
    a_answer_norm = normalize_answer(a_answer)
    b_answer_norm = normalize_answer(b_answer)
    
    # Compare
    text_match = (a_visible_norm == b_visible_norm) or (a_visible_norm in b_visible_norm) or (b_visible_norm in a_visible_norm)
    answer_match = compare_values(a_answer_norm, b_answer_norm)
    
    q_result = {
        "qid": qid,
        "a_result": a_result,
        "b_result": b_result,
        "a_visible": a_visible,
        "b_visible": b_visible,
        "a_answer": a_answer,
        "b_answer": b_answer,
        "text_match": text_match,
        "answer_match": answer_match,
        "timestamp": datetime.now().isoformat()
    }
    
    if not text_match or not answer_match:
        fail_count += 1
        mismatch_type = []
        if not text_match:
            mismatch_type.append("text_mismatch")
        if not answer_match:
            mismatch_type.append("answer_mismatch")
        q_result["mismatch_type"] = mismatch_type
        
        # Save evidence
        evidence_a = {
            "qid": qid,
            "path": "A (Vision)",
            "result": a_result,
            "visible_text": a_visible,
            "answer": a_answer
        }
        evidence_b = {
            "qid": qid,
            "path": "B (OCR-Text)",
            "result": b_result,
            "visible_text": b_visible,
            "answer": b_answer
        }
        
        ev_dir = EVIDENCE_DIR / qid
        ev_dir.mkdir(exist_ok=True)
        
        with open(ev_dir / f"{qid}_A_vision.json", "w") as f:
            json.dump(evidence_a, f, indent=2, ensure_ascii=False)
        with open(ev_dir / f"{qid}_B_ocrtext.json", "w") as f:
            json.dump(evidence_b, f, indent=2, ensure_ascii=False)
        
        # Copy image as evidence if it exists
        if img_path.exists():
            import shutil
            shutil.copy(str(img_path), str(ev_dir / f"{qid}_image.jpg"))
    else:
        pass_count += 1
    
    results.append(q_result)
    
    # Progress update every 50
    if (i + 1) % 50 == 0:
        elapsed = time.time() - start_time
        print(f"[{i+1}/{total}] Processed. Pass={pass_count} Fail={fail_count} Elapsed={elapsed:.1f}s")
        update_progress(i + 1, total, pass_count, fail_count)
    
    # Small delay to avoid rate limits
    if (i + 1) % 10 == 0:
        time.sleep(0.5)

# Final update
update_progress(total, total, pass_count, fail_count)

# Save full report
print(f"Saving full report with {len(results)} results...")
with open(FULL_REPORT_FILE, "w") as f:
    json.dump({
        "summary": {
            "total": total,
            "pass_count": pass_count,
            "fail_count": fail_count,
            "pass_rate": f"{100*pass_count/total:.1f}%",
            "completed_at": datetime.now().isoformat(),
            "elapsed_seconds": time.time() - start_time
        },
        "results": results
    }, f, indent=2, ensure_ascii=False)

# Save human-readable summary
summary_md = f"""# HKDSE P2 Dual-Path Verification Summary

## Overview
- **Total Questions:** {total}
- **Passed (Match):** {pass_count}
- **Failed (Mismatch):** {fail_count}
- **Pass Rate:** {100*pass_count/total:.1f}%
- **Completed:** {datetime.now().isoformat()}
- **Elapsed:** {time.time() - start_time:.1f} seconds

## Methodology
- **Path A (Vision):** MiniMax Vision model reading original PDF images
- **Path B (OCR-Text):** MiniMax M2.7 model reading OCR-extracted text (LaTeX format)
- **Match Criteria:** Normalized text similarity + answer comparison

## Mismatches (Evidence)
"""

mismatches = [r for r in results if r.get("mismatch_type")]
for r in mismatches:
    summary_md += f"""
### {r['qid']}
- **Mismatch Types:** {', '.join(r.get('mismatch_type', []))}
- **A Answer:** {r.get('a_answer', 'N/A')}
- **B Answer:** {r.get('b_answer', 'N/A')}
- **Evidence:** ~/ai-learning/hkdse/evidence/{r['qid']}/
"""

with open(SUMMARY_FILE, "w") as f:
    f.write(summary_md)

print(f"""
=== PROCESSING COMPLETE ===
Total: {total}
Pass: {pass_count}
Fail: {fail_count}
Pass Rate: {100*pass_count/total:.1f}%
Elapsed: {time.time() - start_time:.1f}s
Full report: {FULL_REPORT_FILE}
Summary: {SUMMARY_FILE}
Evidence dir: {EVIDENCE_DIR}
""")
