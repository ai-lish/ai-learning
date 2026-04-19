#!/usr/bin/env python3
"""
HKDSE 仿題生成器 - MiniMax API 客戶端
用法: python3 generate.py "原題文字" "課題" [--displacement 位移方向]
"""

import json
import sys
import os
import requests
from datetime import datetime

# MiniMax API 配置
API_KEY = os.environ.get('MINIMAX_API_KEY', '')
GROUP_ID = '2028908157014651652'
API_URL = 'https://api.minimax.io/v1/text/chatcompletion_pro'

SYSTEM_PROMPT = """你係 HKDSE 數學仿題生成器，專門為香港中學文憑試（HKDSE）數學科生成高質量仿題。

【核心原則】
1. 仿題唔係抄襲，係「似其神不抄其形」
2. 考核概念相同，但題境、數值、表達方式必須原創
3. 確保數學邏輯正確，答案準確
4. 適合香港中學生程度

【仿題類型】
- 數值變化：更換數字，保持相同解題步驟
- 概念位移：在同一課題內，轉移考核重點（如：加法→減法，古典概率→幾何概率）

【質量標準】
- 題目語境生活化，避免抄襲官方試題文字
- 難度與原題相若
- 答案唯一且正確
- 解題步驟清晰"""

def generate_question(original_question: str, topic: str, displacement: str = None, generalization: str = None) -> dict:
    """調用 MiniMax API 生成仿題"""
    
    if not API_KEY:
        return {
            'error': '請設置 MINIMAX_API_KEY 環境變量',
            'question_text': '（需要 API Key 才能生成）',
            'answer': '',
            'solution': ''
        }
    
    user_prompt = f"""【生成任務】

原題：
{original_question}

課題：{topic}
"""
    
    if generalization:
        user_prompt += f"\n題目概括（呢個係老師提供嘅題目結構指引）：\n{generalization}\n"
    
    if displacement:
        user_prompt += f"\n位移方向：{displacement}\n"
    else:
        user_prompt += "\n請隨機選擇適當嘅位移方向（數值變化或概念位移）\n"
    
    user_prompt += """
要求：
1. 生成一道仿題，保持同一課題
2. 題境原創，避免抄襲原題表達
3. 答案必須正確
4. 提供解題步驟

請用以下JSON格式輸出（只需要JSON，唔好有其他文字）：
{
  "question_text": "仿題內容",
  "answer": "答案",
  "solution": "解題步驟",
  "displacement_applied": "位移描述"
}"""
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_KEY}'
    }
    
    payload = {
        'model': 'MiniMax-Text-01',
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': user_prompt}
        ],
        'temperature': 0.7
    }
    
    try:
        resp = requests.post(
            f'{API_URL}?GroupId={GROUP_ID}',
            headers=headers,
            json=payload,
            timeout=60
        )
        resp.raise_for_status()
        data = resp.json()
        
        content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        # 解析 JSON
        import re
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            result = json.loads(json_match.group())
            result['source_question'] = original_question
            result['topic'] = topic
            result['generated_at'] = datetime.now().isoformat()
            return result
        else:
            return {'error': '無法解析生成結果', 'raw_content': content}
            
    except requests.exceptions.RequestException as e:
        return {'error': f'API 請求失敗：{str(e)}'}
    except json.JSONDecodeError as e:
        return {'error': f'JSON 解析失敗：{str(e)}'}

def batch_generate(questions: list, output_file: str = None):
    """批量生成仿題"""
    results = []
    
    for i, q in enumerate(questions):
        print(f'[{i+1}/{len(questions)}] 處理: {q.get("id", "unknown")}...')
        
        result = generate_question(
            original_question=q.get('question', q.get('question_text', '')),
            topic=q.get('topic', ''),
            displacement=q.get('displacement_hint'),
            generalization=q.get('generalization')
        )
        
        result['source_id'] = q.get('id', '')
        results.append(result)
        
        # 避免 API 限流
        if i < len(questions) - 1:
            import time
            time.sleep(1)
    
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f'\n已保存到: {output_file}')
    
    return results

# 測試
if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__)
        print('\n範例:')
        print('  python3 generate.py "計算 (-3) + (-7)" "有向數"')
        print('  python3 generate.py "從5件物品中抽3件" "概率" --displacement "古典概率 → 條件概率"')
        sys.exit(1)
    
    question = sys.argv[1]
    topic = sys.argv[2]
    displacement = None
    
    if '--displacement' in sys.argv:
        idx = sys.argv.index('--displacement')
        displacement = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else None
    
    result = generate_question(question, topic, displacement)
    print(json.dumps(result, ensure_ascii=False, indent=2))
