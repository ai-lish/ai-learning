#!/usr/bin/env python3
"""
HKDSE Re-OCR 引擎
功能：對低信心度題目使用不同設定重新處理
"""

import json
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import argparse

@dataclass
class OCRResult:
    text: str
    confidence: float
    settings: Dict
    timestamp: str

class ReOCREngine:
    """
    Re-OCR 引擎
    
    功能：
    1. 一鍵重新OCR低信心度題目
    2. 批量處理
    3. 預處理選擇（去噪/放大/對比等不同組合）
    4. 結果比較（新舊並排）
    """
    
    # OCR 預設配置
    PRESETS = {
        'default': {
            'lang': 'chi_tra+eng',
            'psm': 6,  # 自動分頁
            'oem': 3,  # LSTM OCR Engine
        },
        'single_line': {
            'lang': 'chi_tra+eng',
            'psm': 7,  # 把文字當作單一行
            'oem': 3,
        },
        'single_block': {
            'lang': 'chi_tra+eng',
            'psm': 3,  # 把文字當作單一區塊
            'oem': 3,
        },
        'sparse': {
            'lang': 'chi_tra+eng',
            'psm': 11,  # 稀疏文字
            'oem': 3,
        },
        'math_focused': {
            'lang': 'chi_tra+eng',
            'psm': 6,
            'oem': 3,
            'custom_config': '--斩杀f 0.9',
        },
    }
    
    def __init__(self, images_dir: str = None):
        self.images_dir = Path(images_dir) if images_dir else None
        self.results_history = []
    
    def ocr_with_settings(self, image_path: str, preset: str = 'default') -> OCRResult:
        """
        使用指定預設對圖片進行OCR
        
        Args:
            image_path: 圖片路徑
            preset: 預設名稱 ('default', 'single_line', 'single_block', 'sparse', 'math_focused')
        
        Returns:
            OCRResult 包含識別文字、信心度同設定
        """
        if preset not in self.PRESETS:
            preset = 'default'
        
        settings = self.PRESETS[preset]
        
        try:
            # 構建 tesseract 命令
            cmd = [
                'tesseract',
                str(image_path),
                'stdout',
                '-l', settings['lang'],
                '--psm', str(settings['psm']),
                '--oem', str(settings['oem']),
            ]
            
            # 添加自訂配置
            if 'custom_config' in settings:
                cmd.append(settings['custom_config'])
            
            # 執行 OCR
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120
            )
            
            text = result.stdout.strip()
            
            # 估算信心度（基於輸出長度和字符分佈）
            confidence = self._estimate_confidence(text)
            
            return OCRResult(
                text=text,
                confidence=confidence,
                settings=settings,
                timestamp=datetime.now().isoformat()
            )
            
        except subprocess.TimeoutExpired:
            return OCRResult(
                text="[OCR 超時]",
                confidence=0.0,
                settings=settings,
                timestamp=datetime.now().isoformat()
            )
        except Exception as e:
            return OCRResult(
                text=f"[OCR 錯誤: {e}]",
                confidence=0.0,
                settings=settings,
                timestamp=datetime.now().isoformat()
            )
    
    def _estimate_confidence(self, text: str) -> float:
        """
        估算 OCR 結果信心度
        
        基於：
        1. 文字長度
        2. 字符分佈（數字、字母、符號比例）
        3. 亂碼檢測
        """
        if not text or len(text) < 5:
            return 0.0
        
        # 基礎分
        score = 0.5
        
        # 長度調整
        if len(text) > 20:
            score += 0.1
        if len(text) > 100:
            score += 0.1
        
        # 亂碼檢測（包含太多未知字符）
        unknown_chars = text.count('�') / len(text)
        score -= unknown_chars * 0.3
        
        # 數字符號比例（數學題通常有數字符號）
        digit_count = sum(1 for c in text if c.isdigit())
        symbol_count = sum(1 for c in text if c in '+-×÷*/=()[]{}.,')
        math_ratio = (digit_count + symbol_count) / len(text) if len(text) > 0 else 0
        
        # 數學題通常 math_ratio 在 0.2-0.6 之間
        if 0.1 < math_ratio < 0.7:
            score += 0.15
        
        # 中文字符比例
        chinese_count = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        chinese_ratio = chinese_count / len(text) if len(text) > 0 else 0
        
        if chinese_ratio > 0.3:
            score += 0.15
        
        return max(0.0, min(1.0, score))
    
    def re_ocr_with_multiple_presets(self, image_path: str) -> Dict[str, OCRResult]:
        """
        使用多個預設對同一張圖片進行 OCR，返回最佳結果
        
        Returns:
            Dict of preset_name -> OCRResult
        """
        results = {}
        
        for preset_name in self.PRESETS.keys():
            result = self.ocr_with_settings(image_path, preset_name)
            results[preset_name] = result
        
        return results
    
    def find_best_preset(self, results: Dict[str, OCRResult]) -> Tuple[str, OCRResult]:
        """
        找出多個預設中的最佳結果
        
        Returns:
            (best_preset_name, best_result)
        """
        best_name = None
        best_result = None
        best_confidence = -1
        
        for name, result in results.items():
            if result.confidence > best_confidence:
                best_confidence = result.confidence
                best_name = name
                best_result = result
        
        return best_name, best_result
    
    def compare_results(self, old_text: str, new_results: Dict[str, OCRResult]) -> Dict:
        """
        比較舊結果同新結果
        
        Returns:
            包含差異分析同建議
        """
        best_preset, best_result = self.find_best_preset(new_results)
        
        comparison = {
            'old_text': old_text,
            'old_length': len(old_text),
            'new_text': best_result.text,
            'new_length': len(best_result.text),
            'best_preset': best_preset,
            'best_confidence': best_result.confidence,
            'all_presets': {
                name: {
                    'confidence': r.confidence,
                    'length': len(r.text),
                    'text_preview': r.text[:100] if r.text else ''
                }
                for name, r in new_results.items()
            },
            'improvement': best_result.confidence > 0.7 and len(best_result.text) > len(old_text) * 0.8
        }
        
        return comparison
    
    def batch_re_ocr(self, questions: List[Dict], images_dir: str = None) -> List[Dict]:
        """
        批量重新 OCR 低信心度題目
        
        Args:
            questions: 包含 id, image_url 等欄位的題目列表
            images_dir: 圖片目錄
        
        Returns:
            處理結果列表
        """
        if images_dir:
            img_dir = Path(images_dir)
        else:
            img_dir = self.images_dir
        
        results = []
        
        for q in questions:
            q_id = q.get('id', 'unknown')
            old_text = q.get('ocr_text', '')
            
            # 嘗試找圖片
            image_path = None
            if img_dir:
                # 嘗試多種擴展名
                for ext in ['.jpg', '.png', '.jpeg']:
                    potential_path = img_dir / f"{q_id}{ext}"
                    if potential_path.exists():
                        image_path = potential_path
                        break
            
            if not image_path:
                results.append({
                    'id': q_id,
                    'status': 'image_not_found',
                    'old_text': old_text
                })
                continue
            
            # 執行多預設 OCR
            ocr_results = self.re_ocr_with_multiple_presets(str(image_path))
            comparison = self.compare_results(old_text, ocr_results)
            
            results.append({
                'id': q_id,
                'status': 'success',
                'old_text': old_text,
                'new_text': comparison['new_text'],
                'best_preset': comparison['best_preset'],
                'confidence': comparison['best_confidence'],
                'all_results': comparison['all_presets'],
                'improvement': comparison['improvement']
            })
        
        return results


