# 0005. Quality gates, release and supply chain

- Status: accepted
- Date: 2026-10-31

## Decision

**Local** (lefthook): pre-commit prettier + secret-shape scan; commit-msg commitlint (Conventional Commits);
pre-push lint + typecheck + unit tests (Turbo-cached).

**CI** (`.github/workflows/ci.yml`, every PR and push to main):

| Job                       | What                                                                                                                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint, types, tests, build | prettier check, ESLint (`--max-warnings 0`, Next core-web-vitals + TS + a11y), `tsc`, Vitest (incl. every article), `next build`, Playwright e2e on desktop + mobile with axe WCAG 2.1 AA, Lighthouse budgets (perf ≥ 90, a11y ≥ 95, best practices ≥ 90, SEO ≥ 90) |
| Content guard             | `hermes/*` branches only touch `apps/blog/content/`                                                                                                                                                                                                                 |
| Changeset                 | code changes in `apps/` or `packages/` need a changeset                                                                                                                                                                                                             |
| PR title                  | Conventional Commits (squash merges use it)                                                                                                                                                                                                                         |
| Dependency review         | blocks new deps with moderate+ advisories or GPL/AGPL licences                                                                                                                                                                                                      |

**Release**: every code PR is a release. The author runs `pnpm changeset` then `pnpm version-packages` (bumps each
`package.json`, writes `CHANGELOG.md`); the `Changeset` job fails code PRs without a bump. After the merge,
`release.yml` tags new versions (`@troules/<pkg>@x.y.z`). Vercel deploys on its own.
Why not the usual bot "Version packages" PR or a bot commit on main: PRs opened with `GITHUB_TOKEN` don't trigger CI
(required checks would never pass), and on a **personal-account** repo the GitHub Actions app can't be a ruleset
bypass actor (GitHub: "must be part of the ruleset source or owner organization"). The other bypasses would be a
deploy key (a new long-lived credential) or the admin role (which Hermes's token has). Bumping inside the PR needs none.

**Supply chain**: actions pinned to commit SHAs; `persist-credentials: false` where no push is needed; pnpm
`minimumReleaseAge` 7 days and an install-script allow-list; Dependabot weekly, grouped, 7-day cooldown; CodeQL
default setup (public repo); lockfile frozen in CI. Agent skills pinned by hash in `skills-lock.json`.
Known accepted risk: `web-design-guidelines` fetches its rules from vercel-labs' `main` at run time.

**Ruleset on main**: PR required (0 approvals: single maintainer), squash merge only, required checks `Lint, types,
tests, build`, `Content guard`, `Changeset`, `PR title (Conventional Commits)`; linear history; no force push or
deletion; **no bypass actors** (not even admins: Hermes's token belongs to the admin account).

## Consequences

- A PR takes ~4–6 min of CI. Turbo cache (actions/cache) keeps unchanged packages fast.
- Skipped conditional jobs count as passing for required checks.
