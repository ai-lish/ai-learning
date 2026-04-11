#!/usr/bin/env python3
"""DSE 2022 P2 OCR Correction Pipeline
Uses Tesseract + MiniMax text correction
"""
import json
import os
import subprocess
import re
from pathlib import Path

MINIMAX_KEY = json.load(open(os.path.expanduser('~/.openclaw/secrets.json')))['minimax-api-key']
IMAGE_DIR = Path.home() / "ai-learning/hkdse/ocr-output/images-p2"
OUTPUT_DIR = Path.home() / "ai-learning/hkdse/ocr-output/corrected-2022"
TESSERACT_DIR = Path.home() / "ai-learning/hkdse/ocr-output/tesseract-2022"

OUTPUT_DIR.mkdir(exist_ok=True)

def run_tesseract(image_path):
    """Run Tesseract with optimized settings"""
    result = subprocess.run(
        ['tesseract', str(image_path), 'stdout', '--psm', '4'],
        capture_output=True, text=True
    )
    return result.stdout

def correct_tesseract_errors(text):
    """Basic corrections for common Tesseract math mistakes"""
    corrections = [
        (r'\bA\b', 'α'),
        (r'\bB\b', 'β'),
        (r'\bG\b', 'γ'),
        (r'@', 'a'),
        (r'~', '²'),
        (r'\^2', '²'),
        (r'\^3', '³'),
        (r'Brl', 'B)'),
        (r'ya', 'α'),
        (r'yB', 'β'),
        (r'yr', 'γ'),
        (r'@\+', 'a+'),
        (r'@\-', 'a-'),
        (r'@\\', 'ax'),
    ]
    
    result = text
    for pattern, replacement in corrections:
        result = re.sub(pattern, replacement, result)
    return result

def correct_with_minimax(tesseract_text):
    """Use MiniMax to correct math formulas"""
    import urllib.request
    
    prompt = f"""You are correcting DSE Math P2 OCR text. Fix the math symbols.

OCR output:
{tesseract_text}

Return ONLY the corrected LaTeX question. Example: $\\frac{{a}}{{b}}$, $x^2$, $\\alpha$

Corrected:"""

    payload = {
        "model": "MiniMax-M2.7",
        "max_tokens": 1500,
        "messages": [{"role": "user", "content": prompt}]
    }
    
    req = urllib.request.Request(
        "https://api.minimax.io/v1/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {MINIMAX_KEY}"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
            return result['choices'][0]['message']['content']
    except Exception as e:
        return f"Error: {e}"

def process_all():
    """Process all 2022 P2 questions"""
    images = sorted(IMAGE_DIR.glob("2022Q*.jpg"))[:5]  # Start with 5 for testing
    print(f"Found {len(images)} questions to process")
    
    success = 0
    failed = 0
    
    for img in images:
        qid = img.stem
        print(f"\nProcessing {qid}...")
        
        # Step 1: Tesseract
        tesseract_output = run_tesseract(img)
        basic_correction = correct_tesseract_errors(tesseract_output)
        
        # Step 2: MiniMax correction
        minimax_correction = correct_with_minimax(basic_correction)
        
        # Save results
        output_file = OUTPUT_DIR / f"{qid}.txt"
        with open(output_file, 'w') as f:
            f.write(f"=== Tesseract Output ===\n{tesseract_output}\n\n")
            f.write(f"=== Basic Correction ===\n{basic_correction}\n\n")
            f.write(f"=== MiniMax Correction ===\n{minimax_correction}\n")
        
        if 'Error' in minimax_correction:
            failed += 1
            print(f"  Failed: {minimax_correction[:80]}")
        else:
            success += 1
            print(f"  Success!")
            print(f"  MiniMax: {minimax_correction[:100]}...")
    
    print(f"\n=== Summary ===")
    print(f"Success: {success}, Failed: {failed}")

if __name__ == "__main__":
    process_all()