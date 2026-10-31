# blog-article-creator changelog

Bump `version` in SKILL.md with each change (patch = wording, minor = new step/rule, major = new flow).

## 0.2.0 (2026-11-01)

From PR #7 (first real article):
- Citations: inline links only. The article used `[1]` markers (plain text on the page) and a duplicate "Sources:"
  block, a habit from the `grounded-citations` skill; this skill now overrides it. CI enforces both.
- New step 6, "If a check fails": tell article failures (content tests, Content guard) from failures outside the
  article (PR #7 was blocked by a TypeScript 7 bug in main, not by the article); for the latter, report and wait.

## 0.1.0 (2026-10-31)

- First version: pitch → write → self-check → PR → preview → explicit publish via `merge_pull_request` with
  `expectedHeadSha`. Markdown + Mermaid + SVG; CI-aligned checklist.
