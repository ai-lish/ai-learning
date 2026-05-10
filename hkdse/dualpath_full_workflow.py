#!/usr/bin/env python3
"""
HKDSE P2 Full Workflow: OCR + Dual-Path Verification
1. For each year (2012-2022), check which questions need OCR
2. Generate OCR for missing questions using MiniMax VLM
3. Save OCR to p2_final_results.json
4. Run dual-path verification (Vision vs Text) for the year
"""
import json, os, sys, time, base64, re, urllib.request, urllib.error
from datetime import datetime
from pathlib import Path

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

YEARS = ["2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022"]

os.makedirs(OUTPUT_DIR, exist_ok=True)
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

def save_questions():
    """Save questions back to JSON."""
    with open(JSON_PATH, "w") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

# === OCR FUNCTIONS ===
def encode_image(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def call_vision_ocr(image_path, qid):
    """Use MiniMax Vision to OCR a question image."""
    b64 = encode_image(image_path)
    prompt = """Transcribe this math exam question EXACTLY as shown. Do NOT analyze or describe the image.

Rules:
- Start directly with the question number (e.g. "1.")
- Preserve all LaTeX notation: $\\frac{a}{b}$, $x^2$, $\\alpha$, etc.
- Keep option letters A B C D as shown
- Output ONLY the question text, nothing else

Return valid JSON:
{"ocr_text": "..."}"""
    
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
                # Parse JSON from content
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
                    parsed = json.loads(content[start:end])
                    return parsed.get("ocr_text", "")
                return ""
        except Exception as e:
            if attempt < MAX_RETRIES:
                time.sleep(5 * (attempt + 1))
                continue
            return ""
    return ""

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

# === OCR GENERATION ===
def generate_ocr_for_year(year):
    """Generate OCR for all missing questions in a year."""
    print(f"\n{'='*60}")
    print(f"OCR GENERATION: {year}")
    print(f"{'='*60}")
    
    # Get all QIDs for this year
    year_qids = [f"{year}Q{i:02d}" for i in range(1, 46)]
    
    missing = []
    for qid in year_qids:
        if qid in questions:
            ocr = questions[qid].get("ocr_text", "").strip()
            if not ocr:
                missing.append(qid)
    
    if not missing:
        print(f"  All 45 questions have OCR already.")
        return 0
    
    print(f"  Missing OCR: {len(missing)} questions")
    
    # Create evidence dir for this year
    year_ev_dir = f"{EVIDENCE_DIR}/{year}"
    os.makedirs(year_ev_dir, exist_ok=True)
    
    for idx, qid in enumerate(missing):
        img_path = f"{IMAGES_DIR}/{qid}.jpg"
        if not os.path.exists(img_path):
            print(f"  [!] {qid}: Image not found at {img_path}")
            continue
        
        print(f"  [{idx+1}/{len(missing)}] {qid}...", end=" ", flush=True)
        ocr_text = call_vision_ocr(img_path, qid)
        
        if ocr_text:
            questions[qid]["ocr_text"] = ocr_text
            save_questions()
            print(f"OK ({len(ocr_text)} chars)")
        else:
            print(f"FAILED")
        
        time.sleep(1)  # Rate limit
    
    # Re-count missing after generation
    still_missing = [q for q in year_qids if q in questions and not questions[q].get("ocr_text", "").strip()]
    print(f"  OCR complete. Still missing: {len(still_missing)}")
    return len(missing)

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
}

def normalize_text(s):
    if not s:
        return ""
    s = s.strip()
    s = s.translate(FW_TO_HW)
    s = s.replace('\uff0c', ',').replace('\u3002', '.').replace('\uff1a', ':').replace('\uff1b', ';')
    s = s.replace('\uff08', '(').replace('\uff09', ')').replace('\u300c', '"').replace('\u300d', '"')
    s = s.replace('\u300e', "'").replace('\u300f', "'").replace('\u3001', ',')
    s = s.replace('\u3000', ' ').replace('\u300a', '<').replace('\u300b', '>')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def normalize_answer(a):
    if not a:
        return ""
    a = str(a).strip()
    a = a.upper()
    a = re.sub(r'[.。,，;；:：]+$', '', a)
    a_num = re.sub(r'[\.,](?=\d{3})', '', a)
    letter_match = re.match(r'^\(?([A-D])\)?[\s\.\):\-–]*(.*)$', a)
    if letter_match:
        letter = letter_match.group(1)
        rest = letter_match.group(2).strip()
        return f"{letter}|{normalize_text(rest)}"
    return normalize_text(a)

def extract_answer_from_text(text):
    if not text:
        return ""
    text = str(text).strip()
    m = re.search(r'\b([A-D])\b', text)
    if m:
        return m.group(1)
    chars = re.findall(r'[\dA-Da-d]', text)
    if chars:
        return chars[-1].upper()
    return text

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

