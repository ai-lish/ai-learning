#!/usr/bin/env python3
"""MiniMax VLM OCR Batch Runner"""
import requests
import json
import base64
import time
from pathlib import Path

API_KEY = None
with open('/Users/zachli/.openclaw/secrets.json') as f:
    secrets = json.load(f)
API_KEY = secrets['minimax-api-key']

IMAGE_DIR = Path('/Users/zachli/ai-learning/hkdse/ocr-output/images-p2')
OUTPUT_FILE = '/Users/zachli/ai-learning/hkdse/ocr-output/p2_final_results.json'
API_URL = "https://api.minimax.io/v1/coding_plan/vlm"

with open(OUTPUT_FILE) as f:
    results = json.load(f)

all_images = sorted(IMAGE_DIR.glob("*.jpg"))
to_process = []
for img in all_images:
    qid = img.stem
    year = qid[:4]
    if year in ['2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021']:
        if qid not in results or not results[qid].get('ocr_text'):
            to_process.append(img)

print(f"Processing {len(to_process)} images...")

for i, img_path in enumerate(to_process):
    qid = img_path.stem
    
    with open(img_path, 'rb') as f:
        img_base64 = base64.b64encode(f.read()).decode()
    
    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    payload = {
        "prompt": """Transcribe this math exam question exactly. Include question number, all math expressions, Greek letters, options A-D if present. Use standard notation.""",
        "image_url": f"data:image/jpeg;base64,{img_base64}"
    }
    
    success = False
    for attempt in range(3):
        try:
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=120)
            if resp.status_code == 200:
                result = resp.json()
                content = result.get('content', '')
                if content:
                    results[qid] = {
                        "id": qid,
                        "path": str(img_path),
                        "status": "ocr_done",
                        "ocr_text": content,
                        "ocr_method": "minimax-vlm"
                    }
                    success = True
                    break
        except Exception as e:
            time.sleep(2)
    
    if (i + 1) % 20 == 0:
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"Progress: {i+1}/{len(to_process)}")
    
    time.sleep(1)

with open(OUTPUT_FILE, 'w') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Done! Total: {len(results)}")