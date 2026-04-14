#!/usr/bin/env python3
"""
MiniMax VLM OCR Batch Processor
Uses MiniMax Vision API to OCR math exam papers
"""

import requests
import json
import base64
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Config
API_KEY = None  # Loaded from secrets
API_URL = "https://api.minimax.io/v1/coding_plan/vlm"
OUTPUT_FILE = "/Users/zachli/ai-learning/hkdse/ocr-output/p2_final_results.json"
IMAGE_DIR = "/Users/zachli/ai-learning/hkdse/ocr-output/images-p2"
BATCH_SIZE = 10  # Process 10 images per batch

# Load API key
def load_api_key():
    global API_KEY
    with open('/Users/zachli/.openclaw/secrets.json') as f:
        secrets = json.load(f)
    API_KEY = secrets['minimax-api-key']

# Load existing results
def load_existing_results():
    try:
        with open(OUTPUT_FILE) as f:
            return json.load(f)
    except:
        return {}

# Save results
def save_results(results):
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

# OCR single image
def ocr_image(img_path):
    """OCR a single image using MiniMax VLM"""
    with open(img_path, 'rb') as f:
        img_base64 = base64.b64encode(f.read()).decode()
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "prompt": """Transcribe this math exam question exactly. Include:
1. The question number and any sub-parts (a), (b), (c)
2. All math expressions, equations, Greek letters (α, β, γ, δ, θ, etc.)
3. All options A, B, C, D if multiple choice
4. Any special symbols like √, °, ±, ≤, ≥, ∞, π, =

Use standard mathematical notation. Do not add explanations.""",
        "image_url": f"data:image/jpeg;base64,{img_base64}"
    }
    
    for attempt in range(3):
        try:
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=180)
            if resp.status_code == 200:
                result = resp.json()
                content = result.get('content', '')
                return content if content else None
            else:
                print(f"  HTTP {resp.status_code}: {resp.text[:50]}")
        except requests.exceptions.Timeout:
            print(f"  Timeout, attempt {attempt + 1}/3")
            time.sleep(5)
        except Exception as e:
            print(f"  Error: {str(e)[:50]}")
            time.sleep(2)
    return None

def main():
    load_api_key()
    
    # Get all images
    image_dir = Path(IMAGE_DIR)
    all_images = sorted(image_dir.glob("*.jpg"))
    print(f"Total images: {len(all_images)}")
    
    # Load existing results
    results = load_existing_results()
    print(f"Existing results: {len(results)}")
    
    # Find images that need OCR (no valid OCR text)
    def needs_ocr(img_path):
        qid = img_path.stem
        if qid not in results:
            return True
        q = results[qid]
        # Check if OCR is missing or appears to be from rapidocr with issues
        ocr_text = q.get('ocr_text', '')
        method = q.get('ocr_method', '')
        if not ocr_text or method == 'rapidocr':
            return True
        return False
    
    to_process = [img for img in all_images if needs_ocr(img)]
    print(f"Need OCR: {len(to_process)}")
    
    if not to_process:
        print("All images already processed!")
        return
    
    # Process in batches
    total = len(to_process)
    done = 0
    errors = 0
    
    for i, img_path in enumerate(to_process):
        qid = img_path.stem
        print(f"[{i+1}/{total}] Processing {qid}...", end=" ", flush=True)
        
        content = ocr_image(img_path)
        
        if content:
            results[qid] = {
                "id": qid,
                "path": str(img_path),
                "status": "ocr_done",
                "ocr_text": content,
                "ocr_method": "minimax-vlm"
            }
            print(f"✅ ({len(content)} chars)")
            done += 1
        else:
            print(f"❌ failed")
            errors += 1
        
        # Save periodically
        if (i + 1) % 10 == 0:
            save_results(results)
            print(f"  -> Saved {len(results)} results")
        
        # Rate limit - wait between requests
        time.sleep(1)
    
    # Final save
    save_results(results)
    print(f"\n=== 完成 ===")
    print(f"成功: {done}")
    print(f"失敗: {errors}")
    print(f"總結果: {len(results)}")

if __name__ == "__main__":
    main()