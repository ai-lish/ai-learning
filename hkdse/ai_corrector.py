#!/usr/bin/env python3
"""
HKDSE AI 校正系統
功能：數學符號修正、OCR 錯誤模式學習、兩次結果對比
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from difflib import SequenceMatcher

@dataclass
class CorrectionResult:
    original: str
    corrected: str
    corrections: List[Dict]
    confidence: float

class MathSymbolCorrector:
    """數學符號自動修正"""
    
    # 常見 OCR 錯誤映射 (繁體中文數學試卷)
    # 只包含明確的錯誤，避免過度修正變數
    COMMON_ERRORS = {
        # 明確的符號錯誤
        '＋': '+',     '－': '-',     '±': '+/-',   '·': '.',
        '−': '-',     '≧': '>=',    '≦': '<=',
        
        # 明確的中文OCR錯誤
        '蘭': '位',    # 2位 vs 2蘭 (部門/名額)
        '炙': '35',   # 形似數字 (統計題)
        '監': '藍',   # 顏色錯誤 (杯/碗的顏色)
        '碗': '碗',   # 可能本身就是碗
        '候': '候',   # 保持
        '選': '選',   # 保持
        
        # 數學專用符號
        'π': 'pi',    '∵': 'since',  '∴': 'therefore',
        '√': 'sqrt',  '∞': 'infinity',
    }
    
    # 希臘字母
    GREEK_LETTERS = {
        'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
        'θ': 'theta', 'λ': 'lambda', 'μ': 'mu', 'σ': 'sigma',
        'φ': 'phi',   'ω': 'omega', 'Γ': 'Gamma', 'Δ': 'Delta',
        'Θ': 'Theta', 'Λ': 'Lambda', 'Σ': 'Sigma', 'Φ': 'Phi',
    }
    
    # 單位
    UNITS = {
        'cm': 'cm', 'm': 'm', 'km': 'km', 'mm': 'mm',
        'kg': 'kg', 'g': 'g', 'mg': 'mg',
        'cm²': 'cm²', 'm²': 'm²', 'cm³': 'cm³',
    }
    
    def __init__(self):
        self.corrections_history = []
    
    def correct_text(self, text: str, auto_fix: bool = True) -> CorrectionResult:
        """
        對文本進行符號校正
        
        Args:
            text: 原始 OCR 文字
            auto_fix: 是否自動修正
        
        Returns:
            CorrectionResult 包含原始、校正後文字同修正列表
        """
        original = text
        corrections = []
        
        if not auto_fix:
            return CorrectionResult(original, original, [], 1.0)
        
        corrected = text
        
        # 1. 基本符號替換
        for wrong, right in self.COMMON_ERRORS.items():
            if wrong in corrected:
                count = corrected.count(wrong)
                corrections.append({
                    'type': 'symbol',
                    'from': wrong,
                    'to': right,
                    'count': count
                })
                corrected = corrected.replace(wrong, right)
        
        # 2. 括號內數字修正
        # 例如 "3)4" 應該是 "3)×4" 或 "3)×4"
        corrected = re.sub(r'(\d)\)(\d)', r'\1)×\2', corrected)
        corrected = re.sub(r'(\d)\) ', r'\1)× ', corrected)
        
        # 3. 分數表示標準化
        # 例如 "a/b" 轉為 "a÷b" (數學意義)
        # 但保留一般除法
        
        # 4. 百分數表示
        # 例如 "80%" 保持不變
        
        # 5. 負數表示
        corrected = re.sub(r'([^0-9])-([0-9])', r'\1-\2', corrected)
        
        # 6. 計算修正數量作為信心度
        if len(original) > 0:
            correction_rate = len(corrections) / len(original)
            confidence = max(0.0, 1.0 - correction_rate)
        else:
            confidence = 1.0
        
        return CorrectionResult(original, corrected, corrections, confidence)


class OCRComparator:
    """兩次 OCR 結果對比"""
    
    def __init__(self):
        self.diff_patterns = []
    
    def compare(self, text1: str, text2: str) -> Dict:
        """
        對比兩次 OCR 結果
        
        Returns:
            包含差異列表同相似度
        """
        if not text1 or not text2:
            return {
                'similarity': 0.0,
                'differences': [],
                'text1_only': text1,
                'text2_only': text2
            }
        
        # 計算相似度
        matcher = SequenceMatcher(None, text1, text2)
        similarity = matcher.ratio()
        
        # 找出差異區塊
        differences = []
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag != 'equal':
                differences.append({
                    'type': tag,
                    'text1': text1[i1:i2],
                    'text2': text2[j1:j2],
                    'position': (i1, i2)
                })
        
        return {
            'similarity': similarity,
            'differences': differences,
            'text1_only': text1,
            'text2_only': text2
        }
    
    def merge_comparisons(self, comparisons: List[Dict]) -> Dict:
        """
        合併多次對比結果，找出規律
        """
        all_diffs = []
        for comp in comparisons:
            all_diffs.extend(comp.get('differences', []))
        
        # 統計差異模式
        patterns = {}
        for diff in all_diffs:
            key = (diff['text1'], diff['text2'])
            patterns[key] = patterns.get(key, 0) + 1
        
        # 按頻率排序
        sorted_patterns = sorted(patterns.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'total_comparisons': len(comparisons),
            'total_differences': len(all_diffs),
            'common_patterns': sorted_patterns[:10]
        }


class ProbabilityErrorLearner:
    """
    概率統計題專用錯誤學習
    
    概率題常見錯誤：
    - 伯努利、利臣斯公式符號
    - 組合數 C(n,r) 誤判
    - 階乘 n! 誤判
    """
    
    def __init__(self):
        self.error_log = []
    
    def learn_from_ocr(self, image_path: str, ocr_text: str, verified_text: str) -> Dict:
        """
        學習 OCR 錯誤模式
        
        對比 OCR 結果同已核實文字，更新錯誤模式
        """
        if ocr_text == verified_text:
            return {'status': 'no_error'}
        
        # 記錄錯誤模式
        # 例如: "C(n,r)" vs "C(n,r)" OCR 錯誤
        
        return {}
    
    def apply_probability_corrections(self, text: str) -> str:
        """
        應用概率題專用修正
        """
        corrections = []
        
        # 組合數 C(n,r) 標準化
        # 匹配 C(n,r), C_n^r, C(n,r) 等變體
        text = re.sub(r'C\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)', r'C(\1,\2)', text)
        text = re.sub(r'C\s*(\d+)\s*,\s*(\d+)', r'C(\1,\2)', text)
        
        # 階乘 n! 標準化
        text = re.sub(r'(\d)\s*!', r'\1!', text)
        
        # P(n,r) 排列數
        text = re.sub(r'P\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)', r'P(\1,\2)', text)
        
        # 分數概率
        # 例如 "1/2" 保持 "1/2"
        
        return text


class AICorrector:
    """
    AI 校正系統主類
    整合符號修正、對比學習、信心度評估
    """
    
    def __init__(self):
        self.symbol_corrector = MathSymbolCorrector()
        self.comparator = OCRComparator()
        self.probability_learner = ProbabilityErrorLearner()
        self.confidence_thresholds = {
            'high': 0.9,
            'medium': 0.7,
            'low': 0.0
        }
    
    def assess_confidence(self, ocr_text: str, corrections: List[Dict]) -> Tuple[str, float]:
        """
        評估 OCR 結果信心度
        
        Returns:
            (信心等級, 信心分數)
        """
        # 基礎信心度
        if len(ocr_text) == 0:
            return 'low', 0.0
        
        # 根據修正數量調整
        correction_penalty = len(corrections) * 0.05
        base_confidence = max(0.0, 0.95 - correction_penalty)
        
        # 根據文字特徵調整
        # 數學符號多 = 難度高
        math_symbols = re.findall(r'[÷×+−\-\+\*/=]', ocr_text)
        if len(math_symbols) > 10:
            base_confidence *= 0.9
        
        # 圖形描述多 = 可能需要人工
        if '圖' in ocr_text or '見下圖' in ocr_text:
            base_confidence *= 0.85
        
        # 判斷等級
        if base_confidence >= self.confidence_thresholds['high']:
            level = 'high'
        elif base_confidence >= self.confidence_thresholds['medium']:
            level = 'medium'
        else:
            level = 'low'
        
        return level, base_confidence
    
    def correct_and_assess(self, ocr_text: str) -> Dict:
        """
        完整校正流程：符號修正 → 信心度評估
        
        Returns:
            {
                'original': 原始文字,
                'corrected': 校正後文字,
                'confidence_level': 信心等級,
                'confidence_score': 信心分數,
                'corrections': 修正列表,
                'needs_review': 是否需要人工審核
            }
        """
        # 1. 符號修正
        result = self.symbol_corrector.correct_text(ocr_text)
        
        # 2. 概率題專用修正
        corrected_text = self.probability_learner.apply_probability_corrections(result.corrected)
        
        # 3. 信心度評估
        level, score = self.assess_confidence(ocr_text, result.corrections)
        
        # 4. 判斷是否需要審核
        needs_review = level in ['medium', 'low']
        
        return {
            'original': result.original,
            'corrected': corrected_text,
            'confidence_level': level,
            'confidence_score': round(score, 3),
            'corrections': result.corrections,
            'needs_review': needs_review,
            'status': '✅ 直接採用' if level == 'high' else '⚠️ 需要確認' if level == 'medium' else '🔴 人工審核'
        }
    
    def batch_process(self, ocr_results: List[Dict]) -> List[Dict]:
        """
        批量處理 OCR 結果
        
        Args:
            ocr_results: OCR JSON 中的題目列表
        
        Returns:
            包含校正結果的新列表
        """
        processed = []
        
        for item in ocr_results:
            ocr_text = item.get('ocr_text', '')
            corrected_result = self.correct_and_assess(ocr_text)
            
            # 合併結果
            processed_item = {
                **item,
                'ai_corrected_text': corrected_result['corrected'],
                'ai_confidence_level': corrected_result['confidence_level'],
                'ai_confidence_score': corrected_result['confidence_score'],
                'ai_corrections': corrected_result['corrections'],
                'ai_needs_review': corrected_result['needs_review'],
                'ai_status': corrected_result['status']
            }
            
            processed.append(processed_item)
        
        # 統計
        stats = {
            'total': len(processed),
            'high_confidence': sum(1 for p in processed if p['ai_confidence_level'] == 'high'),
            'medium_confidence': sum(1 for p in processed if p['ai_confidence_level'] == 'medium'),
            'low_confidence': sum(1 for p in processed if p['ai_confidence_level'] == 'low'),
            'needs_review': sum(1 for p in processed if p['ai_needs_review'])
        }
        
        return {
            'results': processed,
            'statistics': stats
        }


def main():
    """測試 AI 校正系統"""
    corrector = AICorrector()
    
    # 測試案例
    test_cases = [
        "某公司有 8 個部門。每個部門各提名 2 蘭代表以成立一個有 16 位成員的工作小組。",
        "從該工作小組中隨機選出 4 位成員。",
        "求所選出的 4 位成員由 4 個不同部門提名的概率。",
        "寫出 A 委員會的委員年歲的中位數及眾數。",
        "某盒子內有 5 個白色杯及 11 個監色杯。若從該盒子中隨機同時抽出 6 個杯。",
    ]
    
    print("=== AI 校正系統測試 ===\n")
    
    for text in test_cases:
        result = corrector.correct_and_assess(text)
        print(f"【原文】{result['original'][:50]}...")
        print(f"【校正】{result['corrected'][:50]}...")
        print(f"【狀態】{result['status']} (信心度: {result['confidence_score']})")
        if result['corrections']:
            print(f"【修正】{result['corrections']}")
        print()


if __name__ == '__main__':
    main()
