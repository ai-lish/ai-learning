# PDF vs OCR Verification Summary — HKDSE P2 (MiniMax Vision) — 2026-04-12 13:42

## Overview

- **Total questions:** 495
- **Processed:** 495
- **Pass (match_score ≥ 0.8):** 0
- **Fail (match_score < 0.8):** 495
- **Errors:** 0
- **Pass rate:** 0.0% (of processed)

## Method

- **OCR source:** Minimax VLM stored in `p2_final_results.json`
- **Verification:** MiniMax Vision (second independent pass) on original images
- **Scoring:** match_score 0..1 (1 = perfect match)
- **Threshold:** ≥ 0.8 = pass

## Mismatch Type Breakdown

| Type | Count |
|------|-------|
| error | 495 |

## Notes

- Verification done with MiniMax Vision for visual comparison
- Each question image compared against stored OCR text
- Score < 0.8 flagged for potential issues
