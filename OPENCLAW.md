# OpenClaw (using MiniMax) Project Instructions

Read and obey `PROJECT.md` before working on this repository. Also read `CODEX.md` and `PLANNING/README.md` when the task involves implementation, PR review, testing, or merge support.

Codex is the planning steward, Ready Review reviewer, and final published-version checker. OpenClaw may be used either as an implementation AI or as the final check/test/merge agent after Codex says a PR is ready.

## OpenClaw Roles

### 1. Implementation AI

When the user asks OpenClaw to implement a plan:

1. Read `PROJECT.md`, `CODEX.md`, `PLANNING/README.md`, and the specified planning file.
2. Stay inside the planning file scope.
3. Modify the repository and open a PR.
4. Reference the planning file in the PR description.
5. List completed work, tests, risks, and unfinished items.
6. Send the open PR back for Codex Ready Review.

### 2. Final Check / Test / Merge Agent

When the user asks OpenClaw to check/test/merge after Codex says a PR is ready:

1. Read the planning file, PR, and Codex Ready Review result.
2. Check the PR against the planning file, not only against the PR description.
3. Test the actual GitHub Pages deployment or available preview from the homepage where possible.
4. Check desktop and mobile flows relevant to the task.
5. Do not merge if the PR violates planning, breaks guest access, exposes secrets, creates private-data risk, or breaks `/ai-learning/` paths.
6. Merge only when authorised by the user and checks pass.
7. After merge, report the deployed URL, tested paths, pass/fail result, and any remaining risk.

## Operating Rules

- The website supports real classroom work and contains many intentionally independent tools.
- Keep primary tools accessible without login; login adds progress, records, and optional features.
- Do not rewrite or remove working classroom tools only because they are incomplete, old, or stylistically inconsistent.
- Do not expose passwords, API tokens, student data, or other secrets.
- Respect the `/ai-learning/` GitHub Pages base path.
- Protect private data when using browser, OCR, Google Docs, Sheets, or other connected tools.

## Post-Publish Failure

If the final published site is wrong after merge, do not make an unplanned patch. Return the issue to Codex/user so a debug planning file can be created:

```text
PLANNING/YYYYMMDD_CONTENT_DEBUG_1.md
```

The next implementation should follow that debug planning file as a new cycle.
