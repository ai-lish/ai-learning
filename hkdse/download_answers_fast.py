#!/usr/bin/env python3
"""
Fast parallel download of P1 answer images from Google Drive.
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

def download_image(info):
    """Download image from Google Drive URL"""
    qid = info['qid']
    url = info['url']
    filename = f'{qid}.jpg'
    output_path = os.path.join(OUTPUT_DIR, filename)
    
    if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
        return qid, {'status': 'skipped', 'path': output_path}
    
    cmd = ['curl', '-s', '-L', '-o', output_path, url, '--max-time', '30']
    try:
        subprocess.run(cmd, timeout=35)
        if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
            return qid, {'status': 'success', 'path': output_path}
        else:
            return qid, {'status': 'fail', 'error': 'file too small'}
    except Exception as e:
        return qid, {'status': 'fail', 'error': str(e)}

def ocr_image(image_path):
    """OCR an image"""
    if not os.path.exists(image_path):
        return {'error': 'Image not found'}
    
    try:
        result = subprocess.run(
            ['tesseract', image_path, 'stdout', '-l', 'eng+chi_sim', '--psm', '6'],
            capture_output=True, text=True, timeout=30
        )
        return {'text': result.stdout.strip(), 'raw': result.stdout}
    except Exception as e:
        return {'error': str(e)}

def main():
    print('=' * 50)
    print('HKDSE P1 Answer Image Downloader (Parallel)')
    print('=' * 50)
    
    # Load data
    print('\n[1/2] Loading question data...')
    with open(DATA_FILE) as f:
        data = json.load(f)
    print(f'  Found {len(data)} questions')
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Prepare download tasks
    tasks = []
    for qid, info in data.items():
        if info.get('photo_link'):
            tasks.append({'qid': qid, 'url': info['photo_link']})
    
    print(f'\n[2/2] Downloading {len(tasks)} images (8 parallel)...')
    
    results = {}
    completed = 0
    
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(download_image, t): t for t in tasks}
        
        for future in as_completed(futures):
            qid, result = future.result()
            completed += 1
            
            if result['status'] == 'success':
                print(f'  [{completed}/{len(tasks)}] ✓ {qid}')
                # OCR the image
                ocr_result = ocr_image(result['path'])
                ocr_result['image_path'] = result['path']
                results[qid] = ocr_result
            elif result['status'] == 'skipped':
                print(f'  [{completed}/{len(tasks)}] - {qid} (exists)')
                ocr_result = ocr_image(result['path'])
                ocr_result['image_path'] = result['path']
                results[qid] = ocr_result
            else:
                print(f'  [{completed}/{len(tasks)}] ✗ {qid} - {result.get("error")}')
                results[qid] = {'error': result.get('error', 'unknown')}
    
    # Save results
    print('\n[Saving] Saving OCR results...')
    output = {
        'total': len(results),
        'successful': sum(1 for r in results.values() if 'text' in r),
        'failed': sum(1 for r in results.values() if 'error' in r),
        'results': results
    }
    
    with open(OCR_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f'\nResults:')
    print(f'  Total: {output["total"]}')
    print(f'  Successful OCR: {output["successful"]}')
    print(f'  Failed: {output["failed"]}')
    print(f'\nOutput saved to: {OCR_OUTPUT}')

if __name__ == '__main__':
    main()
