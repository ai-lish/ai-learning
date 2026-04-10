#!/usr/bin/env python3
"""
PDF Question Splitter v3 (智能切割版)
用途：將 PDF 試卷自動切割為每條題目的獨立圖片

演算法核心：
1. 用 pdfminer 拎每個 LTTextLine 嘅精確 Y 坐標
2. 每題嘅高度 = 下一題 Y 坐標 - 目前題 Y 坐標
3. 上下各加 1cm margin
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

def calculate_score(image_path: str, expected_question: int, next_question_num: int = None) -> dict:
    """計算切割圖片嘅評分
    
    新評分標準（100分）：
    - 題號完整性：25分（頂部有題號）
    - 切割準確度：50分（頂部乾淨 + 底部冇下一題漏題）
    - 白色區域：25分（頂部/底部邊緣乾淨白色）
    """
    try:
        import re
        img = Image.open(image_path)
        pixels = img.load()
        w, h = img.size
        
        scores = {'question_integrity': 0, 'cut_accuracy': 0, 'white_area': 0}
        details = {}
        
        # 1. 題號完整性 (25分)
        # 檢查頂部區域是否有深色像素（表示有題號）
        has_question_number = False
        for y in range(min(h, 100)):
            dark_count = sum(1 for x in range(min(w, 300)) 
                           if max(*pixels[x, y][:3]) < 100)
            if dark_count > 20:
                has_question_number = True
                break
        scores['question_integrity'] = 25 if has_question_number else 0
        details['has_question_number'] = has_question_number
        
        # 2. 切割準確度 (50分)
        # 2a. 頂部邊緣清潔度
        top_edge_dirty = sum(1 for x in range(w) if max(*pixels[x, 0][:3]) < 250) / max(w, 1)
        top_score = 0
        if top_edge_dirty < 0.02: top_score = 25  # 完全乾淨
        elif top_edge_dirty < 0.10: top_score = 20  # 基本乾淨
        elif top_edge_dirty < 0.25: top_score = 10  # 有些少乾擾
        else: top_score = 0  # 太髒
        
        # 2b. 底部下一題漏題檢測（最重要！）
        # 如果下一題的題號出現在底部 = 切多咗
        bottom_leak = False
        bottom_leak_text = ''
        try:
            import pytesseract
            # 只截取底部 20% 的區域
            bottom_region = img.crop((0, int(h * 0.8), w, h))
            bottom_text = pytesseract.image_to_string(bottom_region, config='--psm 6')
            # 檢測是否有下一題題號出現（數字 + . 嘅組合）
            if next_question_num is not None:
                # 檢測 "下一題題號." 或 "下一題題號 ." 模式
                next_q_patterns = [
                    str(next_question_num) + '.',
                    str(next_question_num) + ' .',
                    str(next_question_num).zfill(2) + '.',
                    str(next_question_num).zfill(2) + ' .'
                ]
                # 通用模式：行首有數字+
                leak_pattern = re.search(r'\n\s*(\d+)\.[\s\S]*', bottom_text)
                if leak_pattern:
                    found_num = int(leak_pattern.group(1))
                    if found_num >= next_question_num:
                        bottom_leak = True
                        bottom_leak_text = f'發現 {found_num}. 在底部'
        except ImportError:
            pass
        
        # 底部像素分析：邊緣有冇深色像素（表示有內容）
        bottom_content_ratio = sum(1 for x in range(w) if max(*pixels[x, h-1][:3]) < 200) / max(w, 1)
        if bottom_leak:
            bottom_score = 0  # 完全失敗
        elif bottom_content_ratio < 0.01: bottom_score = 25  # 底部乾淨
        elif bottom_content_ratio < 0.10: bottom_score = 20  # 基本乾淨
        elif bottom_content_ratio < 0.25: bottom_score = 10  # 有些少內容
        else: bottom_score = 5  # 底部有內容（可能是漏題）
        
        scores['cut_accuracy'] = top_score + bottom_score
        details['top_edge_dirty'] = f"{top_edge_dirty:.2%}"
        details['bottom_content'] = f"{bottom_content_ratio:.2%}"
        details['bottom_leak'] = bottom_leak
        if bottom_leak_text:
            details['bottom_leak_text'] = bottom_leak_text
        
        # 3. 白色區域 (25分) - 頂部和底部邊緣都係白色
        top_white = all(all(pixels[x, 0][i] > 250 for i in range(3)) for x in range(0, w, 10))
        bottom_white = all(all(pixels[x, h-1][i] > 250 for i in range(3)) for x in range(0, w, 10))
        if top_white and bottom_white:
            scores['white_area'] = 25
        elif top_white or bottom_white:
            scores['white_area'] = 15
        else:
            scores['white_area'] = 5
        details['top_white'] = top_white
        details['bottom_white'] = bottom_white
        
        total = sum(scores.values())
        return {'total': total, 'passed': total >= PASS_SCORE, **scores, 'details': details}
    except Exception as e:
        return {'total': 0, 'passed': False, 'error': str(e)}


def print_score(image_path: str, result: dict, question_num: int):
    status = "✅ PASS" if result['passed'] else "❌ FAIL"
    leak_flag = "⚠️ 漏題" if result.get('details', {}).get('bottom_leak') else ""
    print(f"  Q{question_num:02d}: {result['total']:.1f}/100 {status} {leak_flag}")
    print(f"       題號完整性: {result.get('question_integrity',0):.0f}/25 | {result.get('details',{}).get('has_question_number',False)}")
    print(f"       切割準確度: {result.get('cut_accuracy',0):.0f}/50 | top={result.get('details',{}).get('top_edge_dirty','?')} bottom={result.get('details',{}).get('bottom_content','?')}")
    print(f"       白色區域:   {result.get('white_area',0):.0f}/25 | top白={result.get('details',{}).get('top_white')} bottom白={result.get('details',{}).get('bottom_white')}")


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
    上下各加 1cm margin (約14 points @ 72dpi)
    
    關鍵：bottom = next_question_y - bottom_margin，唔係 current_y + height + margin
    """
    CM_TO_POINTS = 28.35
    margin = CM_TO_POINTS * 1.5  # 1.5cm margin (保護長題目的D答案完整)
    
    sorted_qs = sorted(questions.items(), key=lambda x: (x[1]['page'], x[1]['y']))
    
    for idx, (qn, info) in enumerate(sorted_qs):
        if idx < len(sorted_qs) - 1:
            next_info = sorted_qs[idx + 1]
            if next_info[1]['page'] == info['page']:
                # 同一頁：height = 下一題Y - 目前題Y
                height = next_info[1]['y'] - info['y']
                next_y = next_info[1]['y']  # 記錄下一題Y用於bottom計算
            else:
                # 跨頁：height = page_height - info['y'] + 50
                height = page_height - info['y'] + 50
                next_y = None  # 跨頁題的最後一題用 page_height
        else:
            # 最後一題
            height = page_height - info['y'] + 50
            next_y = None
        
        questions[qn]['height'] = height
        questions[qn]['next_y'] = next_y
        questions[qn]['top_margin'] = CM_TO_POINTS * 0.5  # 0.3cm for top
        questions[qn]['bottom_margin'] = CM_TO_POINTS * 1.0  # 1cm for bottom
    
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
            next_y = info['next_y']
            
            # 計算切割範圍
            # top = current_y - top_margin (由題目Y減上方margin)
            # bottom = next_y - bottom_margin (由下一題Y減下方margin，唔係加喺當前題高度)
            top = max(0, int(y_px - top_margin_px))
            
            if next_y is not None:
                # 同一頁：bottom = 下一題Y - bottom_margin
                next_y_px = next_y * dpi_scale
                bottom = min(h, int(next_y_px - bottom_margin_px))
            else:
                # 跨頁最後一題：bottom = page bottom + margin
                bottom = min(h, int(y_px + height_px + bottom_margin_px))
            
            # 確保唔超出邊界
            
            # Crop - 使用全寬度避免切走右側內容（D答案、圖像）
            cropped = img.crop((0, top, w, bottom))
            
            out_path = os.path.join(output_dir, f'Q{qn:02d}.png')
            cropped.save(out_path, 'PNG')
            
            # 評分（傳入下一題題號用於漏題檢測）
            all_qns = sorted(question_coords.keys())
            next_qn = None
            try:
                idx = all_qns.index(qn)
                if idx + 1 < len(all_qns):
                    next_qn = all_qns[idx + 1]
            except ValueError:
                pass
            result = calculate_score(out_path, qn, next_qn)
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
        
        # NOTE: 原始版本會刪除不合格圖片。為了保留所有圖片（任務要求），我們不會刪除任何檔案。
        if fail_count > 0:
            print(f"\n⚠️ 有 {fail_count} 張圖片未達標，但根據任務要求不會刪除它們。請檢查：")
            for qn, path, result in results:
                if not result['passed']:
                    print(f"   ⚠ Q{qn:02d}: {path} -> {result['total']:.1f}/100")
            print(f"   建議：如需重新切割，請調整演算法後手動重新運行")
    
    print(f"\n✅ 完成！")


if __name__ == '__main__':
    main()
