# 0002. Next.js 16 on Vercel Hobby, static-first

- Status: accepted
- Date: 2026-10-31

## Context

The owner asked for React on Vercel. Sites are content sites: the index never changes per request, the blog changes
only when an article is merged. Vercel Hobby is free for non-commercial use with per-request quotas.

## Decision

- Next.js 16 App Router, TypeScript strict (+ `noUncheckedIndexedAccess`), Tailwind CSS 4, React Compiler on.
- Cache Components + Partial Prefetching on (the Next 16 default direction). Everything prerenders at build:
  file reads happen in `"use cache"` functions with `cacheLife("max")`.
- Shared `withTroules()` config adds security headers (nosniff, DENY framing, referrer policy, permissions policy,
  HSTS, a CSP limited to framing/base/form/object directives).
- Vercel Git integration: push to `main` deploys production; every PR gets a preview deployment.

## Consequences

- No servers to run, almost no function invocations, fast pages (Lighthouse ≥ 96 on every category locally).
- A script-src CSP would need per-request nonces (dynamic rendering); not worth it for static sites without user input.
  Revisit if a site gets forms, auth, or third-party scripts.
- Next 16 differs from most training data: agents must read `node_modules/next/dist/docs/` (see AGENTS.md).
- Soft-404 caveat: with PPR a page streams 200 before `notFound()` runs; dynamic routes answer unknown params in
  `proxy.ts` instead (see the blog).
