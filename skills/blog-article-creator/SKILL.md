---
name: blog-article-creator
description: "Turn research or a YouTube video discussed in this conversation into a blog article for blog.troules.dynv6.net, open a pull request, send the owner the preview link, and publish only when they say so. Use when the owner asks to write, draft, blog, publish, or turn something into an article."
version: 0.2.0
author: Troules
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Writing, Blog, Publishing, GitHub, Research, YouTube]
    category: writing
    related_skills: [grounded-citations, youtube-content]
---

# Blog article creator

Turns what we researched or watched together into an article on **https://blog.troules.dynv6.net**, and publishes it
through a pull request the owner approves from Telegram. The repo is `Troules/troules-sites` (public), articles live
in `apps/blog/content/<slug>/index.md`, and CI checks every article before it can be merged.

Read the references when you reach that step, not before:

- `references/article-format.md`: front matter, Markdown features, images, diagrams (**read before writing**).
- `references/style-guide.md`: voice, structure, length.
- `references/publishing.md`: the exact GitHub tool calls (**read before publishing**).

## Steps

1. **Pitch (one short message, then wait).** From the conversation, propose:
   title, one-sentence angle, `kind` (`research` | `video-summary` | `note`), 3–6 section outline, 1–6 tags,
   language (the conversation's language unless told otherwise), and the sources you'll cite. Ask "OK?".
   Don't write the article until the owner agrees or adjusts.
2. **Gather.** Use only material you actually read: pages you fetched, the transcript (`youtube_transcript`), the
   owner's own words. Every factual claim from outside traces to a `sources` entry. If you lack a source for a
   claim, cut the claim or say it's unverified.
   **Citation format for this blog overrides other skills (e.g. `grounded-citations`):** cite by linking the claim
   inline, `[Exo's README](https://github.com/exoharness/exo)`. Never write `[1]`-style markers (they render as plain
   text) and never add a "Sources" list to the body: the blog renders `sources` from the front matter under the article.
3. **Write** following `article-format.md` and `style-guide.md`. Add a Mermaid diagram when a process, timeline or
   relationship is easier seen than read; at most two per article.
4. **Self-check** with the checklist below. Fix everything before publishing; CI will reject the rest.
5. **Open the pull request** (`publishing.md` › Open). Then wait for checks and the Vercel preview.
6. **If a check fails**, read which one (`get_check_runs`) and its error before touching anything:
   - `Lint, types, tests, build` failing in **content tests** (`content.test.ts`, the message names your file) or
     `Content guard`: your article is at fault. Fix it on the same branch and wait again.
   - Anything else (type errors, build or e2e errors in `apps/*/src`, Lighthouse, toolchain): **not your article**.
     Don't edit code and don't retry. Tell the owner: "CI fails outside the article: <check>, <first error line>".
     Wait for the owner; they will fix main and ask you to continue.
   - Never suggest merging with a red check; the ruleset refuses it anyway.
7. **Send the owner, in one message:** the preview link to the article, the PR link, CI status, word count,
   and "Reply **publish**, tell me what to change, or **drop**."
8. **Iterate** on feedback by committing to the same branch; send the new preview link each time.
9. **Publish only on an explicit "publish"** (or equivalent: "go", "ship it", "publie") in this conversation, for
   this PR, after the owner saw the latest preview. Merge with `expectedHeadSha` = the commit they previewed.
   Then send the production URL `https://blog.troules.dynv6.net/<slug>` (live about a minute after the merge).
10. **Drop** = close the PR (don't delete anything else).

## Self-check (mirrors CI)

- [ ] Front matter: every string in double quotes; `date` is today (Europe/Paris) as `YYYY-MM-DD`;
      `description` 20–200 chars; tags lowercase-kebab, 1–6; `sources` https only; `video` set for `video-summary`.
- [ ] Slug = folder name: lowercase kebab-case ASCII, short (≤ 6 words), no date in it.
- [ ] No `#` heading in the body (the title is the h1); headings go `##` then `###` without skipping.
- [ ] No raw HTML (it's stripped), no MDX/JSX, no remote images. Images are `./file.svg` in the same folder, with alt text.
- [ ] SVGs: no `<script>`, `<foreignObject>`, `on*=` attributes, `javascript:`, or external `href`.
- [ ] Mermaid fences use simple node ids and quote labels with special characters: `A["Label: with colon"]`.
- [ ] Every outside fact has a source; links are https.
- [ ] Citations are inline links; every `sources` URL appears as a link in the text (CI checks this for `research`).
- [ ] No `[1]`-style markers, no "Sources"/"References" section in the body (CI rejects both).

## Never

- Change anything outside `apps/blog/content/<slug>/`. CI fails such PRs, and it's not your job.
- Edit or delete existing articles unless the owner asks for that article by name (same PR flow, branch `hermes/edit-<slug>`).
- Merge without the explicit go-ahead above, merge a PR whose checks failed, or merge a different commit than the owner previewed.
- Put secrets, tokens, private conversation details, or personal data about third parties in an article.
