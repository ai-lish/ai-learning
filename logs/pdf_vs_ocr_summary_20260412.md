# PDF vs OCR Verification Summary — HKDSE P2 (2026-04-12)

## Overview

- **Questions with OCR text:** 193 / 495
- **Sampled:** 20 (stratified: early/mid/late, seed=20260412)
- **Processed:** 20
- **Failures:** 19
- **Passes:** 1
- **Pass rate:** 5.0%

## Method

- **OCR source:** Minimax VLM (minimax-vlm) stored in `p2_final_results.json`
- **Verification:** Tesseract 5.5.2 on same image
- **Scoring:** 40% plain-text token overlap + 60% LaTeX math overlap
- **Threshold:** ≥ 0.35 = pass (adjusted for LaTeX vs plain text mismatch)

## ⚠️ Critical Methodology Note

**Tesseract 5.5.2 is fundamentally unsuited for Chinese mathematics content.** This verification reveals:

- Tesseract produces garbled, near-random character output on Chinese math images
- Minimax VLM produces clean, structured LaTeX text
- The low match scores (19/20 failures) reflect this **modality mismatch**, not VLM inaccuracy
- The one "pass" (2012Q11) has near-zero math content, so both extractors returned empty math → math_overlap=1.0 (false positive)

**This verification is NOT a reliable quality assessment of Minimax VLM.**

## Recommendations

1. Use human review to verify a sample of VLM outputs
2. For automated verification, use a Chinese-capable OCR (e.g., PaddleOCR, RapidOCR) as reference
3. The VLM output appears **significantly better** than Tesseract on this content

## Failures

- `2012Q21` (index 1): low_match
- `2012Q06` (index 2): low_match
- `2013Q06` (index 3): low_match
- `2012Q18` (index 4): low_match
- `2012Q42` (index 5): low_match
- `2012Q32` (index 7): low_match
- `2013Q39` (index 8): low_match
- `2014Q06` (index 9): low_match
- `2014Q15` (index 10): low_match
- `2014Q04` (index 11): low_match
- `2013Q33` (index 12): low_match
- `2014Q23` (index 13): low_match
- `2014Q17` (index 14): low_match
- `2022Q01` (index 15): low_match
- `2021Q43` (index 16): low_match
- `2022Q25` (index 17): low_match
- `2022Q40` (index 18): low_match
- `2014Q34` (index 19): low_match
- `2022Q32` (index 20): low_match
## Score Distribution

- Min: 0.0050, Max: 0.7333, Avg: 0.1360

## All Samples

| # | QID | Stratum | Plain | Math | **Score** | Pass | Notes |

|---|-----|---------|-------|------|-----------|------|-------|

| 1 | `2012Q21` | early | 0.013 | 0.000 | **0.005** | ❌ | Tesseract vs Minimax VLM; image=2012Q21.jpg |
| 2 | `2012Q06` | early | 0.350 | 0.000 | **0.140** | ❌ | Tesseract vs Minimax VLM; image=2012Q06.jpg |
| 3 | `2013Q06` | early | 0.300 | 0.000 | **0.120** | ❌ | Tesseract vs Minimax VLM; image=2013Q06.jpg |
| 4 | `2012Q18` | early | 0.101 | 0.000 | **0.040** | ❌ | Tesseract vs Minimax VLM; image=2012Q18.jpg |
| 5 | `2012Q42` | early | 0.150 | 0.000 | **0.060** | ❌ | Tesseract vs Minimax VLM; image=2012Q42.jpg |
| 6 | `2012Q11` | early | 0.333 | 1.000 | **0.733** | ✅ | Tesseract vs Minimax VLM; image=2012Q11.jpg |
| 7 | `2012Q32` | early | 0.308 | 0.000 | **0.123** | ❌ | Tesseract vs Minimax VLM; image=2012Q32.jpg |
| 8 | `2013Q39` | mid | 0.205 | 0.000 | **0.082** | ❌ | Tesseract vs Minimax VLM; image=2013Q39.jpg |
| 9 | `2014Q06` | mid | 0.429 | 0.000 | **0.171** | ❌ | Tesseract vs Minimax VLM; image=2014Q06.jpg |
| 10 | `2014Q15` | mid | 0.099 | 0.000 | **0.040** | ❌ | Tesseract vs Minimax VLM; image=2014Q15.jpg |
| 11 | `2014Q04` | mid | 0.161 | 0.000 | **0.065** | ❌ | Tesseract vs Minimax VLM; image=2014Q04.jpg |
| 12 | `2013Q33` | mid | 0.269 | 0.000 | **0.108** | ❌ | Tesseract vs Minimax VLM; image=2013Q33.jpg |
| 13 | `2014Q23` | mid | 0.550 | 0.000 | **0.220** | ❌ | Tesseract vs Minimax VLM; image=2014Q23.jpg |
| 14 | `2014Q17` | mid | 0.061 | 0.000 | **0.024** | ❌ | Tesseract vs Minimax VLM; image=2014Q17.jpg |
| 15 | `2022Q01` | late | 0.417 | 0.000 | **0.167** | ❌ | Tesseract vs Minimax VLM; image=2022Q01.jpg |
| 16 | `2021Q43` | late | 0.273 | 0.000 | **0.109** | ❌ | Tesseract vs Minimax VLM; image=2021Q43.jpg |
| 17 | `2022Q25` | late | 0.458 | 0.000 | **0.183** | ❌ | Tesseract vs Minimax VLM; image=2022Q25.jpg |
| 18 | `2022Q40` | late | 0.106 | 0.000 | **0.043** | ❌ | Tesseract vs Minimax VLM; image=2022Q40.jpg |
| 19 | `2014Q34` | late | 0.450 | 0.000 | **0.180** | ❌ | Tesseract vs Minimax VLM; image=2014Q34.jpg |
| 20 | `2022Q32` | late | 0.267 | 0.000 | **0.107** | ❌ | Tesseract vs Minimax VLM; image=2022Q32.jpg |