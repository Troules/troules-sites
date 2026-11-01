# 0001. One public monorepo (pnpm + Turborepo) for every site

- Status: accepted
- Date: 2026-10-31

## Context

More mini-sites will come. They share lint/TS/test config, UI pieces, CI, and the agent harness. Options were one repo
per site plus a shared "kit" repo (published config packages, reusable workflows) or a monorepo. On GitHub Free,
branch rulesets and CodeQL only work on **public** repos; Actions minutes are unlimited for public repos.

## Decision

- One repo `Troules/troules-sites`, **public**, pnpm workspaces + Turborepo: `apps/*` (one per site), `packages/*` (shared).
- Each app is its own Vercel project (Root Directory = `apps/<name>`), so sites deploy and fail independently.
- Shared versions through pnpm **catalogs**; shared config through `@troules/*` workspace packages (no publishing).

## Consequences

- A shared change (lint rule, header, component) lands everywhere in one PR and is tested against every site.
- Vercel builds only affected apps (Root Directory › _Skip deployments_, which follows the pnpm workspace graph;
  amended 2026-11-02, replacing the deprecated `turbo-ignore` Ignored Build Step).
- Everything in the repo is public: no secrets, no private notes. Articles are public anyway.
- Revisit if a site needs private code (then: separate private repo consuming the public packages).
