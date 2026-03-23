#!/usr/bin/env python3
"""
HKDSE Math - Batch OCR Processor
Processes ALL topics from both P1 and P2 spreadsheets
"""

import os
import json
import subprocess
import urllib.request
from pathlib import Path
from datetime import datetime

# Configuration
OUTPUT_DIR = Path(__file__).parent / 'ocr-output'
IMAGES_DIR = OUTPUT_DIR / 'images'

# ============== P1 DATA ==============
# Extracted from Google Sheet: 1L5j_1vZxvC0yDRjrrzSdM34As5daFlaont6cZYWvMeM
# Format: (id, year, part, q_num, topic, score, image_url)
P1_ALL = [
    # 指數化簡
    ("2012Q01", "2012", "A1", "01", "指數化簡", "3", "https://drive.google.com/uc?id=1hr9yYde2FFI6Mu37DqUT-v9wag9B4Xbx"),
    # 主項轉換
    ("2012Q02", "2012", "A1", "02", "主項轉換", "3", "https://drive.google.com/uc?id=1YF6dL4b-jMw_Q_a8Zno-AqqrW8fSXP9j"),
    # 因式分解
    ("2012Q03", "2012", "A1", "03", "因式分解", "3", "https://drive.google.com/uc?id=12EjFr-GwXaYaCcpv_XR_t9Ci80F-vEFc"),
    # 百分數
    ("2012Q04", "2012", "A1", "04", "百分數", "4", "https://drive.google.com/uc?id=1XRc1t8sZ9Pn6bs-KmAn1W1qWnB6MlmqO"),
    # 聯立方程
    ("2012Q05", "2012", "A1", "05", "聯立方程", "4", "https://drive.google.com/uc?id=1SUTagmcoOSJH-BkKm5jIucFKtZql409g"),
    # 複合不等式
    ("2012Q06", "2012", "A1", "06", "複合不等式", "4", "https://drive.google.com/uc?id=1jNYyrnHRX8aSbxMvCcDfq_oaCb7fCynJ"),
    # 高中統計甲部
    ("2012Q07", "2012", "A1", "07", "高中統計甲部", "4", "https://drive.google.com/uc?id=11hxHzjgvUjuQCZLLvmW1VxAwKzYB6SwX"),
    # 全等相似圖形
    ("2012Q08", "2012", "A1", "08", "全等相似圖形", "5", "https://drive.google.com/uc?id=1B_Cy01hgE_Z0g6SOvvZg2zqMkIxuT6x9"),
    # 求積法
    ("2012Q09", "2012", "A1", "09", "求積法", "5", "https://drive.google.com/uc?id=1JUZY0JyAifJShFQw5ITubMunxflwNq6j"),
]

# ============== FUNCTIONS ==============
def download_image(url, output_path):
    """Download image from URL"""
    if not url:
        return False
    try:
        urllib.request.urlretrieve(url, output_path)
        return True
    except Exception as e:
        print(f"  Error downloading {url}: {e}")
        return False

def ocr_image(image_path):
    """Extract text from image using Tesseract"""
    try:
        result = subprocess.run(
            ['tesseract', image_path, 'stdout', '-l', 'chi_tra+eng'],
            capture_output=True,
            text=True,
            timeout=120
        )
        return result.stdout.strip()
    except Exception as e:
        print(f"  Error OCR on {image_path}: {e}")
        return ""

def process_question(q_data, paper_type, topic):
    """Process a single question"""
    q_id, year, part, q_num, topic_name, score, url = q_data
    
    # Create directory structure
    topic_dir = IMAGES_DIR / paper_type.lower() / topic_name.replace('/', '_')
    topic_dir.mkdir(parents=True, exist_ok=True)
    
    img_path = topic_dir / f"{q_id}.jpg"
    
    # Download image
    if url and download_image(url, str(img_path)):
        text = ocr_image(str(img_path))
    else:
        text = "(圖片無法下載)"
    
    return {
        "id": q_id,
        "year": year,
        "part": part,
        "question_num": q_num,
        "topic": topic_name,
        "score": score,
        "paper": paper_type,
        "image_url": url,
        "image_path": str(img_path.relative_to(OUTPUT_DIR)),
        "ocr_text": text,
        "verified": False,
        "verified_text": "",
        "processed_at": datetime.now().isoformat()
    }

def main():
    print("=" * 60)
    print("HKDSE Batch OCR Processor")
    print("=" * 60)
    
    # Create directories
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    # Process P1 (sample for now - will expand)
    print("\n[P1] Processing sample questions...")
    p1_results = []
    for q in P1_ALL[:5]:  # Process first 5 as sample
        print(f"  Processing {q[0]}...")
        result = process_question(q, "P1", q[4])
        p1_results.append(result)
        print(f"    -> Done")
    
    # Save results
    all_data = {
        "p1_sample": p1_results,
        "p2_all": [],
        "total_p1": len(p1_results),
        "total_p2": 0,
        "generated_at": datetime.now().isoformat()
    }
    
    output_file = OUTPUT_DIR / 'all_topics_ocr_results.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'=' * 60}")
    print(f"Done! Processed {len(p1_results)} P1 questions")
    print(f"Results saved to: {output_file}")
    print("=" * 60)

if __name__ == "__main__":
    main()
