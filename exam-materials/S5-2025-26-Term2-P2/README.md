# S5 2025-26 Term 2 Paper 2 - SVG 插入製作方法

## 考試資料
- **年份**: 2025-26
- **級別**: S5 (中五)
- **學期**: Term 2 (第二次考試)
- **卷別**: Paper 2 (卷二選擇題)

## 題目清單

| 題號 | 類型 | SVG數量 | 備註 |
|------|------|---------|------|
| Q9 | 圖像題 | 1 | 梯形 |
| Q16 | 圖像題 | 1 | 圓形 |
| Q17 | 圖像題 | 1 | 圓形 |
| Q18 | 圖像題 | 1 | 圓形 |
| Q19 | 圖像題 | 1 | 半圓 |
| Q22 | 圖像題 | 5 | 1題目+4選項 |
| Q26 | 圖像題 | 1 | 棒形圖 |
| Q27 | 圖像題 | 1 | 累積頻數多邊形 |
| Q28 | 圖像題 | 1 | 幹葉圖 |
| Q29 | 圖像題 | 1 | 統計圖 |
| Q30 | 圖像題 | 1 | 框線圖 |

## 已知問題

### 問題 1：stroke-width 被錯誤替換
- **現象**: 出現 stroke-width="100%" 導致黑色方塊
- **原因**: regex 替換 width 時連 stroke-width 都改埋
- **解決**: 使用正確既 regex `re.sub(r'(<svg[^>]*)(\s+)width="\d+"', r'\1\2width="100%"', svg)`

### 問題 2：Text Fill 被錯誤替換
- **現象**: 文字標籤 (A, B, C, D, O) 消失
- **原因**: `svg.replace('fill="#000000"', 'fill="#ffffff"')` 將所有 fill 都改埋
- **解決**: 用 regex 只改 shape element 既 fill，text 保持 #000000

### 問題 3：HTML 結構錯誤
- **現象**: `<div class="svg-container"> style="background:white;">` 多咗 `>`
- **解決**: 保持結構完整

### 問題 4：Pattern Fill
- **現象**: Q27 既 grid 用 `fill="url(#largeGrid)"`
- **解決**: 將 pattern fill 轉為透明

---

## 製作流程

### Step 1: 準備 HTML
```bash
# 清走 nested divs
html = html.replace('<div class="svg-container"><div class="svg-container">', '<div class="svg-container">')
html = re.sub(r'</div></div>\s*(</div>)', r'\1', html)
```

### Step 2: 提取 SVG (按順序)
```python
gdoc_questions = [9, 16, 17, 18, 19, 22, 26, 27, 28, 29, 30]

# 特別注意 Q22 有 5 個 SVG！
```

### Step 3: 修正 SVG
```python
def fix_svg(svg):
    # 1. 修正 width - 使用正確既 regex
    svg = re.sub(r'(<svg[^>]*)(\s+)width="\d+"', r'\1\2width="100%"', svg)
    svg = re.sub(r'\s+height="\d+"', '', svg)
    
    # 2. 修正 stroke 顏色
    svg = svg.replace('stroke="#333333"', 'stroke="#000000"')
    
    # 3. 修正 fill - 只改 shape，唔改 text
    svg = re.sub(r'(<circle[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
    svg = re.sub(r'(<path[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
    svg = re.sub(r'(<polygon[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
    svg = re.sub(r'(<polyline[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
    svg = re.sub(r'(<line[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
    svg = re.sub(r'(<rect[^>]*)\s+fill="[^"]*"', r'\1 fill="none"', svg)
    
    # 4. 修正 pattern fill -> none
    svg = svg.replace('fill="url(#largeGrid)"', 'fill="none"')
    svg = svg.replace('fill="url(#smallGrid)"', 'fill="none"')
    
    return svg
```

### Step 4: 插入 HTML
```python
# 按順序替換每個 svg-container
for svg in all_svgs:
    pattern = r'(<div class="svg-container">)\s*<svg[^>]*><text[^>]*>.*?</text></svg>\s*(</div>)'
    match = re.search(pattern, html)
    if match:
        replacement = rf'{match.group(1)}<div class="svg-container" style="background:white;">{svg}</div>{match.group(2)}'
        html = re.sub(pattern, replacement, html, count=1)
```

### Step 5: 加入背景
```python
html = html.replace('<div class="svg-container">', '<div class="svg-container" style="background:white;">')
```

---

## 測試檢查清單

- [ ] Q9: 梯形圖顯示 + 文字標籤
- [ ] Q16: 圓形圖顯示 + 文字標籤
- [ ] Q17: 圓形圖顯示 + 文字標籤
- [ ] Q18: 圓形圖顯示 + 文字標籤
- [ ] Q19: 半圓圖顯示
- [ ] Q22: 題目 + 4個選項圖片
- [ ] Q26: 棒形圖 (bars) 顯示
- [ ] Q27: 累積頻數圖 + 坐標軸
- [ ] Q28: 幹葉圖顯示
- [ ] Q29: 統計圖顯示
- [ ] Q30: 框線圖完整

---

## 更新歷史

- **v1**: 最初版本
- **v2**: 加入顏色修正
- **v3**: 修正 text color + placeholder
- **v4**: 修正 stroke-width 錯誤 + pattern fill
