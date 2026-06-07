# GitHub Copilot Agent Instructions

Before analysing, editing, reviewing, or testing this repository, read and follow [`PROJECT.md`](../PROJECT.md) as the authoritative project system prompt.

Also read [`CODEX.md`](../CODEX.md) and [`PLANNING/README.md`](../PLANNING/README.md). Most implementation work should be driven by a specific planning file named `PLANNING/YYYYMMDD_CONTENT_V1.md`.

Codex is the default planning owner and Ready to Review gatekeeper for this repository. GitHub Copilot Agent should implement the specified planning file and open a PR for Codex/user review.

Key requirements:

- Preserve guest access to all primary learning tools.
- Treat login as an optional enhancement for progress and extra features.
- Improve integration incrementally; do not rewrite working classroom tools without a task-specific reason.
- Never expose passwords, write tokens, or other secrets in public frontend code.
- Respect the GitHub Pages `/ai-learning/` base path.
- If a planning file is provided, only implement the scope described there.
- PR descriptions must reference the planning file and list completed work, tests, risks, and unfinished items.
- After implementation, open a PR and clearly mark what should be checked by Codex during Ready to Review.
- If testing finds a problem, repeat analysis and implementation until it passes or a genuine external blocker is identified.