# === DUAL PATH VERIFICATION FOR ONE YEAR ===
def run_verification_for_year(year):
    """Run dual-path verification for a specific year."""
    print(f"\n{'='*60}")
    print(f"VERIFICATION: {year}")
    print(f"{'='*60}")
    
    year_qids = [f"{year}Q{i:02d}" for i in range(1, 46)]
    year_ev_dir = f"{EVIDENCE_DIR}/{year}"
    os.makedirs(year_ev_dir, exist_ok=True)
    
    results = []
    stats = {"text_match": 0, "answer_match": 0, "both_match": 0, "errors": 0, "total": 45}
    
    for idx, qid in enumerate(year_qids):
        elapsed = time.time() - RUN_START
        if elapsed > MAX_RUNTIME:
            print(f"TIME LIMIT approaching ({elapsed:.0f}s), stopping for this year")
            break
        
        if qid not in questions:
            print(f"  [!] {qid}: Not in questions data")
            continue
        
        q = questions[qid]
        img_path = f"{IMAGES_DIR}/{qid}.jpg"
        ocr_text = q.get("ocr_text", "")
        
        if not os.path.exists(img_path):
            print(f"  [!] {qid}: Image not found")
            continue
        
        has_ocr = bool(ocr_text.strip())
        
        # === Path A: Vision ===
        path_a = call_vision(img_path, ocr_text, qid)
        time.sleep(0.5)
        
        # === Path B: Text (only if OCR exists) ===
        if has_ocr:
            path_b = call_text_model(ocr_text, qid)
        else:
            path_b = {"visible_text": "", "answer": "", "reasoning": "", "error": "No OCR available"}
        time.sleep(0.5)
        
        # === Comparison ===
        vt_a = path_a.get("visible_text", "") or ""
        vt_b = path_b.get("visible_text", "") or ""
        ans_a = path_a.get("answer", "") or ""
        ans_b = path_b.get("answer", "") or ""
        
        norm_vt_a = normalize_text(vt_a)
        norm_vt_b = normalize_text(vt_b)
        
        letter_a = extract_answer_from_text(ans_a)
        letter_b = extract_answer_from_text(ans_b)
        
        text_match = bool(norm_vt_a and norm_vt_b and norm_vt_a == norm_vt_b)
        
        answer_match = False
        if letter_a and letter_b and letter_a == letter_b:
            answer_match = True
        elif ans_a and ans_b:
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
            "has_ocr": has_ocr,
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
            ev_file = f"{year_ev_dir}/{qid}_A.json"
            with open(ev_file, "w") as f:
                json.dump({"qid": qid, "path": "A", **path_a}, f, indent=2, ensure_ascii=False)
            if has_ocr:
                ev_file = f"{year_ev_dir}/{qid}_B.json"
                with open(ev_file, "w") as f:
                    json.dump({"qid": qid, "path": "B", **path_b}, f, indent=2, ensure_ascii=False)
        
        results.append(record)
        
        if (idx + 1) % 5 == 0 or idx == 44:
            print(f"  [{idx+1}/45] {qid}: text_match={text_match}, answer_match={answer_match}, errors={stats['errors']}")
        
        time.sleep(0.5)
    
    processed = len(results)
    print(f"\n  {year} Stats: text_match={stats['text_match']}, answer_match={stats['answer_match']}, both_match={stats['both_match']}, errors={stats['errors']}")
    
    # Save year report
    report_file = f"{OUTPUT_DIR}/p2_dualpath_{year}.json"
    with open(report_file, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    # Step summary for this year
    step_summary = {
        "year": year,
        "status": "complete" if processed == 45 else "partial",
        "total": 45,
        "processed": processed,
        "text_matches": stats["text_match"],
        "answer_matches": stats["answer_match"],
        "both_match": stats["both_match"],
        "errors": stats["errors"],
        "started_at": datetime.now().isoformat(),
        "runtime_seconds": time.time() - RUN_START
    }
    summary_file = f"{OUTPUT_DIR}/hkdse_p2_dualpath_{year}_summary.json"
    with open(summary_file, "w") as f:
        json.dump(step_summary, f, indent=2, ensure_ascii=False)
    
    return step_summary

# === MAIN ===
print(f"Starting HKDSE P2 Full Workflow at {datetime.now().isoformat()}")
print(f"Years to process: {YEARS}")
print(f"Total runtime budget: {MAX_RUNTIME}s ({MAX_RUNTIME/3600:.1f}h)")

all_summaries = []
for year in YEARS:
    elapsed = time.time() - RUN_START
    if elapsed > MAX_RUNTIME:
        print(f"\nTIME LIMIT reached. Stopping.")
        break
    
    # Step 1: Generate OCR for missing questions
    generate_ocr_for_year(year)
    
    # Step 2: Run dual-path verification
    summary = run_verification_for_year(year)
    all_summaries.append(summary)

# Final summary
print(f"\n{'='*60}")
print("ALL YEARS COMPLETE")
print(f"{'='*60}")
for s in all_summaries:
    print(f"  {s['year']}: {s['text_matches']}/{s['total']} text_match, {s['answer_matches']}/{s['total']} answer_match, {s['errors']} errors")

# Save final summary
with open(f"{OUTPUT_DIR}/hkdse_p2_dualpath_all_years_summary.json", "w") as f:
    json.dump(all_summaries, f, indent=2, ensure_ascii=False)

print(f"\nTotal runtime: {time.time() - RUN_START:.0f}s")
print(f"Output files: {OUTPUT_DIR}/p2_dualpath_*.json")
print(f"Evidence dir: {EVIDENCE_DIR}/")