# GitHub Copilot Agent Instructions

Before analysing, editing, reviewing, or testing this repository, read and follow [`PROJECT.md`](../PROJECT.md) as the authoritative project system prompt.

Also read [`CODEX.md`](../CODEX.md) and [`PLANNING/README.md`](../PLANNING/README.md). Most implementation work should be driven by a specific planning file named `PLANNING/YYYYMMDD_CONTENT_V1.md` or, for post-publish fixes, `PLANNING/YYYYMMDD_CONTENT_DEBUG_1.md`.

Codex is the planning steward and Ready Review reviewer for this repository. GitHub Copilot Agent is one possible implementation AI. The user may also use OpenClaw, Gemini, or another AI for implementation.

Key requirements:

- Preserve guest access to all primary learning tools.
- Treat login as an optional enhancement for progress and extra features.
- Improve integration incrementally; do not rewrite working classroom tools without a task-specific reason.
- Never expose passwords, write tokens, or other secrets in public frontend code.
- Respect the GitHub Pages `/ai-learning/` base path.
- If a planning file is provided, only implement the scope described there.
- PR descriptions must reference the planning file and list completed work, tests, risks, and unfinished items.
- After implementation, open a PR for Codex/user Ready Review.
- If the task follows a debug planning file, clearly reference the original planning file or PR that caused the post-publish correction.
