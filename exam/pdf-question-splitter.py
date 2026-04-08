#!/usr/bin/env python3
"""
PDF Question Splitter v3 (智能切割版)
用途：將 PDF 試卷自動切割為每條題目的獨立圖片

演算法核心：
1. 用 pdfminer 拎每個 LTTextLine 嘅精確 Y 坐標
2. 每題嘅高度 = 下一題 Y 坐標 - 目前題 Y 坐標
3. 上下各加 0.5cm margin
4. 喺呢個範圍內切割

用法：
  python3 pdf-question-splitter.py <pdf_path> <output_dir> [--dpi 150]

合格分數：>= 80分
唔合格分數：< 80分 → 刪除重新整過
"""

import os
import sys
import argparse
import re
from pathlib import Path
from dataclasses import dataclass
from typing import List, Tuple, Dict

try:
    from pdf2image import convert_from_path
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("需要安裝：pip install pdf2image Pillow", file=sys.stderr)
    sys.exit(1)

# ============================================================
# 評分系統 (Scoring System)
# ============================================================

PASS_SCORE = 80.0

def calculate_score(image_path: str, expected_question: int) -> dict:
    """計算切割圖片嘅評分"""
    try:
        img = Image.open(image_path)
        pixels = img.load()
        w, h = img.size
        
        scores = {'question_integrity': 0, 'color_preservation': 0,
                  'cut_accuracy': 0, 'whitespace_check': 0, 'first_char_is_number': 0}
        details = {}
        
        # 1. 題號完整性 (25分)
        has_question_number = False
        for y in range(min(h, 100)):
            dark_count = sum(1 for x in range(min(w, 300)) 
                           if max(*pixels[x, y][:3]) < 100)
            if dark_count > 20:
                has_question_number = True
                break
        scores['question_integrity'] = 25 if has_question_number else 0
        
        # 2. 顏色資訊保留 (25分)
        color_pixels = 0
        total_checked = 0
        for y in range(h):
            for x in range(w):
                r, g, b = pixels[x, y][:3]
                total_checked += 1
                if not (r > 240 and g > 240 and b > 240):
                    if not (r > 200 and g > 200 and b > 200 and max(r,g,b)-min(r,g,b) < 30):
                        color_pixels += 1
        color_ratio = color_pixels / max(total_checked, 1)
        if 0.05 <= color_ratio <= 0.40: scores['color_preservation'] = 25
        elif 0.02 <= color_ratio < 0.05: scores['color_preservation'] = 15
        elif 0.40 < color_ratio <= 0.60: scores['color_preservation'] = 20
        else: scores['color_preservation'] = 10
        details['color_ratio'] = f"{color_ratio:.2%}"
        
        # 3. 切割位置準確度 (25分)
        top_edge_dirty = sum(1 for x in range(w) if max(*pixels[x, 0][:3]) < 250) / max(w, 1)
        bottom_edge_dirty = sum(1 for x in range(w) if max(*pixels[x, h-1][:3]) < 250) / max(w, 1)
        if top_edge_dirty < 0.05 and bottom_edge_dirty < 0.05: scores['cut_accuracy'] = 25
        elif top_edge_dirty < 0.15 and bottom_edge_dirty < 0.15: scores['cut_accuracy'] = 15
        else: scores['cut_accuracy'] = 5
        details['top_edge_dirty'] = f"{top_edge_dirty:.2%}"
        details['bottom_edge_dirty'] = f"{bottom_edge_dirty:.2%}"
        
        # 4. 切割線白色區域 (15分)
        top_white = all(all(pixels[x, 0][i] > 250 for i in range(3)) for x in range(0, w, 10))
        bottom_white = all(all(pixels[x, h-1][i] > 250 for i in range(3)) for x in range(0, w, 10))
        scores['whitespace_check'] = 15 if (top_white and bottom_white) else 5
        
        # 5. 第一字符係題號 (10分)
        try:
            import pytesseract
            text = pytesseract.image_to_string(img, config='--psm 6')
            first_char = text.strip()[0] if text.strip() else ''
            if first_char.isdigit() and int(first_char) == expected_question:
                scores['first_char_is_number'] = 10
            elif first_char.isdigit(): scores['first_char_is_number'] = 5
            else: scores['first_char_is_number'] = 0
            details['ocr_first_char'] = first_char
        except ImportError:
            scores['first_char_is_number'] = 5
        
        total = sum(scores.values())
        return {'total': total, 'passed': total >= PASS_SCORE, **scores, 'details': details}
    except Exception as e:
        return {'total': 0, 'passed': False, 'error': str(e)}


