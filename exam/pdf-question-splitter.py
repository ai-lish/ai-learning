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

try:
    from pdfminer.high_level import extract_pages
    from pdfminer.layout import LTTextBox
    HAS_PDFMINER = True
except ImportError:
    HAS_PDFMINER = False
    print("提示：pip install pdfminer.six 可啟用精確坐標切割", file=sys.stderr)


def calculate_score(img_path, expected_qn=None):
    """
    計算圖片評分（內嵌評分邏輯）
    評分維度：題號完整性(25)、文字對比度(25)、切割準確度(25)、白色區域(15)、第一字符(10)
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
    
    # 2. 文字對比度 (25分) - 灰階第90百分位(文字)與第10百分位(背景)差值
    gray_full = img.convert('L')
    pixels = sorted(gray_full.getdata())
    n = len(pixels)
    def percentile(arr, p):
        k = int(p / 100.0 * (len(arr) - 1))
        return arr[k]
    p90 = percentile(pixels, 90)
    p10 = percentile(pixels, 10)
    diff = p90 - p10
    if diff > 100: tc = 25
    elif diff > 50: tc = 15
    elif diff > 20: tc = 10
    else: tc = 0
    
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
    
    total = qni + tc + ca + wa + fc
    return {
        'total': total,
        'passed': total >= 80,
        'qni': (qni, dark),
        'tc': (tc, diff),
        'ca': (ca, ratio),
        'wa': (wa, (tw, bw)),
        'fc': (fc, expected_qn),
    }


def print_score(img_path, result, auto_delete=True):
    """打印評分結果並自動刪除不合格圖片"""
    status = "✅ 合格" if result['passed'] else "❌ 不合格"
    print(f"\n  📊 {os.path.basename(img_path)} - {result['total']}分 {status}")
    print(f"     題號完整性: {result['qni'][0]}/25 (深色比例 {result['qni'][1]:.1%})")
    print(f"     文字對比度: {result['tc'][0]}/25 (對比差值 {result['tc'][1]})")
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


def get_question_y_coords_with_pdfminer(pdf_path):
    """
    用 pdfminer.six 取得每條題目的精確 Y 坐標（PDF 坐標系）
    返回: {page_num: [(qn, pdf_y1, pdf_y0, page_height, page_width), ...], ...}
    PDF y1 = top of textbox, y0 = bottom of textbox (origin bottom-left)
    """
    if not HAS_PDFMINER:
        return {}
    
    question_coords = {}
    
    for page_num, layout in enumerate(extract_pages(pdf_path), 1):
        page_height = layout.height
        page_width = layout.width
        entries = []
        
        for element in layout:
            if isinstance(element, LTTextBox):
                text = element.get_text()
                m = re.match(r'^\s*(\d+)\.\s', text.strip())
                if m:
                    qn = int(m.group(1))
                    entries.append({
                        'qn': qn,
                        'pdf_y1': element.y1,  # top of text box (higher y)
                        'pdf_y0': element.y0,  # bottom of text box (lower y)
                        'page_height': page_height,
                        'page_width': page_width,
                    })
        
        # Sort by pdf_y1 descending (top of page = higher y in PDF coords)
        entries.sort(key=lambda x: x['pdf_y1'], reverse=True)
        question_coords[page_num] = entries
    
    return question_coords


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


def split_by_question_crops(images, output_dir, question_pages, question_coords=None):
    """
    按題目切割：
    - 如果有 pdfminer 坐標，用精確 Y 坐標切割
    - 否則用平均分配（舊方法）
    - crop 每條題目為獨立 image
    """
    os.makedirs(output_dir, exist_ok=True)
    saved = []
    dpi = 150  # assumed DPI for coordinate conversion
    ppp = dpi / 72.0  # pixels per point
    
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
        
        # Group questions that are on this page (from question_pages)
        page_q_entries = []
        if question_coords and page_num in question_coords:
            page_q_entries = question_coords[page_num]
        
        if page_q_entries:
            # === Method 1: Use pdfminer Y coordinates (precise) ===
            # Convert PDF coords to image coords and cut at question boundaries
            # img_y increases downward (top=0, bottom=h)
            # PDF y1 = top of textbox (higher y in PDF) -> smaller img_y
            # PDF y0 = bottom of textbox (lower y in PDF) -> larger img_y
            
            # Build list of (qn, img_y1_top, img_y0_bottom)
            img_entries = []
            for entry in page_q_entries:
                qn = entry['qn']
                page_h = entry['page_height']
                img_y1 = int((page_h - entry['pdf_y1']) * ppp)  # top of question
                img_y0 = int((page_h - entry['pdf_y0']) * ppp)  # bottom of question
                img_entries.append((qn, img_y1, img_y0))
            
            # Sort by img_y1 ascending (top to bottom of image)
            img_entries.sort(key=lambda x: x[1])
            
            for i, (qn, img_y1, img_y0) in enumerate(img_entries):
                # Crop: from slightly above question's top to next question's top (with overlap)
                # Extend UP by 50px to capture surrounding context (headers, whitespace)
                crop_top = img_y1 - 50
                if i + 1 < len(img_entries):
                    next_img_y1 = img_entries[i + 1][1]
                    # Extend this question down to 70% of the gap to next question
                    img_y2 = int(img_y1 + (next_img_y1 - img_y1) * 0.7)
                else:
                    # Last question on page: extend to page bottom
                    img_y2 = h
                
                # Ensure valid crop region
                crop_top = max(crop_top, 0)
                crop_top = min(crop_top, h - 10)
                img_y2 = min(max(img_y2, crop_top + 20), h)
                
                if crop_top >= img_y2:
                    print(f"  ⚠️ Q{qn:02d} skipped: invalid crop top={crop_top} y2={img_y2}")
                    continue
                
                cropped = img.crop((0, crop_top, w, img_y2))
                out_path = os.path.join(output_dir, f'Q{qn:02d}.png')
                cropped.save(out_path, 'PNG')
                saved.append(qn)
                
                # Show crop region for debugging
                print(f"  ✅ Q{qn:02d}.png (page {page_num}) crop={crop_top}:{img_y2} ({img_y2 - crop_top}px)")
                
                # 評分
                result = calculate_score(out_path, qn)
                print_score(out_path, result, auto_delete=True)
        else:
            # === Method 2: Fallback to average division (old method) ===
            print(f"  ⚠️  Page {page_num}: No pdfminer coords, using average division")
            num_on_page = len(qns)
            q_height = h // num_on_page
            
            for i, qn in enumerate(sorted(qns)):
                y_offset = i * q_height
                crop_height = min(q_height + 100, h - y_offset)
                cropped = img.crop((0, y_offset, w, y_offset + crop_height))
                
                out_path = os.path.join(output_dir, f'Q{qn:02d}.png')
                cropped.save(out_path, 'PNG')
                saved.append(qn)
                print(f"  ✅ Q{qn:02d}.png (page {page_num}, avg div)")
                
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
    
    # Get question page mapping from pdfminer (source of truth for page numbers)
    # Fallback to pdftotext if pdfminer unavailable
    question_coords = get_question_y_coords_with_pdfminer(args.pdf)
    if question_coords:
        # Build page_questions from pdfminer coords (correct page numbers)
        question_pages = {}
        for page_num, entries in question_coords.items():
            for entry in entries:
                question_pages[entry['qn']] = page_num
        total_qs = sum(len(v) for v in question_coords.values())
        print(f"📝 題目數: {total_qs}")
        print(f"🎯 pdfminer 精確坐標已啟用 (page 1={images[0].width}x{images[0].height})")
    else:
        question_pages = get_question_pages(args.pdf)
        print(f"📝 題目數: {len(question_pages)}")
        print(f"⚠️ pdfminer 不可用，使用 pdftotext 平均分配")
    
    print(f"   頁面分佈: { {pg: len([q for q,p in question_pages.items() if p==pg]) for pg in sorted(set(question_pages.values())) } }")
    
    # Split modes
    if args.mode in ('page', 'both'):
        page_dir = output_base / f'{pdf_name}_pages'
        print(f"\n📸 分割頁面 → {page_dir}")
        split_by_page_layout(images, str(page_dir), args.dpi)
    
    if args.mode in ('question', 'both'):
        q_dir = output_base / f'{pdf_name}_questions'
        print(f"\n✂️ 分割題目 → {q_dir}")
        split_by_question_crops(images, str(q_dir), question_pages, question_coords)
    
    print(f"\n✅ 完成！")
    print(f"   頁面圖片：{output_base / f'{pdf_name}_pages/'}")
    print(f"   題目圖片：{output_base / f'{pdf_name}_questions/'}")


if __name__ == '__main__':
    main()
