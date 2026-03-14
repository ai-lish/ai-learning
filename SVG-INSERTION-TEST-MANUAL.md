# S5 卷二 SVG 圖像插入測試手冊

## 重要教訓

### 問題根源
1. **stroke-width 錯誤替換** - 將 `width="100%"` 錯誤地替換到 `stroke-width` 屬性
2. **SVG 順序映射錯誤** - 導致錯誤既圖像放入錯誤既題目
3. **顏色問題** - stroke="#333333" 在深色背景睇唔到

---

## 測試流程

### 階段一：提取 SVG (Google Docs)

```bash
# 1. 確保最新版本
gog docs export "1-9BRd4G33eOwcJUnADEZe_aS5WamkTL5DFmgxDbYmxg" --format txt

# 2. 提取每題 SVG
python3 << 'PYEOF'
import re

with open('/Users/zachli/Library/Application Support/gogcli/drive-downloads/1-9BRd4G33eOwcJUnADEZe_aS5WamkTL5DFmgxDbYmxg_exam-svg.txt', 'r') as f:
    gdoc = f.read()

# 提取 Q9 為例
pattern = r'(2025-26-S5-2nd-term-p2-q9\n.*?)(?=2025-26-S5-2nd-term-p2-q16)'
match = re.search(pattern, gdoc, re.DOTALL)
if match:
    svg_match = re.search(r'(<svg.*?</svg>)', match.group(1), re.DOTALL)
    if svg_match:
        svg = svg_match.group(1)
        # ⚠️ 關鍵：只替換 width=，唔好掂 stroke-width
        svg = re.sub(r'\bwidth="\d+"', 'width="100%"', svg)
        svg = re.sub(r'\s*height="\d+"', '', svg)
        print(svg[:200])
PYEOF
```

### 階段二：驗證 SVG 結構

```python
# 檢查關鍵屬性
def validate_svg(svg_content):
    errors = []
    
    # 1. 檢查 stroke-width 冇被錯誤替換
    if 'stroke-width="100%"' in svg_content:
        errors.append("stroke-width 被錯誤替換！")
    
    # 2. 檢查有 viewBox
    if 'viewBox' not in svg_content:
        errors.append("缺少 viewBox")
    
    # 3. 數元素數量
    polygons = len(re.findall(r'<polygon', svg_content))
    circles = len(re.findall(r'<circle', svg_content))
    texts = len(re.findall(r'<text', svg_content))
    
    print(f"Elements: poly={polygons}, cir={circles}, text={texts}")
    
    return errors
```

### 階段三：插入 HTML

```python
# ⚠️ 關鍵：使用精確既替換模式
html = re.sub(
    r'(<div class="question-num">9\.</div>.*?<div class="svg-container">)\s*<svg[^>]*>.*?</svg>\s*(</div>)',
    r'\1\n                ' + svg_content + '\n            \2',
    html,
    flags=re.DOTALL
)
```

---

## 測試案例

### 案例 1：Q9 梯形

| 檢查項目 | 預期結果 | 測試方法 |
|----------|----------|----------|
| viewBox | 0 0 400 300 | `re.search(r'viewBox="([^"]+)"', svg)` |
| polygons | 4 | `len(re.findall(r'<polygon', svg))` |
| texts | 5 (D,C,A,E,B) | `re.findall(r'<text[^>]*>([^<]+)</text>', svg)` |
| stroke-width | 正常值 (非100%) | `stroke-width="100%"` = 錯誤 |

### 案例 2：Q16 圓形

| 檢查項目 | 預期結果 | 測試方法 |
|----------|----------|----------|
| circle | 1 | `len(re.findall(r'<circle', svg))` |
| stroke | #000000 或 #333333 | `re.search(r'stroke="([^"]+)"', svg)` |
| fill | none | `re.search(r'fill="([^"]+)"', svg)` |

---

## 自動化測試腳本