def print_score(image_path: str, result: dict, question_num: int):
    status = "✅ PASS" if result['passed'] else "❌ FAIL"
    print(f"  Q{question_num:02d}: {result['total']:.1f}/100 {status}")
    print(f"       題號完整性: {result.get('question_integrity',0):.0f}/25")
    print(f"       顏色保留:   {result.get('color_preservation',0):.0f}/25")
    print(f"       切割準確度: {result.get('cut_accuracy',0):.0f}/25")
    print(f"       白色區域:   {result.get('whitespace_check',0):.0f}/15")
    print(f"       第一字符:   {result.get('first_char_is_number',0):.0f}/10")
    for k, v in result.get('details', {}).items():
        print(f"       {k}: {v}")


# ============================================================
# 核心演算法
# ============================================================

def get_question_y_coordinates(pdf_path: str) -> Dict[int, dict]:
    """
    用 pdfminer 拎每題嘅精確 Y 坐標
    PDF 坐標系統：Y 從底部開始，轉換為從頂部計算
    """
    from pdfminer.layout import LTChar, LTTextLine, LAParams
    from pdfminer.pdfpage import PDFPage
    from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
    from pdfminer.converter import PDFPageAggregator
    
    questions = {}
    laparams = LAParams()
    rsrcmgr = PDFResourceManager()
    
    with open(pdf_path, 'rb') as f:
        for page_num, page in enumerate(PDFPage.get_pages(f), 1):
            device = PDFPageAggregator(rsrcmgr, laparams=laparams)
            interpreter = PDFPageInterpreter(rsrcmgr, device)
            interpreter.process_page(page)
            layout = device.get_result()
            # 從 mediabox 拎頁面高度 (mediabox 是 tuple)
            page_height = page.mediabox[3] - page.mediabox[1]
            
            def process_element(elem, depth=0):
                if depth > 8:
                    return
                if isinstance(elem, LTTextLine):
                    line_text = ''
                    for char_elem in elem:
                        if isinstance(char_elem, LTChar):
                            line_text += char_elem.get_text()
                    
                    m = re.match(r'^(\d+)\.\s*(.*)', line_text.strip())
                    if m and elem.x0 < 60:  # 行首題號
                        qn = int(m.group(1))
                        text_content = m.group(2).strip()
                        # PDF Y 從底部開始，轉為從頂部計算
                        y_from_top = page_height - elem.y1  # y1 = top of text line
                        questions[qn] = {
                            'page': page_num,
                            'y': y_from_top,
                            'text': text_content[:50],
                            'full_line': line_text.strip()
                        }
                elif hasattr(elem, '_objs'):
                    for child in elem._objs:
                        process_element(child, depth+1)
            
            process_element(layout)
    
    return questions


def calculate_question_heights(questions: Dict[int, dict], page_height: float = 841.89) -> Dict[int, dict]:
    """
    計算每題嘅精確高度
    每題嘅高度 = 下一題 Y 坐標 - 目前題 Y 坐標
    上下各加 0.5cm margin (約14 points @ 72dpi)
    """
    CM_TO_POINTS = 28.35
    margin = CM_TO_POINTS * 0.5  # 0.5cm margin
    
    sorted_qs = sorted(questions.items(), key=lambda x: (x[1]['page'], x[1]['y']))
    
    for idx, (qn, info) in enumerate(sorted_qs):
        if idx < len(sorted_qs) - 1:
            next_info = sorted_qs[idx + 1]
            if next_info[1]['page'] == info['page']:
                height = next_info[1]['y'] - info['y']
            else:
                height = page_height - info['y'] + 50
        else:
            height = page_height - info['y'] + 50
        
        questions[qn]['height'] = height
        questions[qn]['top_margin'] = margin
        questions[qn]['bottom_margin'] = margin
    
    return questions


def render_pdf_pages(pdf_path: str, dpi: int = 150) -> List[Image.Image]:
    """Render PDF pages to images"""
    print(f"正在 render PDF (dpi={dpi})...")
    return convert_from_path(pdf_path, dpi=dpi)


