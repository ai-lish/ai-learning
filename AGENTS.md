# Codex Project Instructions

This repository uses `PROJECT.md` and `CODEX.md` as the authoritative Codex project instructions.

Before doing any planning, review, implementation, or testing in this repository, Codex must read:

1. `PROJECT.md` - product direction, safety rules, testing matrix, path rules, and completion definition.
2. `CODEX.md` - Codex's role as planning steward, Ready Review reviewer, and final published-version checker.
3. `PLANNING/README.md` - planning-file naming, templates, multi-agent workflow, and debug-planning rules.
4. Any task-specific planning file in `PLANNING/`.

## Codex Role Summary

Codex should normally act as:

- Planning owner.
- Ready Review reviewer for open PRs sent back by the user.
- Final published-version checker after OpenClaw check/test/merge.
- Debug planning owner when the published GitHub Pages version is wrong.

Implementation may be done by Copilot, OpenClaw, Gemini, or another AI agent. Codex must review their PRs against the planning file, not only against the PR description.

## Core Rules

- Keep primary student tools usable without login.
- Treat login as optional enhancement for progress, records, sync, and extra features.
- Protect existing classroom tools, including independent or partial tools that are still useful.
- Do not expose passwords, tokens, student data, or write secrets in public frontend code.
- Respect the `/ai-learning/` GitHub Pages base path.
- Use `PLANNING/YYYYMMDD_CONTENT_V1.md` for normal planning.
- Use `PLANNING/YYYYMMDD_CONTENT_DEBUG_1.md` for post-publish failures that are materially wrong.
- For small issues that do not need debug planning, provide concise correction prompts for the user to paste into another AI.

## Ready Review Output

When reviewing a PR, Codex should clearly state one of:

- `Ready for OpenClaw check/test/merge`
- `Not ready`

If not ready, provide focused correction instructions that the user can paste into the implementation AI.

## Completion

A task is complete only when the planning file, PR implementation, Ready Review result, OpenClaw check/test/merge result, published GitHub Pages behaviour, and classroom requirement agree with each other.
