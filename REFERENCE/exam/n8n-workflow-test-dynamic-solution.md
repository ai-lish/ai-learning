# N8n 測試流程

## 測試原則

### ✅ 做啲咩
- HTTP 200 check
- File exists check
- Basic structure check

### ❌ 唔好做
- 唔好 click interaction test
- 唔好 check MathJax render output
- 唔好 modify 任何野

---

## 測試清單

| # | 項目 | Command |
|---|------|---------|
| 1 | HTTP 200 | `curl -s -o /dev/null -w "%{http_code}" URL` |
| 2 | Has Canvas | `grep -c "mathCanvas" file.html` |
| 3 | Has Render | `grep -c "window.onload" file.html` |

---

## Example Test Script

```bash
#!/bin/bash
URL="https://ai-lish.github.io/ai-learning/exam/2025-26-s5-term2/p2/q2-a.html"

# Test HTTP
status=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
echo "HTTP: $status"

if [ "$status" = "200" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi
```
