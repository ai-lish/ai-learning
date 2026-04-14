#!/usr/bin/env python3
"""
HKDSE P2 Dual-Path Verification
Path A: MiniMax Vision → extract visible_text and answer from image
Path B: MiniMax Text (M2.7) → extract normalized visible_text and answer from OCR text
Compare: text_match and answer_match
"""
import json, os, sys, time, base64, re, urllib.request, urllib.error
from datetime import datetime
from pathlib import Path

# === YEAR FILTER (optional) ===
# Run with: python3 dualpath_verify_p2.py [year]
# e.g. python3 dualpath_verify_p2.py 2012
YEAR_FILTER = sys.argv[1] if len(sys.argv) > 1 else None

# === CONFIG ===
JSON_PATH = "/Users/zachli/ai-learning/hkdse/pages/p2_final_results.json"
IMAGES_DIR = "/Users/zachli/ai-learning/hkdse/ocr-output/images-p2"
OUTPUT_DIR = "/Users/zachli/ai-learning/logs"
EVIDENCE_DIR = "/Users/zachli/ai-learning/hkdse/evidence"
VAULT_FILE = os.path.expanduser("~/.openclaw/secrets.json")

VISION_URL = "https://api.minimax.io/v1/coding_plan/vlm"
TEXT_URL = "https://api.minimax.io/v1/text/chatcompletion_v2"
TEXT_MODEL = "MiniMax-M2.7"

MAX_RETRIES = 2
REQUEST_TIMEOUT = 120
BATCH_PROGRESS = 25
RUN_START = time.time()
MAX_RUNTIME = 3 * 3600 - 300  # 3 hours minus 5 min buffer

os.makedirs(OUTPUT_DIR, exist_ok=True)
# Year-specific evidence dir
if YEAR_FILTER:
    EVIDENCE_DIR = f"/Users/zachli/ai-learning/hkdse/evidence/{YEAR_FILTER}"
os.makedirs(EVIDENCE_DIR, exist_ok=True)

# === LOAD API KEY ===
def get_api_key():
    with open(VAULT_FILE) as f:
        return json.load(f).get("minimax-api-key", "")
API_KEY = get_api_key()
if not API_KEY:
    print("ERROR: No API key!")
    sys.exit(1)

# === LOAD DATA ===
with open(JSON_PATH) as f:
    questions = json.load(f)

all_qids = sorted(questions.keys())
if YEAR_FILTER:
    qids = [q for q in all_qids if q.startswith(YEAR_FILTER)]
    print(f"[YEAR FILTER: {YEAR_FILTER}] Selected {len(qids)} questions")
else:
    qids = all_qids
    print(f"Loaded {len(qids)} questions: {qids[0]} → {qids[-1]}")

TOTAL = len(qids)
if TOTAL == 0:
    print(f"ERROR: No questions found for year {YEAR_FILTER}")
    sys.exit(1)

