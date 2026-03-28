# 動態功課管理系統 (Dynamic Homework System)

## 系統架構

### 資料流
1. **資料源**: Google Sheets (發布為CSV)
2. **自動化**: n8n (OCR + 寫入)
3. **前端**: index.html (fetch CSV + 渲染)

### CSV 格式
| Date | Subject | Detail | Deadline |
|------|---------|--------|----------|
| 2026-03-17 | 數學 | 練習13C | 21/3 |
| 2026-03-17 | 中文 | 作文 | 25/3 |

## 前端重構要點
- fetchHomeworkData() - 獲取CSV
- parseCSV() - 解析數據
- 保留視覺設計：星期日紅、星期六藍、上一週灰色