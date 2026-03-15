# S5 SVG 插入製作方法 (v3 - 修正版)

## 問題檢討 (v3 新增)

### 問題 1：stroke 顏色太淺
- **原因**: stroke="#333333" 在深色背景睇唔到
- **解決**: 插入後將 stroke 改為 #000000

### 問題 2：fill 顏色太深
- **原因**: fill="#000000" (黑色) 遮蓋咗線條
- **解決**: 插入後將 fill="none" 改為 fill="#ffffff" (白色)

### 問題 3：文字標籤消失 (v3 發現！)
- **現象**: SVG 內既文字標籤 (A, B, C, D, O 等) 唔顯示
- **原因**: `svg.replace('fill="#000000"', 'fill="#ffffff"')` 將所有 fill 都改咗，包括 text 既 fill
- **解決**: 用 regex 只改 stroke element 既 fill，唔改 text element 既 fill

### 問題 4：Placeholder 問題 (v3 發現！)
- **現象**: 所有 placeholder 既文字都寫住 "Q9 圖像"，唔可以用 question number 黎搵
- **原因**: 舊版本既 placeholder generator 用錯 question number
- **解決**: 用位置順序黎替換 (第一個 svg-container → 第一個 Google Docs SVG)

---

## 正確 Mapping 表

| Google Docs 題號 | HTML 位置 (順序) | 備註 |
|-----------------|----------------|------|
| Q9 → | 第 1 個 | |
| Q16 → | 第 2 個 | |
| Q17 → | 第 3 個 | |
| Q18 → | 第 4 個 | |
| Q19 → | 第 5 個 | |
| Q22 → | 第 6 個 | |
| Q26 → | 第 7 個 | |
| Q27 → | 第 8 個 | |
| Q28 → | 第 9 個 | |
| Q29 → | 第 10 個 | |
| Q30 → | 第 11 個 | |

---

## 完整製作流程

### Step 1: 準備 HTML
```bash
# 先清走 nested divs
html = html.replace('<div class="svg-container"><div class="svg-container">', '<div class="svg-container">')
html = re.sub(r'</div></div>\s*(</div>)', r'\1', html)
```

### Step 2: 提取 SVG (按順序)
```python
import re

GDOC = '/Users/zachli/Library/Application Support/gogcli/drive-downloads/1-9BRd4G33eOwcJUnADEZe_aS5WamkTL5DFmgxDbYmxg_exam-svg.txt'

# Google Docs 題目既順序
gdoc_questions = [9, 16, 17, 18, 19, 22, 26, 27, 28, 29, 30]

all_svgs = []
for gdoc_q in gdoc_questions:
    q_name = f'q{gdoc_q}'
    
    # 提取 SVG
    pattern = rf'(2025-26-S5-2nd-term-p2-{q_name}\n.*?)(?=2025-26-S5-2nd-term-p2-|$)'
    match = re.search(pattern, gdoc, re.DOTALL)
    if match:
        svgs = re.findall(r'(<svg[^>]*>.*?</svg>)', match.group(1), re.DOTALL)
        if svgs:
            all_svgs.append(svgs[0])  # 只取第一個
```

### Step 3: 修正 SVG (關鍵！)
```python
def fix_svg(svg):
    """修正 SVG - 正確方法"""
    
    # 1. 修正 width
    svg = re.sub(r'width="\d+"', 'width="100%"', svg)
    svg = re.sub(r'height="\d+"', '', svg)  # 移除 height
    
    # 2. 修正 stroke 顏色
    svg = svg.replace('stroke="#333333"', 'stroke="#000000"')
    
    # 3. 修正 fill 顏色 - 只能用 regex 改 stroke element，唔改 text！
    svg = re.sub(r'(<circle[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
    svg = re.sub(r'(<path[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
    svg = re.sub(r'(<polygon[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
    svg = re.sub(r'(<polyline[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
    svg = re.sub(r'(<line[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
    
    # ⚠️ 重要：唔好改 text 既 fill！
    # 正確：fill="#000000" 會保持黑色
    
    return svg
```

