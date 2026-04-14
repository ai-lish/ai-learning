---
title: "Admin Status — AI-Learning"
layout: admin
---

# Admin / Operational Status (DRAFT)

Last updated: 2026-04-12

## Critical items
- Canonical DSE P2 page JSON filename: `p2_latex_ocr_results.json` (canonicalized 2026-04-12)
- OCR JSON issues: `s3-term3-p2.json` (missing 15 items), `s5-term3-p2.json` (missing 2 items)
- MiniMax quota: monitor `MiniMax-M2.7` rolling window and `music-2.6` weekly usage

## P0 / P1 items (from topic-active-issues.md)
- P0 items resolved on 2026-04-12: TO_DELETE (preschool), Song of Songs audio provided, Google Sheets OAuth reauthorized, S1 Term3 PDF location provided.
- Current P1s: Virtual Office README + gist commit pending, n8n workflow rebuild pending, exam mimic system refactor pending.

## Operations
- DSE P2 full test runner: run_year.sh (per-year jobs) — checkpoints every 5 questions, progress snapshots every 50 questions.
- Progress file: `~/ai-learning/logs/p2_test_progress.json`
- Alerting: `~/ai-learning/scripts/check_p2_progress.sh` (cron checks for stale progress)

## How to trigger
- Manual: `~/ai-learning/scripts/run_year.sh <year> [--dry-run]`
- Recommended flow: dry-run → preflight → run (nohup) → review year-summary → trigger next year

## Contact
- Zach (owner) — approve pushes and public reports
- Hermes — coordination and reporting
- MacD (this agent) — runner orchestration, monitoring

_DRAFT: Review and publish to admin area after verification._
