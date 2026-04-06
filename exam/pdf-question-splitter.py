#!/usr/bin/env python3
"""
PDF Question Splitter
用途：將 PDF 試卷自動切割為每條題目的獨立圖片

用法：
  python3 pdf-question-splitter.py <pdf_path> <output_dir> [--dpi 150] [--prefix Q]

示例：
  python3 pdf-question-splitter.py S1_Paper2_3rdTerm.pdf ./questions
"""

import os
import sys
import json
import argparse
import subprocess
import re
from pathlib import Path

try:
    from pdf2image import convert_from_path
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("需要安裝：pip install pdf2image Pillow", file=sys.stderr)
    sys.exit(1)


def get_question_pages(pdf_path, dpi=150):
    """用 pdftotext 取得每條題目喺邊頁"""
    result = subprocess.run(
        ['pdftotext', '-layout', pdf_path, '-'],
        capture_output=True, text=True
    )
    text = result.stdout
    
    pages = {}
    current_page = 1
    
    for line in text.split('\n'):
        # Detect page breaks (form feed or page marker)
        if '\x0c' in line or line.strip().startswith('中一級') and '數學科' in line:
            current_page += 1
            continue
        
        # Find question numbers
        m = re.match(r'^\s*(\d+)\.\s', line)
        if m:
            qn = int(m.group(1))
            if qn not in pages:
                pages[qn] = current_page
    
    return pages


def render_pdf_pages(pdf_path, dpi=150):
    """Render PDF pages to images"""
    print(f"正在 render PDF (dpi={dpi})...")
    images = convert_from_path(pdf_path, dpi=dpi)
    return images


def split_by_page_layout(images, output_dir, dpi=150):
    """
    按頁面分割：
    - 每頁為一個 image
    - 頁面命名：page_N.png
    - 適用於 Q5, Q6, Q12 等需睇圖嘅題目
    """
    os.makedirs(output_dir, exist_ok=True)
    
    for i, img in enumerate(images, 1):
        out_path = os.path.join(output_dir, f'page_{i:02d}.png')
        img.save(out_path, 'PNG')
        print(f"  ✅ page_{i:02d}.png ({img.width}x{img.height})")
    
    return len(images)


def split_by_question_crops(images, output_dir, question_pages):
    """
    嘗試按題目切割：
    - 分析每頁佈局，搵 question numbers
    - crop 每條題目為獨立 image
    - 只處理單頁題目
    """
    os.makedirs(output_dir, exist_ok=True)
    saved = []
    
    # Group questions by page
    page_questions = {}
    for qn, pg in question_pages.items():
        if pg not in page_questions:
            page_questions[pg] = []
        page_questions[pg].append(qn)
    
    for page_num, qns in sorted(page_questions.items()):
        if page_num < 1 or page_num > len(images):
            continue
        
        img = images[page_num - 1]
        w, h = img.size
        
        for qn in sorted(qns):
            # Try to find question position using text extraction from that page
            # Simple approach: divide page height by number of questions
            # More accurate: use pdftotext to find y-coordinates
            num_on_page = len(qns)
            q_height = h // num_on_page
            y_offset = (qn - qns[0]) * q_height
            
            # Crop: full width, estimated height
            crop_height = min(q_height + 100, h - y_offset)  # small overlap
            cropped = img.crop((0, y_offset, w, y_offset + crop_height))
            
            out_path = os.path.join(output_dir, f'Q{qn:02d}.png')
            cropped.save(out_path, 'PNG')
            saved.append(qn)
            print(f"  ✅ Q{qn:02d}.png (page {page_num})")
    
    return saved


def main():
    parser = argparse.ArgumentParser(description='PDF 試卷切割工具')
    parser.add_argument('pdf', help='PDF 檔案路徑')
    parser.add_argument('output', help='輸出資料夾')
    parser.add_argument('--dpi', type=int, default=150, help='Render DPI (default: 150)')
    parser.add_argument('--prefix', default='Q', help='題目圖片前綴 (default: Q)')
    parser.add_argument('--mode', choices=['page', 'question', 'both'], default='both',
                        help='模式：page=每頁一圖, question=每題一圖, both=兩樣都做')
    args = parser.parse_args()
    
    if not os.path.exists(args.pdf):
        print(f"❌ PDF 不存在：{args.pdf}", file=sys.stderr)
        sys.exit(1)
    
    pdf_name = Path(args.pdf).stem
    output_base = Path(args.output)
    
    print(f"\n📄 PDF: {args.pdf}")
    print(f"📁 輸出: {args.output}")
    print(f"📐 DPI: {args.dpi}")
    
    # Render all pages
    images = render_pdf_pages(args.pdf, args.dpi)
    print(f"\n📃 總頁數: {len(images)}")
    
    # Get question page mapping
    question_pages = get_question_pages(args.pdf)
    print(f"📝 題目數: {len(question_pages)}")
    print(f"   頁面分佈: { {pg: len([q for q,p in question_pages.items() if p==pg]) for pg in set(question_pages.values()) } }")
    
    # Split modes
    if args.mode in ('page', 'both'):
        page_dir = output_base / f'{pdf_name}_pages'
        print(f"\n📸 分割頁面 → {page_dir}")
        split_by_page_layout(images, str(page_dir), args.dpi)
    
    if args.mode in ('question', 'both'):
        q_dir = output_base / f'{pdf_name}_questions'
        print(f"\n✂️ 分割題目 → {q_dir}")
        split_by_question_crops(images, str(q_dir), question_pages)
    
    print(f"\n✅ 完成！")
    print(f"   頁面圖片：{output_base / f'{pdf_name}_pages/'}")
    print(f"   題目圖片：{output_base / f'{pdf_name}_questions/'}")


if __name__ == '__main__':
    main()
