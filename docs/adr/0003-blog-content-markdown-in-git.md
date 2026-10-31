# 0003. Blog articles are Markdown files in git, rendered without code execution

- Status: accepted
- Date: 2026-10-31

## Context

Articles are written by Hermes (an LLM agent that reads web pages and transcripts, so it can be prompt-injected) and
must support images, SVG and Mermaid diagrams. Options considered:

| Option                       | Verdict                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| Supabase table + Storage     | Skips CI, needs revalidation; the free project pauses after 7 idle days                        |
| Headless CMS                 | Another account and API key; content outside review                                            |
| **MDX in git**               | Reviewable, but MDX is code: `import`/`export`/`{expressions}` run at build time with env vars |
| **Markdown in git** (chosen) | Reviewable, versioned, free; no code execution                                                 |

## Decision

- `apps/blog/content/<slug>/index.md` + assets in the same folder. Front matter validated by a strict zod schema
  (`src/lib/schema.ts`); unknown keys rejected.
- Pipeline: remark-parse → GFM → GitHub alerts → remark-rehype (**raw HTML dropped**) → Mermaid fences become a
  `<mermaid-diagram>` element → local images only (`./file.ext`, rewritten to `/content/<slug>/…`) → slugged,
  self-linked headings → Shiki (dual theme) → React via `hast-util-to-jsx-runtime` with a fixed component map.
  Links pass `safeHref` (http, https, mailto, `/`, `#` only).
- Mermaid renders client-side, lazily imported, `securityLevel: "strict"`; source shown without JS.
- SVGs are served as `<img>` (scripts inside never run) and CI rejects `<script>`, `<foreignObject>`, `on*=`,
  `javascript:` and external hrefs anyway.
- `content.test.ts` validates every article (schema, files, sizes, alt text, heading order, Mermaid parse). A build
  step copies assets to `public/content/` and writes the slug/tag list for `proxy.ts`.
- Drafts (`draft: true`) render on preview deployments only.

## Consequences

- Publishing = a commit; nothing to back up beyond git.
- Hermes can only produce text files via the GitHub API, so its images are SVG. Photos/screenshots need another
  path (future: Telegram photo → owner commits, or a Hermes upload tool).
- Mermaid costs JS on pages that use it (loaded on demand). Revisit build-time SVG rendering if it becomes heavy.