# === NORMALIZATION ===
FW_TO_HW = {
    ord('\uff01'): '!', ord('\uff02'): '@', ord('\uff03'): '#', ord('\uff04'): '$',
    ord('\uff05'): '%', ord('\uff06'): '^', ord('\uff07'): '&', ord('\uff08'): '*',
    ord('\uff09'): '(', ord('\uff0a'): ')', ord('\uff0b'): '+', ord('\uff0c'): ',',
    ord('\uff0d'): '-', ord('\uff0e'): '.', ord('\uff0f'): '/',
    ord('\uff10'): '0', ord('\uff11'): '1', ord('\uff12'): '2', ord('\uff13'): '3',
    ord('\uff14'): '4', ord('\uff15'): '5', ord('\uff16'): '6', ord('\uff17'): '7',
    ord('\uff18'): '8', ord('\uff19'): '9',
    ord('\uff1a'): ':', ord('\uff1b'): ';', ord('\uff1c'): '<', ord('\uff1d'): '=',
    ord('\uff1e'): '>', ord('\uff1f'): '?', ord('\uff20'): '@',
    ord('\uff21'): 'A', ord('\uff22'): 'B', ord('\uff23'): 'C', ord('\uff24'): 'D',
    ord('\uff25'): 'E', ord('\uff26'): 'F', ord('\uff27'): 'G', ord('\uff28'): 'H',
    ord('\uff29'): 'I', ord('\uff2a'): 'J', ord('\uff2b'): 'K', ord('\uff2c'): 'L',
    ord('\uff2d'): 'M', ord('\uff2e'): 'N', ord('\uff2f'): 'O', ord('\uff30'): 'P',
    ord('\uff31'): 'Q', ord('\uff32'): 'R', ord('\uff33'): 'S', ord('\uff34'): 'T',
    ord('\uff35'): 'U', ord('\uff36'): 'V', ord('\uff37'): 'W', ord('\uff38'): 'X',
    ord('\uff39'): 'Y', ord('\uff3a'): 'Z',
    ord('\uff3b'): '[', ord('\uff3c'): '\\', ord('\uff3d'): ']', ord('\uff3e'): '^',
    ord('\uff3f'): '_', ord('\uff40'): '`',
    ord('\uff41'): 'a', ord('\uff42'): 'b', ord('\uff43'): 'c', ord('\uff44'): 'd',
    ord('\uff45'): 'e', ord('\uff46'): 'f', ord('\uff47'): 'g', ord('\uff48'): 'h',
    ord('\uff49'): 'i', ord('\uff4a'): 'j', ord('\uff4b'): 'k', ord('\uff4c'): 'l',
    ord('\uff4d'): 'm', ord('\uff4e'): 'n', ord('\uff4f'): 'o', ord('\uff50'): 'p',
    ord('\uff51'): 'q', ord('\uff52'): 'r', ord('\uff53'): 's', ord('\uff54'): 't',
    ord('\uff55'): 'u', ord('\uff56'): 'v', ord('\uff57'): 'w', ord('\uff58'): 'x',
    ord('\uff59'): 'y', ord('\uff5a'): 'z',
    ord('\uff5b'): '{', ord('\uff5c'): '|', ord('\uff5d'): '}', ord('\uff5e'): '~',
}

def normalize_text(s):
    """Normalize text for comparison."""
    if not s:
        return ""
    s = s.strip()
    # Full-width → half-width
    s = s.translate(FW_TO_HW)
    # Chinese punctuation
    s = s.replace('\uff0c', ',').replace('\u3002', '.').replace('\uff1a', ':').replace('\uff1b', ';')
    s = s.replace('\uff08', '(').replace('\uff09', ')').replace('\u300c', '"').replace('\u300d', '"')
    s = s.replace('\u300e', "'").replace('\u300f', "'").replace('\u3001', ',')
    s = s.replace('\u3000', ' ').replace('\u300a', '<').replace('\u300b', '>')
    # Whitespace collapse
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def normalize_answer(a):
    """Normalize answer for comparison."""
    if not a:
        return ""
    a = str(a).strip()
    # Uppercase
    a = a.upper()
    # Strip trailing punctuation
    a = re.sub(r'[.。,，;；:：]+$', '', a)
    # Numbers tolerance
    a_num = re.sub(r'[\.,](?=\d{3})', '', a)  # 1,000 → 1000
    # Option letter extraction
    letter_match = re.match(r'^\(?([A-D])\)?[\s\.\):\-–]*(.*)$', a)
    if letter_match:
        letter = letter_match.group(1)
        rest = letter_match.group(2).strip()
        return f"{letter}|{normalize_text(rest)}"
    return normalize_text(a)

def extract_answer_from_text(text):
    """Extract the most likely answer from text (A/B/C/D or numeric)."""
    if not text:
        return ""
    text = str(text).strip()
    # Try option letters first
    m = re.search(r'\b([A-D])\b', text)
    if m:
        return m.group(1)
    # Try last character as answer
    chars = re.findall(r'[\dA-Da-d]', text)
    if chars:
        return chars[-1].upper()
    return text

def parse_api_json_response(content):
    """Try to parse JSON from API response content."""
    content = content.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        if lines[-1].startswith("```"):
            content = "\n".join(lines[1:-1])
        else:
            content = "\n".join(lines[1:])
    start = content.find("{")
    end = content.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(content[start:end])
        except json.JSONDecodeError:
            pass
    return None

