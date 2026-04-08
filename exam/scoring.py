#!/usr/bin/env python3
"""
題目圖片評分系統
用途：評估切割後嘅題目圖片質量

評分維度：
- 題號完整性 (25分)：圖片上半部分有深色文字
- 顏色保留 (25分)：顏色像素比例 5-40% 正常
- 切割準確度 (25分)：邊緣非白色像素 < 5%
- 白色區域 (15分)：頂部/底部邊緣全白
- 第一字符題號 (10分)：OCR 第一個字符係正確題號

合格線：≥ 80分
不合格：< 80分 → 自動刪除，提示調整
"""

import os
import sys
import re
import argparse
from pathlib import Path
from PIL import Image
import subprocess

# Constants
PASS_THRESHOLD = 80
DIMENSION_SCORES = {
    'question_number_integrity': 25,
    'color_preservation': 25,
    'cut_accuracy': 25,
    'white_area': 15,
    'first_char': 10,
}
TOTAL_SCORE = sum(DIMENSION_SCORES.values())


def check_question_number_integrity(img):
    """
    題號完整性 (25分)
    圖片上半部分有深色文字
    """
    w, h = img.size
    top_half = img.crop((0, 0, w, h // 2))
    
    # Convert to grayscale and check for dark pixels
    gray = top_half.convert('L')
    pixels = list(gray.getdata())
    
    # Count dark pixels (threshold < 128)
    dark_count = sum(1 for p in pixels if p < 128)
    dark_ratio = dark_count / len(pixels)
    
    # Score: >10% dark pixels = 25分, >5% = 15分, >2% = 10分, else 0
    if dark_ratio > 0.10:
        return 25, f"深色像素比例 {dark_ratio:.1%}"
    elif dark_ratio > 0.05:
        return 15, f"深色像素比例 {dark_ratio:.1%}"
    elif dark_ratio > 0.02:
        return 10, f"深色像素比例 {dark_ratio:.1%}"
    else:
        return 0, f"深色像素比例 {dark_ratio:.1%}"


def check_color_preservation(img):
    """
    顏色保留 (25分)
    顏色像素比例 5-40% 正常
    """
    # Convert to RGB to check for colored pixels
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    pixels = list(img.getdata())
    
    # Count colored pixels (not grayscale)
    # A pixel is considered "colored" if R, G, B values differ significantly
    colored_count = 0
    for r, g, b in pixels:
        # Check if the pixel has noticeable color (not just gray)
        # Using simple variance check
        max_val = max(r, g, b)
        min_val = min(r, g, b)
        if max_val - min_val > 15:  # Has noticeable color
            colored_count += 1
    
    colored_ratio = colored_count / len(pixels)
    
    # Score: 5-40% = 25分, 2-5% or 40-50% = 15分, else 0
    if 0.05 <= colored_ratio <= 0.40:
        return 25, f"顏色像素比例 {colored_ratio:.1%}"
    elif 0.02 <= colored_ratio < 0.05 or 0.40 < colored_ratio <= 0.50:
        return 15, f"顏色像素比例 {colored_ratio:.1%}"
    else:
        return 0, f"顏色像素比例 {colored_ratio:.1%}"


def check_cut_accuracy(img):
    """
    切割準確度 (25分)
    邊緣非白色像素 < 5%
    """
    w, h = img.size
    edge_height = max(h // 20, 10)  # Top and bottom 5% each
    
    # Check top edge
    top_edge = img.crop((0, 0, w, edge_height))
    # Check bottom edge
    bottom_edge = img.crop((0, h - edge_height, w, h))
    
    def check_edge_purity(edge_img):
        """Check if edge is mostly white"""
        gray = edge_img.convert('L')
        pixels = list(gray.getdata())
        # Count non-white pixels (threshold > 240 is white)
        non_white = sum(1 for p in pixels if p < 240)
        return non_white / len(pixels)
    
    top_ratio = check_edge_purity(top_edge)
    bottom_ratio = check_edge_purity(bottom_edge)
    avg_ratio = (top_ratio + bottom_ratio) / 2
    
    # Score: <5% = 25分, <10% = 15分, <15% = 10分, else 0
    if avg_ratio < 0.05:
        return 25, f"邊緣非白色比例 {avg_ratio:.1%}"
    elif avg_ratio < 0.10:
        return 15, f"邊緣非白色比例 {avg_ratio:.1%}"
    elif avg_ratio < 0.15:
        return 10, f"邊緣非白色比例 {avg_ratio:.1%}"
    else:
        return 0, f"邊緣非白色比例 {avg_ratio:.1%}"


def check_white_area(img):
    """
    白色區域 (15分)
    頂部/底部邊緣全白
    """
    w, h = img.size
    edge_height = max(h // 10, 15)  # Top and bottom 10% each
    
    # Check top edge
    top_edge = img.crop((0, 0, w, edge_height))
    # Check bottom edge
    bottom_edge = img.crop((0, h - edge_height, w, h))
    
    def check_all_white(edge_img):
        """Check if entire edge is white (>95% pixels > 250)"""
        gray = edge_img.convert('L')
        pixels = list(gray.getdata())
        white_count = sum(1 for p in pixels if p > 250)
        return white_count / len(pixels)
    
    top_white = check_all_white(top_edge)
    bottom_white = check_all_white(bottom_edge)
    
    # Score: both >95% = 15分, one >95% = 10分, else 5分
    if top_white > 0.95 and bottom_white > 0.95:
        return 15, f"頂部白 {top_white:.1%}, 底部白 {bottom_white:.1%}"
    elif top_white > 0.95 or bottom_white > 0.95:
        return 10, f"頂部白 {top_white:.1%}, 底部白 {bottom_white:.1%}"
    else:
        return 5, f"頂部白 {top_white:.1%}, 底部白 {bottom_white:.1%}"


def check_first_char_question_number(img, expected_qn):
    """
    第一字符題號 (10分)
    OCR 第一個字符係正確題號
    """
    try:
        import pytesseract
        
        # Run OCR on the top portion of the image
        w, h = img.size
        top_area = img.crop((0, 0, w, h // 4))  # Top 25%
        
        text = pytesseract.image_to_string(top_area, config='--psm 6')
        
        # Clean the text - remove spaces and get first characters
        cleaned = re.sub(r'\s+', '', text).strip()
        
        # Check if first character/number matches expected question number
        first_chars = cleaned[:3]  # Get first 3 chars to be safe
        
        # Try to extract number from the text
        numbers = re.findall(r'\d+', first_chars)
        
        if numbers and int(numbers[0]) == expected_qn:
            return 10, f"OCR: '{cleaned[:10]}...' → 題號正確"
        elif numbers:
            return 5, f"OCR: '{cleaned[:10]}...' → 題號 {numbers[0]}≠{expected_qn}"
        else:
            return 0, f"OCR: '{cleaned[:10]}...' → 無法識別題號"
            
    except ImportError:
        # pytesseract not available, give partial score
        return 5, "pytesseract 未安裝，分數折半"


def score_image(img_path, expected_qn=None):
    """
    評分一張圖片
    
    Args:
        img_path: 圖片路徑
        expected_qn: 期望的題號 (如 Q05 中的 5)
    
    Returns:
        dict: 包含總分、各維度分數、是否合格
    """
    img = Image.open(img_path)
    
    # Extract question number from filename if not provided
    if expected_qn is None:
        filename = os.path.basename(img_path)
        m = re.search(r'Q(\d+)', filename)
        if m:
            expected_qn = int(m.group(1))
    
    # Run all checks
    qni_score, qni_reason = check_question_number_integrity(img)
    cp_score, cp_reason = check_color_preservation(img)
    ca_score, ca_reason = check_cut_accuracy(img)
    wa_score, wa_reason = check_white_area(img)
    fc_score, fc_reason = check_first_char_question_number(img, expected_qn) if expected_qn else (0, "無題號")
    
    total = qni_score + cp_score + ca_score + wa_score + fc_score
    passed = total >= PASS_THRESHOLD
    
    return {
        'path': str(img_path),
        'total': total,
        'passed': passed,
        'dimensions': {
            'question_number_integrity': {'score': qni_score, 'max': 25, 'reason': qni_reason},
            'color_preservation': {'score': cp_score, 'max': 25, 'reason': cp_reason},
            'cut_accuracy': {'score': ca_score, 'max': 25, 'reason': ca_reason},
            'white_area': {'score': wa_score, 'max': 15, 'reason': wa_reason},
            'first_char': {'score': fc_score, 'max': 10, 'reason': fc_reason},
        },
        'expected_qn': expected_qn,
    }


def score_and_report(img_path, expected_qn=None, auto_delete=True):
    """
    評分並匯報結果，自動刪除不合格圖片
    """
    result = score_image(img_path, expected_qn)
    
    # Print detailed report
    status = "✅ 合格" if result['passed'] else "❌ 不合格"
    print(f"\n  📊 {os.path.basename(img_path)} - {result['total']}分 {status}")
    print(f"     題號完整性: {result['dimensions']['question_number_integrity']['score']}/25 ({result['dimensions']['question_number_integrity']['reason']})")
    print(f"     顏色保留:   {result['dimensions']['color_preservation']['score']}/25 ({result['dimensions']['color_preservation']['reason']})")
    print(f"     切割準確度: {result['dimensions']['cut_accuracy']['score']}/25 ({result['dimensions']['cut_accuracy']['reason']})")
    print(f"     白色區域:   {result['dimensions']['white_area']['score']}/15 ({result['dimensions']['white_area']['reason']})")
    print(f"     第一字符:   {result['dimensions']['first_char']['score']}/10 ({result['dimensions']['first_char']['reason']})")
    
    # Auto delete if failed
    if not result['passed'] and auto_delete:
        try:
            os.remove(img_path)
            print(f"     🗑️ 已刪除不合格圖片")
        except Exception as e:
            print(f"     ⚠️ 刪除失敗: {e}")
    
    return result


def main():
    parser = argparse.ArgumentParser(description='題目圖片評分工具')
    parser.add_argument('image', help='圖片檔案路徑')
    parser.add_argument('--no-delete', action='store_true', help='不合格時不要自動刪除')
    parser.add_argument('--qn', type=int, help='期望的題號')
    args = parser.parse_args()
    
    result = score_and_report(args.image, args.qn, auto_delete=not args.no_delete)
    sys.exit(0 if result['passed'] else 1)


if __name__ == '__main__':
    main()
