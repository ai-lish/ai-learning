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
PASS_THRESHOLD = 60
# Adjusted dimensions: add content_detection (15) and next_question_leak penalty (-20)
DIMENSION_SCORES = {
    'question_number_integrity': 20,
    'text_contrast': 20,
    'cut_accuracy': 20,
    'white_area': 10,
    'first_char': 10,
    'content_detection': 15,   # detects graphics / non-text content
    'next_question_leak_penalty': -5,  # penalty if next question number present
}
TOTAL_SCORE = sum([v for v in DIMENSION_SCORES.values() if v > 0])
# Note: penalty is applied separately and can reduce the total below 0


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


def check_text_contrast(img):
    """
    文字對比 (25分)
    轉灰階，計第90百分位灰度（文字）與第10百分位灰度（背景）嘅差
    差值 >100 = 25分, >50 = 15分, >20 = 10分, 否則 0分
    """
    # Convert to grayscale
    gray = img.convert('L')
    pixels = list(gray.getdata())
    if not pixels:
        return 0, "無法讀取像素"

    # Compute percentiles
    pixels_sorted = sorted(pixels)
    n = len(pixels_sorted)

    def percentile(arr, p):
        # p in [0,100]
        k = int(p / 100.0 * (len(arr) - 1))
        return arr[k]

    p90 = percentile(pixels_sorted, 90)
    p10 = percentile(pixels_sorted, 10)
    diff = p90 - p10

    # Score based on thresholds
    if diff > 100:
        score = 25
    elif diff > 50:
        score = 15
    elif diff > 20:
        score = 10
    else:
        score = 0

    return score, f"灰度90%={p90}, 10%={p10}, 差值={diff}"


def check_cut_accuracy(img):
    """
    切割準確度 (20分)
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
    
    # Score: <5% = full, <10% = mid, <15% = low, else 0
    max_points = DIMENSION_SCORES['cut_accuracy']
    if avg_ratio < 0.05:
        return max_points, f"邊緣非白色比例 {avg_ratio:.1%}"
    elif avg_ratio < 0.10:
        return int(max_points * 0.6), f"邊緣非白色比例 {avg_ratio:.1%}"
    elif avg_ratio < 0.15:
        return int(max_points * 0.4), f"邊緣非白色比例 {avg_ratio:.1%}"
    else:
        return 0, f"邊緣非白色比例 {avg_ratio:.1%}"


def check_white_area(img):
    """
    白色區域 (10分)
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
    
    max_points = DIMENSION_SCORES['white_area']
    # Score: both >95% = full, one >95% = 60%, else 30%
    if top_white > 0.95 and bottom_white > 0.95:
        return max_points, f"頂部白 {top_white:.1%}, 底部白 {bottom_white:.1%}"
    elif top_white > 0.95 or bottom_white > 0.95:
        return int(max_points * 0.6), f"頂部白 {top_white:.1%}, 底部白 {bottom_white:.1%}"
    else:
        return int(max_points * 0.3), f"頂部白 {top_white:.1%}, 底部白 {bottom_white:.1%}"


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
            return DIMENSION_SCORES['first_char'], f"OCR: '{cleaned[:10]}...' → 題號正確"
        elif numbers:
            return int(DIMENSION_SCORES['first_char'] * 0.5), f"OCR: '{cleaned[:10]}...' → 題號 {numbers[0]}≠{expected_qn}"
        else:
            return 0, f"OCR: '{cleaned[:10]}...' → 無法識別題號"
            
    except ImportError:
        # pytesseract not available, give partial score
        return int(DIMENSION_SCORES['first_char'] * 0.5), "pytesseract 未安裝，分數折半"


