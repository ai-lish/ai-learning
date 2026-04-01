#!/usr/bin/env python3
"""
Download P1 answer images from Google Drive and OCR them.
"""

import json
import os
import time
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, 'pages', 'p1_sheet_data.json')
OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'answer-images')
OCR_OUTPUT = os.path.join(SCRIPT_DIR, 'pages', 'p1_answer_ocr_results.json')

# Google Drive base URL
DRIVE_BASE = 'https://drive.google.com/uc?id='

def download_image(url, output_path):
    """Download image from Google Drive URL"""
    if os.path.exists(output_path):
        print(f'  [SKIP] {os.path.basename(output_path)} already exists')
        return True
    
    cmd = ['curl', '-s', '-L', '-o', output_path, url]
    try:
        subprocess.run(cmd, timeout=30)
        if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
            return True
        else:
            print(f'  [FAIL] {os.path.basename(output_path)} - file too small or missing')
            return False
    except Exception as e:
        print(f'  [ERROR] {os.path.basename(output_path)}: {e}')
        return False

def ocr_image(image_path):
    """OCR an image and return text with LaTeX conversion"""
    if not os.path.exists(image_path):
        return {'error': 'Image not found'}
    
    # Use tesseract for OCR
    try:
        result = subprocess.run(
            ['tesseract', image_path, 'stdout', '-l', 'eng', '--psm', '6'],
            capture_output=True, text=True, timeout=30
        )
        text = result.stdout
        
        # Clean up common OCR errors
        text = text.replace('—', '-')
        text = text.replace('×', '×')
        text = text.replace('÷', '÷')
        
        return {
            'text': text.strip(),
            'raw': result.stdout
        }
    except Exception as e:
        return {'error': str(e)}

def process_question(qid, info, output_dir):
    """Process a single question - download and OCR answer image"""
    photo_url = info.get('photo_link', '')
    if not photo_url:
        return qid, {'error': 'No photo URL', 'qid': qid}
    
    # Download image
    filename = f'{qid}.jpg'
    image_path = os.path.join(output_dir, filename)
    
    success = download_image(photo_url, image_path)
    if not success:
        return qid, {'error': 'Download failed', 'qid': qid, 'url': photo_url}
    
    # OCR
    ocr_result = ocr_image(image_path)
    ocr_result['qid'] = qid
    ocr_result['image_path'] = image_path
    
    return qid, ocr_result

def main():
    print('=' * 50)
    print('HKDSE P1 Answer OCR System')
    print('=' * 50)
    
    # Load data
    print('\n[1/3] Loading question data...')
    with open(DATA_FILE) as f:
        data = json.load(f)
    print(f'  Found {len(data)} questions')
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Process questions
    print(f'\n[2/3] Downloading and OCR answer images...')
    results = {}
    total = len(data)
    
    for i, (qid, info) in enumerate(data.items(), 1):
        print(f'  [{i}/{total}] Processing {qid}...', end=' ')
        qid, result = process_question(qid, info, OUTPUT_DIR)
        results[qid] = result
        
        if 'error' in result:
            print(f"ERROR: {result['error']}")
        else:
            text_preview = result.get('text', '')[:30].replace('\n', ' ')
            print(f"OK - {text_preview}...")
        
        # Rate limiting
        if i % 10 == 0:
            time.sleep(1)
    
    # Save results
    print(f'\n[3/3] Saving OCR results...')
    output = {
        'total': len(results),
        'successful': sum(1 for r in results.values() if 'error' not in r),
        'failed': sum(1 for r in results.values() if 'error' in r),
        'results': results
    }
    
    with open(OCR_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f'\nResults:')
    print(f'  Total: {output["total"]}')
    print(f'  Successful: {output["successful"]}')
    print(f'  Failed: {output["failed"]}')
    print(f'\nOutput saved to: {OCR_OUTPUT}')

if __name__ == '__main__':
    main()