### Step 4: 插入 HTML (按順序)
```python
# 用位置順序黎替換
for svg in all_svgs:
    # 搵下一個未替換既 svg-container
    pattern = r'(<div class="svg-container">)\s*<svg[^>]*><text[^>]*>.*?</text></svg>\s*(</div>)'
    
    match = re.search(pattern, html)
    if match:
        replacement = rf'{match.group(1)} style="background:white;">{svg} {match.group(2)}'
        html = re.sub(pattern, replacement, html, count=1)
```

### Step 5: 加入背景
```python
# 加入白色背景
html = html.replace('<div class="svg-container">', '<div class="svg-container" style="background:white;">')
```

---

## 測試檢查清單

- [ ] 題目圖片顯示
- [ ] 文字標籤 (A, B, C, D, O) 可見
- [ ] stroke 顏色正確 (#000000)
- [ ] text fill 顏色正確 (#000000，黑色)
- [ ] shape fill 係透明 (none)

---

## 完整腳本

```python
#!/usr/bin/env python3
"""S5 SVG 插入流程 v3 - 修正版"""

import re

HTML = '/Users/zachli/.openclaw/workspace/ai-learning/exam-2025-26-s5-term2-p2.html'
GDOC = '/Users/zachli/Library/Application Support/gogcli/drive-downloads/1-9BRd4G33eOwcJUnADEZe_aS5WamkTL5DFmgxDbYmxg_exam-svg.txt'

# Read files
with open(HTML, 'r') as f:
    html = f.read()
with open(GDOC, 'r') as f:
    gdoc = f.read()

# Clean up nested divs
html = html.replace('<div class="svg-container"><div class="svg-container">', '<div class="svg-container">')
html = re.sub(r'</div></div>\s*(</div>)', r'\1', html)

# Google Docs questions in order
gdoc_questions = [9, 16, 17, 18, 19, 22, 26, 27, 28, 29, 30]

# Extract all SVGs in order
all_svgs = []
for gdoc_q in gdoc_questions:
    q_name = f'q{gdoc_q}'
    
    if gdoc_q == 30:
        pattern = rf'(2025-26-S5-2nd-term-p2-{q_name}\n.*?)$'
    else:
        pattern = rf'(2025-26-S5-2nd-term-p2-{q_name}\n.*?)(?=2025-26-S5-2nd-term-p2-|$)'
    
    match = re.search(pattern, gdoc, re.DOTALL)
    if match:
        section = match.group(1)
        svgs = re.findall(r'(<svg[^>]*>.*?</svg>)', section, re.DOTALL)
        if svgs:
            svg = svgs[0]
            
            # Fix width
            svg = re.sub(r'width="\d+"', 'width="100%"', svg)
            svg = re.sub(r'height="\d+"', '', svg)
            
            # Fix stroke color
            svg = svg.replace('stroke="#333333"', 'stroke="#000000"')
            
            # Fix fill for shapes ONLY (not text!)
            svg = re.sub(r'(<circle[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
            svg = re.sub(r'(<path[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
            svg = re.sub(r'(<polygon[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
            svg = re.sub(r'(<polyline[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
            svg = re.sub(r'(<line[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
            
            all_svgs.append(svg)
            print(f"Extracted Q{gdoc_q}")

print(f"Total: {len(all_svgs)} SVGs")

# Replace each svg-container in order
for i, svg in enumerate(all_svgs):
    pattern = r'(<div class="svg-container">)\s*<svg[^>]*><text[^>]*>.*?</text></svg>\s*(</div>)'
    
    match = re.search(pattern, html)
    if match:
        replacement = rf'{match.group(1)} style="background:white;">{svg} {match.group(2)}'
        html = re.sub(pattern, replacement, html, count=1)
        print(f"Replaced SVG #{i+1}")

# Save
with open(HTML, 'w') as f:
    f.write(html)

print("✅ Done!")
```

---

## 關鍵要點

1. **提取時**：按 Google Docs 既順序提取
2. **修正顏色時**：只用 regex 改 shape element 既 fill，text 既 fill 保持 #000000
3. **插入時**：用位置順序黎替換 (第一個 svg-container → 第一個 Google Docs SVG)
4. **測試時**：確認文字標籤可見

---

## 更新歷史

- **v1**: 最初版本
- **v2**: 加入顏色修正
- **v3**: 修正 text color 問題 + placeholder 問題
