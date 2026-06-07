# Gemini Project Instructions

`PROJECT.md` is the authoritative system prompt for this repository. Read it in full before performing any analysis or implementation.

Also read `CODEX.md` and `PLANNING/README.md`. Implementation work should normally follow a specific planning file in `PLANNING/`.

Gemini may be used as an implementation AI in this project. When used this way, Gemini should modify the repository according to the planning file and open a PR for Codex/user review.

Operating rules:

- Preserve the project's classroom-driven, independent-tool structure.
- Primary learning content must remain usable without login.
- Login only adds progress recording and additional features.
- Improve navigation, identity, learning records, security, and coordination incrementally.
- Do not rewrite working classroom tools without a task-specific reason.
- Never place secrets, write tokens, teacher passwords, or student private data in public frontend code.
- Respect the `/ai-learning/` GitHub Pages base path.

Required PR workflow:

1. Read `PROJECT.md`, `CODEX.md`, `PLANNING/README.md`, and the specified planning file.
2. Implement only the scope described in the planning file.
3. Open a PR that references the planning file.
4. In the PR description, list completed work, tests, risks, and unfinished items.
5. Leave Ready Review judgement to Codex and the user.
6. If the work is a post-publish correction, follow the specified `PLANNING/YYYYMMDD_CONTENT_DEBUG_1.md` file.
