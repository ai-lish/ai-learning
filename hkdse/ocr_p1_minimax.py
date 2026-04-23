#!/usr/bin/env python3
"""
MiniMax VLM OCR for DSE P1 images
重新 OCR 所有試卷圖片，更新 JSON
"""

import base64
import json
import os
import sys
import time
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

SCRIPT_DIR = Path(__file__).parent
IMAGES_DIR = SCRIPT_DIR / "images-p1"
JSON_PATH = SCRIPT_DIR / "pages" / "p1_all_scan_results.json"
API_KEY_PATH = Path.home() / ".openclaw" / "secrets.json"

MINIMAX_URL = "https://api.minimax.io/v1/coding_plan/vlm"

def get_api_key():
    with open(API_KEY_PATH) as f:
        return json.load(f)['minimax-api-key']

def ocr_image(image_path: Path) -> str:
    """用 MiniMax VLM OCR 一張圖片"""
    img_base64 = base64.b64encode(image_path.read_bytes()).decode()
    payload = {
        "prompt": "請完整識別呢張數學試卷題目圖片中的所有文字內容，包括所有數學符號、變量、數字、題目要求。用準確中文表達，保持數學格式。如果圖片係試卷一部分（如只需要識別某部分），請完整輸出你睇到的所有文字。",
        "image_url": f"data:image/jpeg;base64,{img_base64}"
    }
    headers = {
        "Authorization": f"Bearer {get_api_key()}",
        "Content-Type": "application/json"
    }
    
    for attempt in range(3):
        try:
            resp = requests.post(MINIMAX_URL, headers=headers, json=payload, timeout=180)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("base_resp", {}).get("status_code") == 0:
                    content = data.get("content", "").strip()
                    # 清理 MiniMax 返回的前綴解釋文字
                    # 1. 移除所有 Markdown bold/italic 格式
                    import re
                    content = re.sub(r'\*\*[^*]+\*\*', '', content)
                    content = re.sub(r'\*\*', '', content)
                    content = re.sub(r'\*[^*]+\*', '', content)
                    content = re.sub(r'\*', '', content)
                    
                    # 2. 移除 Markdown 標題 (# ## ### 等)
                    content = re.sub(r'^#+\s*', '', content, flags=re.MULTILINE)
                    
                    # 3. 移除 Markdown 列表前綴 (- * 等)
                    content = re.sub(r'^[-*]\s+', '', content, flags=re.MULTILINE)
                    
                    # 4. 移除解釋性前綴（使用更 aggressive 的模式匹配）
                    prefixes_to_remove = [
                        '這張圖片中嘅文字內容如下：',
                        '這是一張數學試卷題目的內容識別：',
                        '這是一份數學試卷題目的完整識別內容：',
                        '這是一張數學試卷題目的圖片，以下是圖中文字及數學內容的完整識別與轉錄：',
                        '這是在圖片中識別出的所有文字內容，包括數學符號、變量和題目要求：',
                        '請完整識別呢張數學試卷題目圖片中的所有文字內容，包括所有數學符號、變量、數字、題目要求。用準確中文表達，保持數學格式。如果圖片係試卷一部分（如只需要識別某部分），請完整輸出你睇到的所有文字。',
                        '這張圖片中的數學題目文字內容如下：',
                        '這張圖片中的數學題目文字內容完整識別如下：',
                        '這張圖片中的數學題目文字內容識別如下：',
                        '這張圖片中的文字和數學題目內容如下：',
                        '這張圖片中的題目內容完整識別如下：',
                        '這張圖片中的數學題目內容完整識別如下：',
                        '這張圖片中的文字內容如下：',
                        '這張圖片中顯示的是一道幾何數學題，以下是完整的文字內容識別：',
                        '這張圖片包含了一道幾何數學題目，以下是完整的文字內容識別：',
                        '這是一道數學題目，內容如下：',
                        '這是一份數學試卷的題目，以下是圖片中所有文字和數學內容的完整識別與整理：',
                        '這是一張數學試卷題目的完整文字識別內容：',
                        '這張圖片是一道關於圓形圖（扇形統計圖）的數學題目。以下是圖片中所有文字和符號的完整識別內容：',
                        '這張圖片是一道數學題目，內容識別如下：',
                        '這是在圖片中識別到的完整文字內容：',
                        '這張圖片顯示的是一道數學幾何題，以下是題目中的所有文字內容：',
                        '這是一張數學試卷題目圖片，以下是圖片中的完整文字內容：',
                        '這是在圖片中識別到的所有文字和符號：',
                    ]
                    for prefix in prefixes_to_remove:
                        if prefix in content:
                            content = content.replace(prefix, '')
                    
                    # 5. Aggressive: 移除所有 "這是..." 開頭的句子直到遇到第一個數字或數學符號
                    match = re.search(r'[\d$℃°]', content)
                    if match:
                        # 找到第一個數學字符位置，移除之前的所有內容
                        first_math_pos = match.start()
                        # 但要確保我們唔好移到太前，去搵真正嘅題目開始
                        # 嘗試向前找到換行或數字
                        before = content[:first_math_pos]
                        after = content[first_math_pos:]
                        # 如果 "before" 包含明顯的前綴，移除它
                        if len(before) > 5 and not before.strip().endswith(('(', '（')):
                            content = after
                    
                    # 6. 清理多餘空白
                    content = re.sub(r'\n{3,}', '\n\n', content)
                    content = content.strip('*\n ')
                    
                    return content
                else:
                    return f"ERROR: {data.get('base_resp', {})}"
            elif resp.status_code in (529, 520, 500):
                print(f"  Server overloaded, waiting 30s...")
                time.sleep(30)
            else:
                return f"ERROR: {resp.status_code}: {resp.text[:200]}"
        except requests.exceptions.Timeout:
            print(f"  Timeout, retry {attempt+1}/3")
            time.sleep(10)
        except Exception as e:
            return f"ERROR: {e}"
    return "FAILED_AFTER_RETRIES"

