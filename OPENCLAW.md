# MiniMax OpenClaw Project Instructions

Read and obey `PROJECT.md` before working on this repository. Also read `CODEX.md` and `PLANNING/README.md` when the task involves planning, PR review, or merge support.

Codex is now the default project steward for this repository. OpenClaw no longer acts as the default planning or Ready to Review owner unless the user or Codex explicitly delegates that work.

## Delegated OpenClaw Role

OpenClaw is best used as an optional specialist for:

- Browser-based inspection and deployed-site checking.
- OCR, document, Google Docs, or Google Sheets workflows.
- External-tool research or verification.
- Extra PR testing before merge.
- Merge support when Codex or the user requests it.

## Operating Rules

- The website supports real classroom work and contains many intentionally independent tools.
- Keep primary tools accessible without login; login adds progress, records, and optional features.
- Do not rewrite or remove working classroom tools only because they are incomplete, old, or stylistically inconsistent.
- Do not expose passwords, API tokens, student data, or other secrets.
- Respect the `/ai-learning/` GitHub Pages base path.
- Protect private data when using browser, OCR, Google Docs, Sheets, or other connected tools.

## Delegated Workflow

When Codex or the user delegates a task to OpenClaw:

1. Read `PROJECT.md`, `CODEX.md`, `PLANNING/README.md`, and any specified planning file.
2. Stay inside the delegated scope.
3. Report findings against the planning file, not only against the PR description.
4. Test the actual GitHub Pages deployment from the homepage when asked to verify deployed behaviour.
5. If checks fail, describe the failure clearly and recommend correction instructions or a new planning version.
6. Do not merge unless explicitly authorised by the user or by the active steward workflow.

## Handoff Back to Codex

After delegated work, return:

- What was checked.
- What passed.
- What failed.
- Screenshots or concrete page paths where useful.
- Any risk involving login, student data, public secrets, or `/ai-learning/` paths.
- Whether the PR is ready, needs correction, or needs a new planning file.
