# AI Learning public deployment

This repository contains only the public deployment output for `ai-lish/ai-learning`.
The UI source of truth is the private `math-lish/ai-learning` repository. S4 Chapter 1
question templates and question content are maintained in the `ai-lish/Assessments`
repository and published here only as a generated, static question bundle.

The output is allowlist-controlled static learning content. It contains no
operational data or backend source. S4 Chapter 1 and its four independent
practice pages are published; other source content remains subject to the
private-source review and exact-output guard.

S1Ch1.html is the public, self-contained S1 Chapter 1 learning page. S4Ch1.html is the public, self-contained S4 Chapter 1 learning page with seven textbook-aligned sections and a separate online-practice tab. The four S4 practice pages provide number-set classification, recurring-decimal conversion / denominator rationalization, complex-number arithmetic, and quadratic-equation methods. Each page can be played independently with a full-feedback practice mode, a 60-second high-score mode, and local CSV/JSON learning-record export. Records stay in the learner's browser; no automatic central upload is performed. S4 Ch1 loads its generated question bundle and UI adapter from the same public deployment directory; it does not fetch the assessment repository at runtime. These pages contain only learning content and exercises; no source metadata or operational data is published.
