# AI-Learning 功能更新計劃

## 📋 任務總覽

### 目標
1. 漢堡包摺疊功能 (中一至中六、考試專區)
2. 統一標題欄設計
3. 全頁面審視與更新

---

## 📊 工作量評估

| 項目 | 數量 | 難度 |
|------|------|------|
| 首頁修改 | 1 | 中 |
| 課題分頁 | 8 | 低 |
| 遊戲頁面 | 35 | 高 |
| 考試頁面 | 3 | 中 |
| 審視評估 | - | 低 |

---

## 📝 書記工作 (記錄與分析)

### 1. 現有頁面審視
```
├── index.html              → 需要漢堡包 + 標題欄
├── S1Ch1.html             → 需要標題欄
├── S1Ch2.html             → 需要標題欄
├── ...
├── S1Ch10.html            → 需要標題欄
├── games/*.html (35個)    → 需審視
├── exam-*.html (3個)      → 需審視
└── stories.html           → 需審視
```

### 2. 記錄清單
| 頁面 | 需要漢堡包 | 需要標題欄 | 遊戲影響 |
|------|-----------|-----------|---------|
| index.html | ✅ | ❌ | - |
| S1Ch*.html | ❌ | ✅ | - |
| games/*.html | ❌ | 待定 | 待定 |
| exam-*.html | ❌ | 待定 | - |

### 3. 輸出
- 完整頁面清單 with 狀態
- 優先處理順序

---

## 💻 師弟工作 (開發)

### Phase 1: 首頁 (index.html)

#### 1.1 漢堡包菜單
```html
<!-- 漢堡包按鈕 -->
<div class="hamburger" onclick="toggleMenu()">
    <span></span><span></span><span></span>
</div>

<!-- 摺疊菜單 -->
<div id="menu" class="menu">
    <button>中一</button>
    <button>中二</button>
    <button>中三</button>
    <button>中四</button>
    <button>中五</button>
    <button>中六</button>
    <hr>
    <button>考試專區</button>
</div>

<style>
.hamburger { cursor: pointer; }
.menu { display: none; }
.menu.open { display: block; }
</style>

<script>
function toggleMenu() {
    document.getElementById('menu').classList.toggle('open');
}
</script>
```

### Phase 2: 標題欄設計

#### 2.1 統一標題欄結構
```html
<header class="title-bar">
    <div class="left">
        <span class="hamburger" onclick="toggleMenu()">☰</span>
    </div>
    <div class="center">
        <h1>標題</h1>
    </div>
    <div class="right">
        <a href="index.html" class="back-btn">← 返回</a>
    </div>
</header>

<style>
.title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background: #3498DB;
    color: white;
}
.title-bar .center { flex: 1; text-align: center; }
.title-bar .back-btn { color: white; text-decoration: none; }
</style>
```

#### 2.2 首頁 (index.html)
- 有漢堡包，無返回按鈕
- 標題：少康老師教學網站

#### 2.3 課題分頁 (S1Ch*.html)
- 有漢堡包 + 標題 + 返回按鈕
- 標題：Ch1 基礎運算

#### 2.4 遊戲頁面 (games/*.html)
- 標題欄置於遊戲內容之上
- 不影響遊戲體驗

### Phase 3: 實作順序

| 順序 | 頁面 | 任務 |
|------|------|------|
| 1 | index.html | 漢堡包菜單 |
| 2 | S1Ch1.html | 標題欄示範 |
| 3 | S1Ch2-10 | 複製修改 |
| 4 | games/*.html | 標題欄 + 測試 |
| 5 | exam-*.html | 標題欄 |

---

## 🧪 T仔工作 (測試)

### 測試清單

#### Phase 1: 首頁測試
| # | 項目 | 方法 |
|---|------|------|
| 1.1 | 漢堡包按鈕存在 | grep |
| 1.2 | 漢堡包Click顯示菜單 | browser click |
| 1.3 | 中一至中六按鈕存在 | snapshot |
| 1.4 | 考試專區按鈕存在 | snapshot |
| 1.5 | Click課題進入正確頁面 | browser click |

#### Phase 2: 課題分頁測試
| # | 項目 | 方法 |
|---|------|------|
| 2.1 | 標題欄存在 | snapshot |
| 2.2 | 漢堡包功能正常 | browser click |
| 2.3 | 標題正確顯示 | snapshot |
| 2.4 | 返回按鈕Link正確 | grep 'href="index.html"' |
| 2.5 | 返回功能正常 | browser click |

#### Phase 3: 遊戲頁面測試
| # | 項目 | 方法 |
|---|------|------|
| 3.1 | 標題欄存在 | snapshot |
| 3.2 | 標題正確顯示 | snapshot |
| 3.3 | 返回按鈕Link正確 | grep |
| 3.4 | 返回功能正常 | browser click |
| 3.5 | 遊戲運作正常 | 功能測試 |

#### Phase 4: 考試頁面測試
| # | 項目 | 方法 |
|---|------|------|
| 4.1 | 標題欄存在 | snapshot |
| 4.2 | Tab功能正常 | browser click |

### 測試命令

```bash
# Link檢查
grep 'href="index.html"' S1Ch*.html
grep 'href="index.html"' exam-*.html
grep 'href="../S1Ch' games/*.html

# 功能測試
browser action=open url="..."
browser action=act kind=click ref=eX
browser action=snapshot
```

---

## ⏱️ 工作時間表

### Day 1
| 時間 | 任務 |
|------|------|
| 書記 | 現有頁面審視與記錄 |
| 師弟 | 首頁漢堡包功能 |
| T仔 | 首頁測試 |

### Day 2
| 時間 | 任務 |
|------|------|
| 師弟 | S1Ch1 標題欄 |
| 師弟 | S1Ch2-10 複製修改 |
| T仔 | 課題分頁測試 |

### Day 3
| 時間 | 任務 |
|------|------|
| 師弟 | 遊戲頁面修改 |
| T仔 | 遊戲頁面測試 |

### Day 4
| 時間 | 任務 |
|------|------|
| 師弟 | 考試頁面修改 |
| T仔 | 考試頁面測試 |

### Day 5
| 時間 | 任務 |
|------|------|
| T仔 | 全面回歸測試 |
| 書記 | 總結報告 |

---

## ✅ 完成標準

- [ ] 首頁有漢堡包菜單
- [ ] 所有課題分頁有標題欄
- [ ] 所有遊戲有標題欄 (不影響遊戲)
- [ ] 所有考試頁面有標題欄
- [ ] 全部功能測試通過

---

*計劃建立：2026-03-11*