def encode_image(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

# === API CALLS ===
def call_vision(image_path, ocr_text, qid):
    """Path A: Call MiniMax Vision API."""
    b64 = encode_image(image_path)
    prompt = """You are reading a math exam question image. Output ONLY valid JSON (no markdown, no explanation).

Extract:
- visible_text: The question text exactly as shown in the image (unicode, preserve LaTeX/math notation)
- answer: The final answer (e.g. "C" or a numeric/math result)
- reasoning: Brief reasoning

Return JSON:
{"visible_text": "...", "answer": "...", "reasoning": "..."}"""
    
    payload = {
        "prompt": prompt,
        "image_url": f"data:image/jpeg;base64,{b64}"
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        VISION_URL, data=data,
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        method="POST"
    )
    for attempt in range(MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                content = result.get("content", "")
                parsed = parse_api_json_response(content)
                if parsed:
                    return {
                        "visible_text": parsed.get("visible_text", ""),
                        "answer": parsed.get("answer", ""),
                        "reasoning": parsed.get("reasoning", ""),
                        "raw": content[:500]
                    }
                return {"visible_text": "", "answer": "", "reasoning": "", "raw": content[:500], "error": "No JSON in response"}
        except urllib.error.HTTPError as e:
            err = e.read().decode()[:200] if e.fp else ""
            if "429" in str(e.code) or "rate" in err.lower():
                time.sleep(15 * (attempt + 1))
                continue
            if attempt < MAX_RETRIES:
                time.sleep(5 * (attempt + 1))
                continue
            return {"error": f"HTTP {e.code}: {err[:100]}"}
        except Exception as e:
            if attempt < MAX_RETRIES:
                time.sleep(5 * (attempt + 1))
                continue
            return {"error": str(e)}

def call_text_model(ocr_text, qid):
    """Path B: Call MiniMax M2.7 text model with OCR text."""
    prompt = f"""You are given OCR text from a math exam question. Read it carefully, interpret what it says, and extract the normalized question text and final answer.

OCR TEXT:
{ocr_text}

TASK:
1. Interpret the OCR text as it would appear in the original exam
2. Output the normalized visible_text (as you interpret it)
3. Output the final answer (option letter A/B/C/D or a numeric/math result)

Return ONLY valid JSON (no markdown, no explanation):
{{"visible_text": "...", "answer": "...", "reasoning": "..."}}"""
    
    payload = {
        "model": TEXT_MODEL,
        "messages": [{"role": "user", "content": prompt}]
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        TEXT_URL, data=data,
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        method="POST"
    )
    for attempt in range(MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                parsed = parse_api_json_response(content)
                if parsed:
                    return {
                        "visible_text": parsed.get("visible_text", ""),
                        "answer": parsed.get("answer", ""),
                        "reasoning": parsed.get("reasoning", ""),
                        "raw": content[:500]
                    }
                return {"visible_text": "", "answer": "", "reasoning": "", "raw": content[:500], "error": "No JSON in response"}
        except urllib.error.HTTPError as e:
            err = e.read().decode()[:200] if e.fp else ""
            if "429" in str(e.code) or "rate" in err.lower():
                time.sleep(15 * (attempt + 1))
                continue
            if attempt < MAX_RETRIES:
                time.sleep(5 * (attempt + 1))
                continue
            return {"error": f"HTTP {e.code}: {err[:100]}"}
        except Exception as e:
            if attempt < MAX_RETRIES:
                time.sleep(5 * (attempt + 1))
                continue
            return {"error": str(e)}

# === MAIN LOOP ===
results = []
YEAR_TAG = YEAR_FILTER or "all"
progress_file = f"{OUTPUT_DIR}/p2_dualpath_progress_{YEAR_TAG}.json"
REPORT_FILE = f"{OUTPUT_DIR}/p2_dualpath_compare_{YEAR_TAG}_20260412.json"

# Load existing progress if any (idempotent)
if os.path.exists(progress_file):
    try:
        with open(progress_file) as f:
            saved = json.load(f)
            start_from = saved.get("processed", 0)
            results = saved.get("results", [])
            print(f"Resuming from item {start_from} ({len(results)} results already)")
    except:
        start_from = 0
else:
    start_from = 0

stats = {"text_match": 0, "answer_match": 0, "both_match": 0, "errors": 0, "total": TOTAL}

for i, qid in enumerate(qids):
    if i < start_from:
        continue
    
    elapsed = time.time() - RUN_START
    if elapsed > MAX_RUNTIME:
        print(f"TIME LIMIT approaching ({elapsed:.0f}s), saving partial results and stopping")
        break
    
    q = questions[qid]
    img_path = q.get("path", "").replace("/Users/zachli/ai-learning/hkdse/ocr-output/images-p2", IMAGES_DIR)
    ocr_text = q.get("ocr_text", "")
    
    # Verify image exists
    if not os.path.exists(img_path):
        # Try original path
        img_path = q.get("path", "")
    
    # === Path A: Vision ===
    path_a = call_vision(img_path, ocr_text, qid)
    
    # Small delay to avoid rate limits
    time.sleep(1)
    
    # === Path B: Text ===
    path_b = call_text_model(ocr_text, qid)
    
    # === Comparison ===
    vt_a = path_a.get("visible_text", "") or ""
    vt_b = path_b.get("visible_text", "") or ""
    ans_a = path_a.get("answer", "") or ""
    ans_b = path_b.get("answer", "") or ""
    
    norm_vt_a = normalize_text(vt_a)
    norm_vt_b = normalize_text(vt_b)
    
    letter_a = extract_answer_from_text(ans_a)
    letter_b = extract_answer_from_text(ans_b)
    
    # Text match: normalized strings must be identical (and non-empty)
    text_match = bool(norm_vt_a and norm_vt_b and norm_vt_a == norm_vt_b)
    
    # Answer match: option letters must match, or numeric answers equal
    answer_match = False
    if letter_a and letter_b and letter_a == letter_b:
        answer_match = True
    elif ans_a and ans_b:
        # Try normalized comparison for numeric/math answers
        norm_ans_a = normalize_answer(ans_a)
        norm_ans_b = normalize_answer(ans_b)
        if norm_ans_a == norm_ans_b and norm_ans_a not in ("", "A", "B", "C", "D"):
            answer_match = True
    
    if text_match:
        stats["text_match"] += 1
    if answer_match:
        stats["answer_match"] += 1
    if text_match and answer_match:
        stats["both_match"] += 1
    if "error" in path_a or "error" in path_b:
        stats["errors"] += 1
    
    record = {
        "qid": qid,
        "path_a": {"visible_text": vt_a, "answer": ans_a, "reasoning": path_a.get("reasoning",""), "error": path_a.get("error","")},
        "path_b": {"visible_text": vt_b, "answer": ans_b, "reasoning": path_b.get("reasoning",""), "error": path_b.get("error","")},
        "norm_a": norm_vt_a,
        "norm_b": norm_vt_b,
        "ans_letter_a": letter_a,
        "ans_letter_b": letter_b,
        "text_match": text_match,
        "answer_match": answer_match,
        "has_error": "error" in path_a or "error" in path_b
    }
    
    # Save evidence for mismatches
    if not text_match or not answer_match or record["has_error"]:
        ev_file = f"{EVIDENCE_DIR}/{qid}_A.json"
        with open(ev_file, "w") as f:
            json.dump({"qid": qid, "path": "A", **path_a}, f, indent=2, ensure_ascii=False)
        ev_file = f"{EVIDENCE_DIR}/{qid}_B.json"
        with open(ev_file, "w") as f:
            json.dump({"qid": qid, "path": "B", **path_b}, f, indent=2, ensure_ascii=False)
    
    results.append(record)
    
    # Progress update every BATCH_PROGRESS items
    if (i + 1) % BATCH_PROGRESS == 0 or i == TOTAL - 1:
        print(f"[{i+1}/{TOTAL}] {qid}: text_match={text_match}, answer_match={answer_match}, errors={stats['errors']}")
        
        # Save progress
        with open(progress_file, "w") as f:
            json.dump({"processed": i + 1, "total": TOTAL, "results": results, "stats": stats, "timestamp": datetime.now().isoformat()}, f, indent=2)
        
        # Save full report
        with open(REPORT_FILE, "w") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Check time
        elapsed = time.time() - RUN_START
        print(f"  Time: {elapsed:.0f}s / {MAX_RUNTIME}s, processed={i+1}/{TOTAL}")
    
    # Rate limit backoff
    time.sleep(0.5)

# === FINAL OUTPUTS ===
processed = len(results)
print(f"\nDone! Processed {processed}/{TOTAL} questions")
print(f"Stats: text_match={stats['text_match']}, answer_match={stats['answer_match']}, both_match={stats['both_match']}, errors={stats['errors']}")

# Final report
with open(REPORT_FILE, "w") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

# Step summary JSON
step_summary = {
    "status": "complete" if processed == TOTAL else "partial",
    "total": TOTAL,
    "processed": processed,
    "text_matches": stats["text_match"],
    "answer_matches": stats["answer_match"],
    "both_match": stats["both_match"],
    "errors": stats["errors"],
    "started_at": datetime.now().isoformat(),
    "completed_at": datetime.now().isoformat(),
    "runtime_seconds": time.time() - RUN_START
}
with open(f"{OUTPUT_DIR}/hkdse_p2_dualpath_step1_summary_{YEAR_TAG}.json", "w") as f:
    json.dump(step_summary, f, indent=2, ensure_ascii=False)

# Human summary markdown
errors_list = [(r["qid"], r) for r in results if r["has_error"]]
text_mismatches = [(r["qid"], r) for r in results if not r["text_match"] and not r["has_error"]]
answer_mismatches = [(r["qid"], r) for r in results if not r["answer_match"] and not r["has_error"]]

summary_md = f"""# HKDSE P2 Dual-Path Verification Summary

**Date:** 2026-04-12
**Total Questions:** {TOTAL}
**Processed:** {processed}
**Runtime:** {step_summary['runtime_seconds']:.0f}s

## Match Statistics

| Metric | Count | % |
|--------|-------|---|
| Text Matches | {stats['text_match']} | {100*stats['text_match']/processed:.1f}% |
| Answer Matches | {stats['answer_match']} | {100*stats['answer_match']/processed:.1f}% |
| Both Match | {stats['both_match']} | {100*stats['both_match']/processed:.1f}% |
| Errors | {stats['errors']} | {100*stats['errors']/processed:.1f}% |

## Mismatch Breakdown

- **Text mismatches:** {len(text_mismatches)} questions
- **Answer mismatches:** {len(answer_mismatches)} questions  
- **Errors:** {len(errors_list)} questions

## Text Mismatch QIDs (top 20)
{chr(10).join([f'- {qid}: A="{r["path_a"]["visible_text"][:50]}" vs B="{r["path_b"]["visible_text"][:50]}"' for qid, r in text_mismatches[:20]])}

## Answer Mismatch QIDs (top 20)
{chr(10).join([f'- {qid}: A_answer="{r["path_a"]["answer"]}" vs B_answer="{r["path_b"]["answer"]}"' for qid, r in answer_mismatches[:20]])}

## Error QIDs
{chr(10).join([f'- {qid}: {r["path_a"].get("error","") or r["path_b"].get("error","")}' for qid, r in errors_list[:20]])}

## Output Files
- Full report: `p2_dualpath_compare_full_20260412.json`
- Evidence: `~/ai-learning/hkdse/evidence/<qid>_A.json` and `<qid>_B.json`
"""

with open(f"{OUTPUT_DIR}/p2_dualpath_summary_{YEAR_TAG}_20260412.md", "w") as f:
    f.write(summary_md)

print(f"\nFiles written:")
print(f"  Report: {REPORT_FILE}")
print(f"  Summary: {OUTPUT_DIR}/p2_dualpath_summary_{YEAR_TAG}_20260412.md")
print(f"  Step summary: {OUTPUT_DIR}/hkdse_p2_dualpath_step1_summary_{YEAR_TAG}.json")
print(f"  Evidence dir: {EVIDENCE_DIR}/")