def main():
    # 讀取現有 JSON
    with open(JSON_PATH) as f:
        data = json.load(f)
    
    print(f"JSON 有 {len(data)} 條題目")
    
    # 獲取所有圖片
    images = sorted(IMAGES_DIR.glob("*.jpg"))
    print(f"圖片有 {len(images)} 張")
    
    # 建立 question_id -> image_path mapping
    image_map = {}
    for img in images:
        qid = img.stem  # e.g., "2012Q01"
        image_map[qid] = img
    
    # 只處理 JSON 中有的題目
    results = {}
    errors = []
    
    qids = sorted(data.keys())
    total = len(qids)
    
    # 檢查每條題目是否需要重新 OCR
    # 需要重新 OCR 的條件：
    # 1. question 包含殘留前綴（如 "呢張圖片", "這是", "**", "題目內容"）
    # 2. question 為空
    import re
    prefix_pattern = re.compile(r'(呢張圖片|這是|題目內容|data:image|ERROR|\*\*)')
    
    qids_to_ocr = []
    for qid in qids:
        if qid not in image_map:
            continue
        q_text = data[qid].get('question', '')
        # 如果包含殘留前綴或未更新，需要重新 OCR
        if prefix_pattern.search(q_text) or not q_text.strip():
            qids_to_ocr.append(qid)
    
    print(f"\n需要重新 OCR: {len(qids_to_ocr)} 條")
    print(f"跳過已乾淨的: {total - len(qids_to_ocr)} 條")
    
    for i, qid in enumerate(qids_to_ocr):
        img_path = image_map[qid]
        print(f"[{i+1}/{len(qids_to_ocr)}] {qid}: OCRing...", end=" ", flush=True)
        
        ocr_text = ocr_image(img_path)
        
        if ocr_text.startswith("ERROR") or ocr_text == "FAILED_AFTER_RETRIES":
            print(f"❌ {ocr_text[:50]}")
            errors.append((qid, ocr_text))
        else:
            # 更新 JSON
            data[qid]["question"] = ocr_text
            results[qid] = ocr_text[:80] + "..." if len(ocr_text) > 80 else ocr_text
            print(f"✅ {results[qid][:60]}")
        
        # 每 20 條增量保存一次
        if (i + 1) % 20 == 0:
            with open(JSON_PATH, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  💾 增量保存完成 ({i+1}/{len(qids_to_ocr)})")
        
        time.sleep(1)
    
    # 保存最終結果
    with open(JSON_PATH, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n已保存: {JSON_PATH}")
    
    if errors:
        print(f"\n❌ 有 {len(errors)} 條題目 OCR 失敗:")
        for qid, err in errors:
            print(f"  {qid}: {err}")
    else:
        print(f"\n✅ 全部 {len(results)} 條題目 OCR 完成！")
    
    # 顯示部分結果
    print("\n=== 樣本結果 ===")
    for qid in list(results.keys())[:5]:
        print(f"{qid}: {results[qid]}")

if __name__ == "__main__":
    main()
