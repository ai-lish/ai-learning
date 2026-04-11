#!/usr/bin/env python3
"""RapidOCR DSE 2022 P2 processor"""
import sys
from pathlib import Path

# Suppress stderr
sys.stderr = open('/dev/null', 'w')

from rapidocr import RapidOCR

ocr = RapidOCR()
image_dir = Path.home() / "ai-learning/hkdse/ocr-output/images-p2"
output_dir = Path.home() / "ai-learning/hkdse/ocr-output/rapidocr-2022"
output_dir.mkdir(exist_ok=True)

images = sorted(image_dir.glob("2022Q*.jpg"))
print(f"Processing {len(images)} images...")

success = 0
fail = 0

for img in images:
    qid = img.stem
    print(f"{qid}... ", end="", flush=True)
    
    result = ocr(str(img))
    
    if result and result[0]:
        texts = [r[1] for r in result[0]]
        text = " ".join(texts)
        
        with open(output_dir / f"{qid}.txt", 'w') as f:
            f.write(text)
        
        print("✅")
        success += 1
    else:
        print("❌")
        fail += 1

print(f"\nDone! Success: {success}, Failed: {fail}")