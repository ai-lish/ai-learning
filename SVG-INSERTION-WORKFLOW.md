# S5 SVG 插入最佳流程

## 準備階段

### 1. 導出最新 Google Docs
```bash
gog docs export "1-9BRd4G33eOwcJUnADEZe_aS5WamkTL5DFmgxDbYmxg" --format txt
```

### 2. 驗證導出成功
```bash
ls -la ~/Library/Application\ Support/gogcli/drive-downloads/*exam-svg.txt
```

---

## 提取階段 (關鍵！)

### 3. 提取 SVG - 正確方法

```python
import re

def extract_svg(gdoc_path, q_name):
    """正確提取 SVG"""
    with open(gdoc_path, 'r') as f:
        gdoc = f.read()
    
    # 找到題目區塊
    pattern = rf'(2025-26-S5-2nd-term-p2-{q_name}\n.*?)(?=2025-26-S5-2nd-term-p2-|$)'
    match = re.search(pattern, gdoc, re.DOTALL)
    
    if not match:
        return None
    
    # 提取 SVG
    svg_match = re.search(r'(<svg.*?</svg>)', match.group(1), re.DOTALL)
    if not svg_match:
        return None
    
    svg = svg_match.group(1)
    
    # ⚠️ 關鍵：只替換 width=，用 word boundary 避免影響 stroke-width
    svg = re.sub(r'\bwidth="\d+"', 'width="100%"', svg)
    
    # 移除 height
    svg = re.sub(r'\s+height="\d+"', '', svg)
    
    return svg
```

### 4. 驗證 SVG
```python
def validate_svg(svg, q_num):
    """驗證 SVG"""
    errors = []
    
    # 檢查 stroke-width 冇被錯誤替換
    if 'stroke-width="100%"' in svg:
        errors.append("stroke-width 被錯誤替換！")
    
    # 檢查有 viewBox
    if 'viewBox' not in svg:
        errors.append("缺少 viewBox")
    
    # 數元素
    polygons = len(re.findall(r'<polygon', svg))
    circles = len(re.findall(r'<circle', svg))
    paths = len(re.findall(r'<path', svg))
    texts = len(re.findall(r'<text', svg))
    
    print(f"Q{q_num}: poly={polygons}, cir={circles}, path={paths}, text={texts}")
    
    return errors
```

---

## 插入階段

### 5. 插入 SVG 到 HTML
```python
def insert_svg_to_html(html_path, q_num, svg):
    """插入 SVG 到正確位置"""
    with open(html_path, 'r') as f:
        html = f.read()
    
    # 精確匹配：找到 question-num > Qnum > svg-container
    pattern = rf'(<div class="question-num">{q_num}\.</div>.*?<div class="svg-container">)\s*<svg[^>]*>.*?</svg>\s*(</div>)'
    
    replacement = rf'\1\n                {svg}\n            \2'
    
    new_html = re.sub(pattern, replacement, html, flags=re.DOTALL)
    
    if new_html == html:
        print(f"⚠️ Q{q_num}: 替換失敗")
        return False
    
    with open(html_path, 'w') as f:
        f.write(new_html)
    
    return True
```

---

## 測試階段

### 6. 每次插入後驗證
```python
def verify_in_browser(q_num):
    """瀏覽器驗證"""
    # 截圖
    browser.screenshot()
    
    # 用戶確認
    input(f"Q{q_num} 顯示正確嗎？(Enter 繼續)")
```

---

## 完整流程脚本

```python
#!/usr/bin/env python3
"""S5 SVG 插入流程"""

import re
import sys

GDOC_PATH = '/Users/zachli/Library/Application Support/gogcli/drive-downloads/1-9BRd4G33eOwcJUnADEZe_aS5WamkTL5DFmgxDbYmxg_exam-svg.txt'
HTML_PATH = '/Users/zachli/.openclaw/workspace/ai-learning/exam-2025-26-s5-term2-p2.html'

# 要插入既題目
QUESTIONS = [
    (9, 'q9'),
    (16, 'q16'),
    (17, 'q17'),
    (18, 'q18'),
    (19, 'q19'),
    (22, 'q22'),
    (26, 'q26'),
    (27, 'q27'),
    (28, 'q28'),
    (29, 'q29'),
    (30, 'q30'),
]

def extract_svg(q_name):
    """提取 SVG"""
    with open(GDOC_PATH, 'r') as f:
        gdoc = f.read()
    
    pattern = rf'(2025-26-S5-2nd-term-p2-{q_name}\n.*?)(?=2025-26-S5-2nd-term-p2-|$)'
    match = re.search(pattern, gdoc, re.DOTALL)
    if not match:
        return None
    
    svg_match = re.search(r'(<svg.*?</svg>)', match.group(1), re.DOTALL)
    if not svg_match:
        return None
    
    svg = svg_match.group(1)
    
    # ⚠️ 關鍵：用 word boundary
    svg = re.sub(r'\bwidth="\d+"', 'width="100%"', svg)
    svg = re.sub(r'\s+height="\d+"', '', svg)
    
    return svg

def validate_svg(svg, q_num):
    """驗證"""
    errors = []
    
    if 'stroke-width="100%"' in svg:
        errors.append("stroke-width error!")
    
    if 'viewBox' not in svg:
        errors.append("No viewBox!")
    
    if errors:
        print(f"❌ Q{q_num}: {errors}")
        return False
    
    print(f"✅ Q{q_num}: OK")
    return True

def insert_svg(q_num, svg):
    """插入"""
    with open(HTML_PATH, 'r') as f:
        html = f.read()
    
    pattern = rf'(<div class="question-num">{q_num}\.</div>.*?<div class="svg-container">)\s*<svg[^>]*>.*?</svg>\s*(</div>)'
    replacement = rf'\1\n                {svg}\n            \2'
    
    new_html = re.sub(pattern, replacement, html, flags=re.DOTALL)
    
    if new_html == html:
        print(f"⚠️ Q{q_num}: 替換失敗")
        return False
    
    with open(HTML_PATH, 'w') as f:
        f.write(new_html)
    
    return True

def main():
    # 備份
    with open(HTML_PATH, 'r') as f:
        backup = f.read()
    
    with open(HTML_PATH + '.backup', 'w') as f:
        f.write(backup)
    
    print("已備份")
    
    # 逐題插入
    for q_num, q_name in QUESTIONS:
        print(f"\n處理 Q{q_num}...")
        
        svg = extract_svg(q_name)
        if not svg:
            print(f"❌ Q{q_num}: 提取失敗")
            continue
        
        if not validate_svg(svg, q_num):
            print(f"❌ Q{q_num}: 驗證失敗，跳過")
            continue
        
        if insert_svg(q_num, svg):
            print(f"✅ Q{q_num}: 已插入")
            
            # 用戶確認
            input("按 Enter 繼續下一題...")
        else:
            print(f"❌ Q{q_num}: 插入失敗")

if __name__ == '__main__':
    main()
```

---

## 成功關鍵點

1. **用 `\bwidth=`** - Word boundary 避免匹配 stroke-width
2. **先驗證** - 每次插入前檢查 SVG 結構
3. **逐題測試** - 每題插入後確認
4. **保持備份** - 出錯可以還原
5. **瀏覽器確認** - 最終要肉眼確認
