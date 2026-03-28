#!/usr/bin/env python3
"""
分數專用預處理器
專門為了解決 OCR 分數堆疊問題
"""

import cv2
import numpy as np
from pathlib import Path

class FractionPreprocessor:
    """
    分數預處理策略：
    1. 偵測垂直堆疊文字（分子/分母）
    2. 合併為水平排列
    3. 強調水平線條（分數線）
    """
    
    def __init__(self):
        self.params = {
            'vertical_merge': True,  # 合併垂直堆疊
            'enhance_lines': True,   # 強調水平線
            'deskew': True,
            'target_dpi': 600        # 更高 DPI
        }
    
    def preprocess(self, image_path, output_path=None):
        """執行分數專用預處理"""
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"無法讀取: {image_path}")
        
        # 轉灰度
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 高 DPI 放大
        scale = 2.0  # 2x 放大
        h, w = gray.shape
        resized = cv2.resize(gray, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_CUBIC)
        
        # 去噪
        denoised = cv2.bilateralFilter(resized, 9, 75, 75)
        
        # CLAHE 對比增強
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(denoised)
        
        # 偵測並合併垂直堆疊
        merged = self.merge_vertical_stacks(enhanced)
        
        # 強調水平線（分數線）
        if self.params['enhance_lines']:
            enhanced = self.enhance_fraction_lines(merged)
        
        # 銳化
        sharpened = cv2.edgePreservingFilter(enhanced, sigma_s=60, sigma_r=0.4)
        
        if output_path:
            cv2.imwrite(str(output_path), sharpened)
        
        return sharpened
    
    def merge_vertical_stacks(self, img):
        """
        偵測垂直堆疊的文字方塊並合併
        這有助於將分子/分母合併為一行
        """
        # 二值化
        _, binary = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # 找輪廓
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # 按 y 座標分組
        lines = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if h > 5 and w > 5:  # 過濾太小
                lines.append((y, x, w, h))
        
        # 合併相近高度的方塊
        merged_lines = self.merge_close_lines(img, lines)
        
        return img
    
    def merge_close_lines(self, img, lines, threshold=15):
        """合併 y 座標相近的行"""
        if not lines:
            return img
        
        # 按 y 排序
        lines.sort(key=lambda x: x[0])
        
        # 分組
        groups = []
        current_group = [lines[0]]
        
        for i in range(1, len(lines)):
            if lines[i][0] - current_group[-1][0] < threshold:
                current_group.append(lines[i])
            else:
                groups.append(current_group)
                current_group = [lines[i]]
        groups.append(current_group)
        
        # 對於每組，只保留最寬的行
        result = img.copy()
        for group in groups:
            if len(group) > 1:
                # 計算組的邊界
                min_y = min(l[0] for l in group)
                max_h = max(l[3] for l in group)
                # 合併為一條粗線
                cv2.rectangle(result, (0, min_y), (img.shape[1], min_y + max_h), (255, 255, 255), -1)
        
        return result
    
    def enhance_fraction_lines(self, img):
        """
        強調水平線條，幫助 OCR 識別分數線
        """
        # Canny 邊緣檢測
        edges = cv2.Canny(img, 50, 150)
        
        # Hough 變換檢測直線
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, 
                                 minLineLength=30, maxLineGap=5)
        
        if lines is None:
            return img
        
        result = img.copy()
        
        for line in lines:
            x1, y1, x2, y2 = line[0]
            # 只處理接近水平的線
            angle = abs(np.arctan2(y2-y1, x2-x1) * 180 / np.pi)
            if angle < 10 or angle > 170:
                # 加粗這條線
                cv2.line(result, (x1, y1), (x2, y2), (255, 255, 255), 3)
        
        return result


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='分數專用預處理')
    parser.add_argument('input', help='輸入圖片')
    parser.add_argument('-o', '--output', help='輸出路徑')
    parser.add_argument('--dpi', type=int, default=600, help='目標 DPI')
    
    args = parser.parse_args()
    
    preprocessor = FractionPreprocessor()
    preprocessor.params['target_dpi'] = args.dpi
    
    result = preprocessor.preprocess(args.input, args.output)
    print(f"✅ 預處理完成: {args.output}")


if __name__ == '__main__':
    main()
