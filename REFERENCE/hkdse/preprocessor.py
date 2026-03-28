#!/usr/bin/env python3
"""
HKDSE OCR 預處理系統
功能：去噪、對比增強、二值化、旋轉校正、放大
"""

import cv2
import numpy as np
from pathlib import Path
import sys
from PIL import Image
import argparse

class ImagePreprocessor:
    def __init__(self):
        self.params = {
            'denoise': True,
            'contrast': True,
            'binarize': True,
            'deskew': True,
            'resize': True,
            'target_dpi': 300
        }
    
    def load_image(self, image_path):
        """載入圖片"""
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"無法讀取圖片: {image_path}")
        return img
    
    def denoise(self, img):
        """去噪 - 清除掃描雜點"""
        # 使用雙邊濾波器，保留邊緣同時去噪
        return cv2.bilateralFilter(img, 9, 75, 75)
    
    def enhance_contrast(self, img):
        """對比增強 - CLAHE"""
        # 轉為灰度
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # CLAHE (對比受限自適應直方圖均衡化)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        return enhanced
    
    def binarize(self, img):
        """二值化 - 自適應閾值"""
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
        
        # 自適應閾值 (Adaptive Threshold)
        # 比全局閾值更好處理不均勻光照
        binary = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )
        return binary
    
    def deskew(self, img):
        """旋轉校正 - 修正歪斜頁面"""
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img
        
        # 找輪廓
        contours, _ = cv2.findContours(
            gray, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        
        if not contours:
            return img
        
        # 找最大輪廓
        max_contour = max(contours, key=cv2.contourArea)
        
        # 計算最小面積矩形
        rect = cv2.minAreaRect(max_contour)
        angle = rect[2]
        
        # 調整角度
        if angle < -45:
            angle = angle + 90
        elif angle > 45:
            angle = angle - 90
        
        # 如果角度太小，不用校正
        if abs(angle) < 0.5:
            return img
        
        # 取得旋轉矩陣
        h, w = gray.shape
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        
        # 旋轉
        rotated = cv2.warpAffine(
            img, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        
        return rotated
    
    def resize_to_dpi(self, img, target_dpi=300):
        """放大至 300 DPI"""
        if len(img.shape) == 3:
            h, w = img.shape[:2]
        else:
            h, w = img.shape
        
        # 計算縮放因子 (假設原始為 96 DPI)
        current_dpi = 96
        scale = target_dpi / current_dpi
        
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        return resized
    
    def preprocess(self, image_path, output_path=None, steps=None):
        """
        執行預處理流程
        
        順序：去噪 → 對比 → 二值化 → 旋轉校正 → 放大
        """
        if steps is None:
            steps = ['denoise', 'contrast', 'binarize', 'deskew', 'resize']
        
        print(f"📷 載入圖片: {image_path}")
        img = self.load_image(image_path)
        original = img.copy()
        
        processed_steps = []
        
        for step in steps:
            if step == 'denoise' and self.params['denoise']:
                print("  🔧 去噪 (bilateral filter)...")
                img = self.denoise(img)
                processed_steps.append('去噪')
            
            elif step == 'contrast' and self.params['contrast']:
                print("  🔆 對比增強 (CLAHE)...")
                img = self.enhance_contrast(img)
                processed_steps.append('對比')
            
            elif step == 'binarize' and self.params['binarize']:
                print("  ◐ 二值化 (adaptive threshold)...")
                img = self.binarize(img)
                processed_steps.append('二值化')
            
            elif step == 'deskew' and self.params['deskew']:
                print("  📐 旋轉校正 (deskew)...")
                img = self.deskew(img)
                processed_steps.append('校正')
            
            elif step == 'resize' and self.params['resize']:
                print(f"  📏 放大 ({self.params['target_dpi']} DPI)...")
                img = self.resize_to_dpi(img, self.params['target_dpi'])
                processed_steps.append('放大')
        
        # 保存結果
        if output_path:
            print(f"💾 保存預處理結果: {output_path}")
            cv2.imwrite(str(output_path), img)
        
        return {
            'original': original,
            'processed': img,
            'steps': processed_steps,
            'output_path': output_path
        }
    
    def batch_process(self, input_dir, output_dir, steps=None):
        """批量處理目錄內所有圖片"""
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # 支援的圖片格式
        extensions = ['.jpg', '.jpeg', '.png', '.tif', '.tiff']
        
        images = []
        for ext in extensions:
            images.extend(input_path.glob(f'*{ext}'))
            images.extend(input_path.glob(f'*{ext.upper()}'))
        
        print(f"📁 找到 {len(images)} 張圖片")
        
        results = []
        for img_path in sorted(images):
            print(f"\n{'='*50}")
            try:
                out_file = output_path / img_path.name
                result = self.preprocess(img_path, out_file, steps)
                results.append({
                    'file': img_path.name,
                    'status': 'success',
                    'steps': result['steps']
                })
            except Exception as e:
                print(f"  ❌ 錯誤: {e}")
                results.append({
                    'file': img_path.name,
                    'status': 'error',
                    'error': str(e)
                })
        
        # 統計
        success = sum(1 for r in results if r['status'] == 'success')
        failed = sum(1 for r in results if r['status'] == 'error')
        
        print(f"\n{'='*50}")
        print(f"✅ 完成！成功: {success}, 失敗: {failed}")
        
        return results


def main():
    parser = argparse.ArgumentParser(description='HKDSE OCR 預處理系統')
    parser.add_argument('input', help='輸入圖片或目錄')
    parser.add_argument('-o', '--output', help='輸出路徑（單一檔案或目錄）')
    parser.add_argument('--steps', nargs='+', 
                       choices=['denoise', 'contrast', 'binarize', 'deskew', 'resize', 'all'],
                       default=['all'],
                       help='選擇預處理步驟')
    parser.add_argument('--dpi', type=int, default=300, help='目標 DPI (預設 300)')
    parser.add_argument('--no-denoise', action='store_true', help='跳過去噪')
    parser.add_argument('--no-contrast', action='store_true', help='跳過對比增強')
    parser.add_argument('--no-binarize', action='store_true', help='跳過二值化')
    parser.add_argument('--no-deskew', action='store_true', help='跳過旋轉校正')
    parser.add_argument('--no-resize', action='store_true', help='跳過放大')
    
    args = parser.parse_args()
    
    preprocessor = ImagePreprocessor()
    preprocessor.params['target_dpi'] = args.dpi
    
    if args.no_denoise:
        preprocessor.params['denoise'] = False
    if args.no_contrast:
        preprocessor.params['contrast'] = False
    if args.no_binarize:
        preprocessor.params['binarize'] = False
    if args.no_deskew:
        preprocessor.params['deskew'] = False
    if args.no_resize:
        preprocessor.params['resize'] = False
    
    # 處理步驟
    steps = args.steps
    if 'all' in steps:
        steps = ['denoise', 'contrast', 'binarize', 'deskew', 'resize']
    
    input_path = Path(args.input)
    
    if input_path.is_file():
        # 單一檔案
        output = args.output or str(input_path.stem) + '_processed.jpg'
        preprocessor.preprocess(input_path, output, steps)
    elif input_path.is_dir():
        # 目錄批量處理
        output_dir = args.output or str(input_path) + '_processed'
        preprocessor.batch_process(input_path, output_dir, steps)
    else:
        print(f"❌ 輸入路徑不存在: {input_path}")
        sys.exit(1)


if __name__ == '__main__':
    main()