def split_by_question_crops(images: List[Image.Image], 
                           question_coords: Dict[int, dict],
                           output_dir: str) -> List[Tuple[int, str, dict]]:
    """
    智能切割：用 pdfminer 精確 Y 坐標 + 計算高度 + 上下 margin
    每題範圍 = 題目 Y - top_margin 至 題目 Y + height + bottom_margin
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # 計算每題高度
    question_coords = calculate_question_heights(question_coords)
    
    # 按頁分組問題
    page_questions = {}
    for qn, info in question_coords.items():
        pg = info['page']
        if pg not in page_questions:
            page_questions[pg] = []
        page_questions[pg].append((qn, info))
    
    results = []
    page_height_pt = 841.89  # A4 PDF points height
    
    for page_num, q_list in sorted(page_questions.items()):
        if page_num < 1 or page_num > len(images):
            continue
        
        img = images[page_num - 1]
        w, h = img.size
        dpi_scale = h / page_height_pt  # 轉換 PDF points → 圖像 pixels
        
        # 排序問題（按 Y 坐標）
        q_list.sort(key=lambda x: x[1]['y'])
        
        for idx, (qn, info) in enumerate(q_list):
            # PDF Y 坐標（從頂部計算）轉換為圖像像素坐標
            y_pdf = info['y']
            y_px = y_pdf * dpi_scale
            
            height_px = info['height'] * dpi_scale
            top_margin_px = info['top_margin'] * dpi_scale
            bottom_margin_px = info['bottom_margin'] * dpi_scale
            
            # 計算切割範圍（上下各加 margin）
            top = max(0, int(y_px - top_margin_px))
            bottom = min(h, int(y_px + height_px + bottom_margin_px))
            
            # 確保唔超出邊界
            if idx == 0:
                top = 0  # 第一題從頂部開始
            
            # Crop
            cropped = img.crop((0, top, w, bottom))
            
            out_path = os.path.join(output_dir, f'Q{qn:02d}.png')
            cropped.save(out_path, 'PNG')
            
            # 評分
            result = calculate_score(out_path, qn)
            results.append((qn, out_path, result))
            
            print(f"  ✅ Q{qn:02d}.png (page {page_num}, y_pdf={y_pdf:.0f}, h={height_px:.0f}px, top={top}, bottom={bottom})")
    
    return results


def split_by_page_layout(images: List[Image.Image], output_dir: str) -> int:
    """按頁分割"""
    os.makedirs(output_dir, exist_ok=True)
    for i, img in enumerate(images, 1):
        out_path = os.path.join(output_dir, f'page_{i:02d}.png')
        img.save(out_path, 'PNG')
        print(f"  ✅ page_{i:02d}.png ({img.width}x{img.height})")
    return len(images)


def main():
    parser = argparse.ArgumentParser(description='PDF 試卷切割工具 (智能版)')
    parser.add_argument('pdf', help='PDF 檔案路徑')
    parser.add_argument('output', help='輸出資料夾')
    parser.add_argument('--dpi', type=int, default=150, help='Render DPI (default: 150)')
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
    
    # Get question Y coordinates using pdfminer
    question_coords = get_question_y_coordinates(args.pdf)
    print(f"📝 題目數: {len(question_coords)}")
    for qn, info in sorted(question_coords.items())[:5]:
        print(f"   Q{qn}: page={info['page']}, y={info['y']:.0f}, text='{info['text']}'")
    if len(question_coords) > 5:
        print(f"   ... and {len(question_coords) - 5} more")
    
    # 計算每題高度以便調試
    question_coords = calculate_question_heights(question_coords)
    
    # Show page distribution
    page_dist = {}
    for qn, info in question_coords.items():
        pg = info['page']
        page_dist[pg] = page_dist.get(pg, 0) + 1
    print(f"   頁面分佈: {page_dist}")
    
    # Split modes
    if args.mode in ('page', 'both'):
        page_dir = output_base / f'{pdf_name}_pages'
        print(f"\n📸 分割頁面 → {page_dir}")
        split_by_page_layout(images, str(page_dir))
    
    if args.mode in ('question', 'both'):
        q_dir = output_base / f'{pdf_name}_questions'
        print(f"\n✂️ 分割題目 → {q_dir}")
        
        results = split_by_question_crops(images, question_coords, str(q_dir))
        
        # 評分報告
        print(f"\n📊 評分報告:")
        total_score = 0
        pass_count = 0
        fail_count = 0
        
        for qn, path, result in sorted(results, key=lambda x: x[0]):
            print_score(path, result, qn)
            total_score += result['total']
            if result['passed']:
                pass_count += 1
            else:
                fail_count += 1
        
        avg_score = total_score / max(len(results), 1)
        print(f"\n📈 平均分: {avg_score:.1f}/100")
        print(f"   ✅ PASS: {pass_count}")
        print(f"   ❌ FAIL: {fail_count}")
        
        # 不合格刪除
        if fail_count > 0:
            print(f"\n🗑️  刪除不合格嘅切割結果...")
            for qn, path, result in results:
                if not result['passed']:
                    try:
                        os.remove(path)
                        print(f"   刪除: {path}")
                    except:
                        pass
            print(f"   提示：請調整演算法後重新運行")
    
    print(f"\n✅ 完成！")


if __name__ == '__main__':
    main()
