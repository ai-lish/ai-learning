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


def calculate_score(img_path, expected_qn=None):
    """
    計算圖片評分（內嵌評分邏輯）
    評分維度：題號完整性(25)、顏色保留(25)、切割準確度(25)、白色區域(15)、第一字符(10)
    """
    import re
    img = Image.open(img_path)
    
    if expected_qn is None:
        m = re.search(r'Q(\d+)', os.path.basename(img_path))
        if m:
            expected_qn = int(m.group(1))
    
    w, h = img.size
    
    # 1. 題號完整性 (25分) - 上半部分有深色文字
    top_half = img.crop((0, 0, w, h // 2))
    gray = top_half.convert('L')
    dark = sum(1 for p in gray.getdata() if p < 128) / (w * h // 2)
    if dark > 0.10: qni = 25
    elif dark > 0.05: qni = 15
    elif dark > 0.02: qni = 10
    else: qni = 0
    
    # 2. 顏色保留 (25分) - 顏色像素比例 5-40%
    rgb = img.convert('RGB')
    colored = sum(1 for r, g, b in rgb.getdata() if max(r,g,b)-min(r,g,b) > 15) / (w * h)
    if 0.05 <= colored <= 0.40: cp = 25
    elif 0.02 <= colored < 0.05 or 0.40 < colored <= 0.50: cp = 15
    else: cp = 0
    
    # 3. 切割準確度 (25分) - 邊緣非白色 < 5%
    edge_h = max(h // 20, 10)
    def edge_ratio(y, h2):
        edge = img.crop((0, y, w, y + h2))
        return sum(1 for p in edge.convert('L').getdata() if p < 240) / (w * h2)
    ratio = (edge_ratio(0, edge_h) + edge_ratio(h - edge_h, edge_h)) / 2
    if ratio < 0.05: ca = 25
    elif ratio < 0.10: ca = 15
    elif ratio < 0.15: ca = 10
    else: ca = 0
    
    # 4. 白色區域 (15分) - 頂部/底部邊緣全白
    edge_h2 = max(h // 10, 15)
    def white_ratio(y, h2):
        edge = img.crop((0, y, w, y + h2))
        return sum(1 for p in edge.convert('L').getdata() if p > 250) / (w * h2)
    tw = white_ratio(0, edge_h2)
    bw = white_ratio(h - edge_h2, edge_h2)
    if tw > 0.95 and bw > 0.95: wa = 15
    elif tw > 0.95 or bw > 0.95: wa = 10
    else: wa = 5
    
    # 5. 第一字符題號 (10分) - OCR
    fc = 0
    if expected_qn:
        try:
            import pytesseract
            text = re.sub(r'\s+', '', pytesseract.image_to_string(img.crop((0, 0, w, h // 4)), config='--psm 6')).strip()
            nums = re.findall(r'\d+', text[:3])
            fc = 10 if (nums and int(nums[0]) == expected_qn) else 5 if nums else 0
        except ImportError:
            fc = 5
    
    total = qni + cp + ca + wa + fc
    return {
        'total': total,
        'passed': total >= 80,
        'qni': (qni, dark),
        'cp': (cp, colored),
        'ca': (ca, ratio),
        'wa': (wa, (tw, bw)),
        'fc': (fc, expected_qn),
    }


def print_score(img_path, result, auto_delete=True):
    """打印評分結果並自動刪除不合格圖片"""
    status = "✅ 合格" if result['passed'] else "❌ 不合格"
    print(f"\n  📊 {os.path.basename(img_path)} - {result['total']}分 {status}")
    print(f"     題號完整性: {result['qni'][0]}/25 (深色比例 {result['qni'][1]:.1%})")
    print(f"     顏色保留:   {result['cp'][0]}/25 (顏色比例 {result['cp'][1]:.1%})")
    print(f"     切割準確度: {result['ca'][0]}/25 (邊緣比例 {result['ca'][1]:.1%})")
    print(f"     白色區域:   {result['wa'][0]}/15 (頂部白 {result['wa'][1][0]:.1%}, 底部白 {result['wa'][1][1]:.1%})")
    print(f"     第一字符:   {result['fc'][0]}/10 (題號 {result['fc'][1]})")
    
    if not result['passed'] and auto_delete:
        try:
            os.remove(img_path)
            print(f"     🗑️ 已刪除")
        except Exception as e:
            print(f"     ⚠️ 刪除失敗: {e}")


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
            
            # 評分
            result = calculate_score(out_path, qn)
            print_score(out_path, result, auto_delete=True)
    
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