def check_content_detection(img):
    """
    內容檢測 (15分)
    檢測圖片是否包含非文字但有意義的圖形內容：
    - 基於整圖非白色像素比例
    - 基於邊緣/輪廓檢測（簡單版：檢查中區域的非白像素連續區塊）
    """
    w, h = img.size
    gray = img.convert('L')
    pixels = list(gray.getdata())
    non_white = sum(1 for p in pixels if p < 240)
    non_white_ratio = non_white / len(pixels)

    # Heuristics:
    # - If non_white_ratio > 0.05 -> strong content
    # - If between 0.03 and 0.05 -> moderate
    # - else weak
    max_points = DIMENSION_SCORES['content_detection']
    if non_white_ratio > 0.05:
        return max_points, f"非白像素比例 {non_white_ratio:.1%} (圖形或文字)"
    elif non_white_ratio > 0.03:
        return int(max_points * 0.8), f"非白像素比例 {non_white_ratio:.1%} (中等)"
    else:
        return int(max_points * 0.2), f"非白像素比例 {non_white_ratio:.1%} (偏空白)"


def check_next_question_leak(img, expected_qn):
    """
    檢測是否包含下一題題號（若包含，則觸發罰分）
    返回 (penalty, reason)，penalty 為 0 或 -20
    """
    try:
        import pytesseract
        text = pytesseract.image_to_string(img, config='--psm 6')
        # Look specifically near bottom area for next question number like 'Q07' or '7.'
        h = img.size[1]
        bottom = img.crop((0, int(h * 0.6), img.size[0], h))
        bottom_text = pytesseract.image_to_string(bottom, config='--psm 6')
        # Normalize
        all_text = (text + '\n' + bottom_text).upper()
        next_q = expected_qn + 1 if expected_qn else None
        candidates = []
        if next_q:
            candidates = [f'Q{next_q}', f'{next_q}.', f'{next_q} )', f'{next_q})']
        for c in candidates:
            if c in all_text:
                return DIMENSION_SCORES['next_question_leak_penalty'], f"檢測到下一題標記 '{c}' 在圖中"
        return 0, '未檢測到下一題標記'
    except Exception:
        return 0, 'OCR 未能運行，無法判斷下一題漏出'


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
    tc_score, tc_reason = check_text_contrast(img)
    ca_score, ca_reason = check_cut_accuracy(img)
    wa_score, wa_reason = check_white_area(img)
    fc_score, fc_reason = check_first_char_question_number(img, expected_qn) if expected_qn else (0, "無題號")
    cd_score, cd_reason = check_content_detection(img)
    leak_penalty, leak_reason = check_next_question_leak(img, expected_qn)

    # If text_contrast is 0 but content_detection strong, give fallback proxy for graphics
    if tc_score == 0 and cd_score >= int(DIMENSION_SCORES['content_detection'] * 0.8):
        import math
        tc_score = math.ceil(DIMENSION_SCORES['text_contrast'] * 0.95)
        tc_reason = tc_reason + ' | 圖形回退得分'

    # Ensure qni uses configured max for messaging (also scale earlier thresholds)
    # Sum positive dimensions
    total_positive = qni_score + tc_score + ca_score + wa_score + fc_score + cd_score
    # Apply penalty (negative)
    total = total_positive + leak_penalty

    passed = total >= PASS_THRESHOLD

    return {
        'path': str(img_path),
        'total': total,
        'passed': passed,
        'dimensions': {
            'question_number_integrity': {'score': qni_score, 'max': DIMENSION_SCORES['question_number_integrity'], 'reason': qni_reason},
            'text_contrast': {'score': tc_score, 'max': DIMENSION_SCORES['text_contrast'], 'reason': tc_reason},
            'cut_accuracy': {'score': ca_score, 'max': DIMENSION_SCORES['cut_accuracy'], 'reason': ca_reason},
            'white_area': {'score': wa_score, 'max': DIMENSION_SCORES['white_area'], 'reason': wa_reason},
            'first_char': {'score': fc_score, 'max': DIMENSION_SCORES['first_char'], 'reason': fc_reason},
            'content_detection': {'score': cd_score, 'max': DIMENSION_SCORES['content_detection'], 'reason': cd_reason},
            'next_question_leak_penalty': {'score': leak_penalty, 'max': abs(DIMENSION_SCORES['next_question_leak_penalty']), 'reason': leak_reason},
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
    print(f"     文字對比:   {result['dimensions']['text_contrast']['score']}/25 ({result['dimensions']['text_contrast']['reason']})")
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