def main():
    parser = argparse.ArgumentParser(description='HKDSE Re-OCR 引擎')
    parser.add_argument('question_ids', nargs='*', help='題目 ID (如 2012Q01 2012Q02)')
    parser.add_argument('--image-dir', '-i', default='ocr-output/images-simple/p1',
                       help='圖片目錄')
    parser.add_argument('--preset', '-p', default='default',
                       choices=['default', 'single_line', 'single_block', 'sparse', 'math_focused'],
                       help='OCR 預設')
    parser.add_argument('--all-presets', '-a', action='store_true',
                       help='使用所有預設並比較')
    parser.add_argument('--output', '-o', help='輸出 JSON 檔案')
    
    args = parser.parse_args()
    
    engine = ReOCREngine(images_dir=args.image_dir)
    
    if args.question_ids:
        # 處理指定的題目
        results = engine.batch_re_ocr(
            [{'id': qid} for qid in args.question_ids],
            images_dir=args.image_dir
        )
        
        for r in results:
            print(f"\n=== {r['id']} ===")
            if r['status'] == 'success':
                print(f"最佳預設: {r['best_preset']}")
                print(f"信心度: {r['confidence']:.2f}")
                print(f"新文字: {r['new_text'][:100]}...")
                print(f"提升: {'✅' if r['improvement'] else '⚠️'}")
            else:
                print(f"狀態: {r['status']}")
    
    else:
        print("=== Re-OCR 引擎 ===")
        print("使用方法:")
        print("  python3 re_ocr.py 2012Q01 2012Q02")
        print("  python3 re_ocr.py 2012Q01 --all-presets")
        print("  python3 re_ocr.py 2012Q01 --preset single_line")


if __name__ == '__main__':
    main()
