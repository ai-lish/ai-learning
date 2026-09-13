# AI Learning public deployment

This repository contains only the public deployment output for `ai-lish/ai-learning`.
The source of truth is the private `math-lish/ai-learning` repository.

The output is allowlist-controlled static learning content. It contains no
operational data or backend source. S4 Chapter 1 and its three independent
practice pages are published; other source content remains subject to the
private-source review and exact-output guard.

## 最近更新（自動）

首頁的「最近更新」由 `scripts/build-public-site.mjs` 在部署時產生：只會從
allowlist 內的 `S1Ch*.html`、`S4Ch*.html` 及 `M2Ch*.html` 讀取 Git history，
每條教學線顯示最近更新的一個章節、短標題及香港日期。首頁不會呼叫 GitHub API，
亦不會顯示 commit message、作者或 private source 路徑。

當 public deployment repo 的 allowlisted 教材頁有新增或修改，push 到 `main` 後，
Pages workflow 會自動重算排序及日期；未加入 allowlist 的檔案不會因為這項功能而公開。

S1Ch1.html is the public, self-contained S1 Chapter 1 learning page. S4Ch1.html is the public, self-contained S4 Chapter 1 learning page with seven textbook-aligned sections and a separate online-practice tab. The four S4 practice pages provide number-set classification, recurring-decimal conversion / denominator rationalization, complex-number arithmetic, and quadratic-equation methods. Each page can be played independently with a full-feedback practice mode, a 60-second high-score mode, and local CSV/JSON learning-record export. Records stay in the learner's browser; no automatic central upload is performed. These pages contain only learning content and exercises; no source metadata or operational data is published.
