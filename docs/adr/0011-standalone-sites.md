# 0011. Standalone sites: same monorepo, own vercel.app domain, not in the index

- Status: accepted
- Date: 2026-11-13

## Context

Some sites are personal one-offs that don't belong to the Troules constellation: the first one is
`papy-eydoux` (a family photo timeline). They should still get the repo's tooling (CI, e2e + axe, Lighthouse,
security headers, Dependabot) without a second repo to maintain. ADR 0007 puts every site under
`troules.dynv6.net` and the registry lists every site on the index.

## Decision

- A standalone site is a normal app in `apps/<name>`, built with `withTroules()` and the shared presets.
- It is **not** added to `packages/registry` (so the index doesn't show it) and gets **no** dynv6 record: it is served
  on its Vercel project's `<name>.vercel.app` domain. This is the one exception to ADR 0007.
- Images that never change are resized once at import (`sharp`, committed WebP) and served with `unoptimized`, so a
  photo-heavy site costs nothing from the Hobby plan's 5k image transformations/month.
- Sites about real people set `robots: noindex` and are excluded from the Lighthouse SEO budget (`assertMatrix`
  in `lighthouserc.json`), since "blocked from indexing" is intended there.

## Consequences

The repo is public, so a standalone site's content (photos included) is public in git history for good: only put
content there that the owner is fine publishing. Moving a standalone site under the dynv6 zone later is ADR 0007's
usual CNAME + Vercel domain, plus a registry entry.
