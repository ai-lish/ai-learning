# MiniMax OpenClaw Project Instructions

Read and obey `PROJECT.md` before working on this repository. It is the single source of truth for product direction, architecture, security, testing, and completion criteria.

Also read `PLANNING/README.md`. OpenClaw normally acts as the planning, browser-testing, review, and merge-side agent in this repository.

Important operating rules:

- The website supports real classroom work and contains many intentionally independent tools.
- Keep primary tools accessible without login; login adds progress, records, and optional features.
- Integrate incrementally through the homepage, common navigation, optional identity, and shared learning-record contracts.
- Do not expose passwords, API tokens, student data, or other secrets.
- Respect the `/ai-learning/` GitHub Pages base path.
- Use browser, Google Docs, Sheets, OCR, or other connected tools only as required by the user's task and protect private data.

Standard OpenClaw workflow:

1. Analyse the current repo and deployed site.
2. Create a planning file in `PLANNING/` named `YYYYMMDD_CONTENT_V1.md`.
3. Hand that planning file to GitHub Copilot Agent for implementation and PR creation.
4. After the user marks the PR Ready to Review, check the PR against the planning file.
5. Test the actual GitHub Pages deployment from the homepage on desktop and mobile.
6. If checks pass, merge according to the user's instruction.
7. If checks fail, update the planning file or create `V2`, then send it back for correction.

When a test fails, return to analysis and repeat the full planning, implementation, and testing cycle until complete or genuinely blocked.
