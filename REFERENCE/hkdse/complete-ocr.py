#!/usr/bin/env python3
"""
HKDSE Complete OCR Processor
Processes ALL questions from P1 and P2 spreadsheets
"""

import os
import sys
import json
import subprocess
import urllib.request
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
MAX_WORKERS = 4  # Parallel downloads
OUTPUT_DIR = Path(__file__).parent / 'ocr-output'
IMAGES_DIR = OUTPUT_DIR / 'images'

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def download_image(url, output_path):
    """Download image from URL"""
    if not url or url == '':
        return False
    try:
        urllib.request.urlretrieve(url, output_path)
        return True
    except Exception as e:
        return False

def ocr_image(image_path):
    """Extract text from image using Tesseract"""
    try:
        result = subprocess.run(
            ['tesseract', image_path, 'stdout', '-l', 'chi_tra+eng', '--psm', '6'],
            capture_output=True,
            text=True,
            timeout=120
        )
        return result.stdout.strip()
    except Exception as e:
        return ""

def process_question(q_data, paper_type):
    """Process a single question"""
    try:
        if len(q_data) < 7:
            return None
            
        # P1 format: Help sort, 年份#題號, 年份, 甲乙部, 題號, 課題, 分數, ..., Photo link
        # P2 format: Help sort, 年份#題號, 年份, 題號, 課題, 初學, LV, ANS, %, LSC%, ..., Photo link
        
        if paper_type == "P1":
            q_id = q_data[1]  # 年份#題號
            year = q_data[2]  # 年份
            part = q_data[3] if q_data[3] else ""  # 甲乙部
            q_num = q_data[4]  # 題號
            topic = q_data[5]  # 課題
            score = q_data[6] if len(q_data) > 6 else ""  # 分數
            url = q_data[11] if len(q_data) > 11 else ""  # Photo link
        else:  # P2
            q_id = q_data[1]
            year = q_data[2]
            part = "MC"
            q_num = q_data[3]
            topic = q_data[4]
            score = q_data[5] if len(q_data) > 5 else ""
            url = q_data[12] if len(q_data) > 12 else ""  # Photo link
        
        # Skip if no valid ID or no image URL
        if not q_id or not q_id.startswith("20") or not url:
            return None
        
        # Create safe topic name
        safe_topic = topic.replace('/', '_').replace(' ', '_')
        
        # Create directory
        topic_dir = IMAGES_DIR / paper_type.lower() / safe_topic
        topic_dir.mkdir(parents=True, exist_ok=True)
        
        img_path = topic_dir / f"{q_id}.jpg"
        
        # Download image
        if download_image(url, str(img_path)):
            text = ocr_image(str(img_path))
        else:
            text = "(圖片無法下載)"
        
        return {
            "id": q_id,
            "year": year,
            "part": part,
            "question_num": q_num,
            "topic": topic,
            "score": score,
            "paper": paper_type,
            "image_url": url,
            "image_path": str(img_path.relative_to(OUTPUT_DIR)),
            "ocr_text": text,
            "verified": False,
            "verified_text": "",
            "processed_at": datetime.now().isoformat()
        }
    except Exception as e:
        log(f"Error processing question: {e}")
        return None

def load_existing_results():
    """Load existing OCR results if available"""
    results_file = OUTPUT_DIR / 'all_topics_ocr_results.json'
    if results_file.exists():
        with open(results_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"p1": [], "p2": [], "topics": {}}

def main():
    log("=" * 50)
    log("HKDSE Complete OCR Processor")
    log("=" * 50)
    
    # Load existing results
    existing = load_existing_results()
    existing_ids = {q['id'] for q in existing.get('p1', []) + existing.get('p2', [])}
    log(f"Existing results: {len(existing_ids)} questions already processed")
    
    # Process P1
    log("\n[P1] Processing Paper 1 questions...")
    p1_file = Path('/tmp/p1_data.txt')
    if p1_file.exists():
        with open(p1_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        header = lines[0].strip().split('\t')
        log(f"  Header: {len(header)} columns")
        
        p1_new = []
        for i, line in enumerate(lines[1:], start=1):
            if not line.strip():
                continue
            fields = line.strip().split('\t')
            q_id = fields[1] if len(fields) > 1 else ""
            
            if q_id in existing_ids:
                continue
            
            log(f"  Processing P1 {q_id} ({i}/{len(lines)-1})...")
            result = process_question(fields, "P1")
            if result:
                p1_new.append(result)
                existing_ids.add(q_id)
        
        existing['p1'] = existing.get('p1', []) + p1_new
        log(f"  P1: {len(p1_new)} new questions processed")
    
    # Process P2
    log("\n[P2] Processing Paper 2 questions...")
    p2_file = Path('/tmp/p2_data.txt')
    if p2_file.exists():
        with open(p2_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        p2_new = []
        for i, line in enumerate(lines[1:], start=1):
            if not line.strip():
                continue
            fields = line.strip().split('\t')
            q_id = fields[1] if len(fields) > 1 else ""
            
            if q_id in existing_ids:
                continue
            
            log(f"  Processing P2 {q_id} ({i}/{len(lines)-1})...")
            result = process_question(fields, "P2")
            if result:
                p2_new.append(result)
                existing_ids.add(q_id)
        
        existing['p2'] = existing.get('p2', []) + p2_new
        log(f"  P2: {len(p2_new)} new questions processed")
    
    # Save results
    existing['generated_at'] = datetime.now().isoformat()
    existing['total_p1'] = len(existing.get('p1', []))
    existing['total_p2'] = len(existing.get('p2', []))
    existing['total'] = existing['total_p1'] + existing['total_p2']
    
    output_file = OUTPUT_DIR / 'all_topics_ocr_results.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)
    
    # Also copy to pages folder
    pages_file = Path(__file__).parent / 'pages' / 'all_topics_ocr_results.json'
    with open(pages_file, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)
    
    log("\n" + "=" * 50)
    log(f"COMPLETE!")
    log(f"Total P1: {existing['total_p1']}")
    log(f"Total P2: {existing['total_p2']}")
    log(f"Total: {existing['total']}")
    log(f"Results saved to: {output_file}")
    log("=" * 50)

if __name__ == "__main__":
    main()