```python
#!/usr/bin/env python3
"""SVG Insertion Test Script"""

import re
import sys

def test_svg_extraction(gdoc_path, q_num):
    """Test extracting SVG from Google Docs"""
    with open(gdoc_path, 'r') as f:
        gdoc = f.read()
    
    pattern = rf'(2025-26-S5-2nd-term-p2-q{q_num}\n.*?)(?=2025-26-S5-2nd-term-p2-|$)'
    match = re.search(pattern, gdoc, re.DOTALL)
    
    if not match:
        print(f"❌ Q{q_num}: Section not found")
        return None
    
    svg_match = re.search(r'(<svg.*?</svg>)', match.group(1), re.DOTALL)
    if not svg_match:
        print(f"❌ Q{q_num}: SVG not found")
        return None
    
    svg = svg_match.group(1)
    
    # Validate
    errors = []
    
    if 'stroke-width="100%"' in svg:
        errors.append("stroke-width error")
    
    if 'width="100%"' not in svg and 'width="100%">' not in svg:
        # Check if width was properly replaced
        if re.search(r'width="\d+"', svg):
            errors.append("width not replaced")
    
    if errors:
        print(f"❌ Q{q_num}: {', '.join(errors)}")
    else:
        print(f"✅ Q{q_num}: OK")
    
    return svg

def test_svg_in_html(html_path, q_num):
    """Test SVG in HTML"""
    with open(html_path, 'r') as f:
        html = f.read()
    
    pattern = rf'question-num">{q_num}\.</div>.*?svg-container.*?<svg[^>]*>(.*?)</svg>'
    match = re.search(pattern, html, re.DOTALL)
    
    if not match:
        print(f"❌ Q{q_num}: Not found in HTML")
        return None
    
    svg = match.group(1)
    
    # Count elements
    polygons = len(re.findall(r'<polygon', svg))
    circles = len(re.findall(r'<circle', svg))
    paths = len(re.findall(r'<path', svg))
    
    print(f"Q{q_num}: poly={polygons}, cir={circles}, path={paths}")
    
    return svg

def compare_svgs(gdoc_svg, html_svg):
    """Compare two SVGs"""
    if gdoc_svg == html_svg:
        print("✅ SVGs match")
        return True
    
    # Compare element counts
    g_poly = len(re.findall(r'<polygon', gdoc_svg))
    h_poly = len(re.findall(r'<polygon', html_svg))
    
    if g_poly != h_poly:
        print(f"❌ Polygon count mismatch: {g_poly} vs {h_poly}")
    
    return False

if __name__ == '__main__':
    gdoc_path = '/Users/zachli/Library/Application Support/gogcli/drive-downloads/1-9BRd4G33eOwcJUnADEZe_aS5WamkTL5DFmgxDbYmxg_exam-svg.txt'
    html_path = '/Users/zachli/.openclaw/workspace/ai-learning/exam-2025-26-s5-term2-p2.html'
    
    # Test each question
    for q in [9, 16, 17, 18, 19, 22, 26, 27, 28, 29, 30]:
        print(f"\n=== Testing Q{q} ===")
        gdoc_svg = test_svg_extraction(gdoc_path, q)
        html_svg = test_svg_in_html(html_path, q)
        
        if gdoc_svg and html_svg:
            compare_svgs(gdoc_svg, html_svg)
```

---

## 執行測試

```bash
# 1. 導出最新 Google Docs
gog docs export "1-9BRd4G33eOwcJUnADEZe_aS5WamkTL5DFmgxDbYmxg" --format txt

# 2. 執行測試
python3 test_svg_insertion.py

# 3. 檢查結果
# ✅ = 通過
# ❌ = 失敗
```

---

## 常見問題

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| 黑色方塊 | stroke 顏色太淺 | 改用 #000000 |
| 圖像錯位 | 替換 stroke-width | 用 `\bwidth=` 邊界 |
| 元素消失 | height 被移除 | 保留 height 或用 CSS |
| 順序錯 | 正則匹配失敗 | 用精確既 question-num 匹配 |

---

## 成功關鍵

1. **只替換 width=**，唔好掂 stroke-width
2. **使用邊界匹配** `\bwidth=` 避免匹配到 stroke-width
3. **先備份** HTML 再修改
4. **逐題測試** 每次插入後驗證
5. **記錄錯誤** 發現問題立即停止
