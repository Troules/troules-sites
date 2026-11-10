# 0010. Auto-merge low-risk Dependabot updates

- Status: accepted
- Date: 2026-11-10

## Context

Dependabot PRs (weekly, grouped, ADR 0005) sat open until merged by hand: #19 and #20 were green for a day with
nobody looking. Single maintainer, 0 required approvals, so a human merge adds a click, not a review.

What already protects `main` before any merge: the ruleset's required checks (lint, types, unit tests incl. every
article, build, e2e + axe, Lighthouse), no bypass actors, a 7-day Dependabot cooldown plus pnpm's 7-day
`minimumReleaseAge` (most hijacked releases are pulled within that window), lockfile frozen in CI, and an
install-script allow-list. #21 (shiki 4.6.0) shows the gate works: its tests failed, so it would not have merged.

Risks of merging unattended: `main` deploys to production straight away (Vercel), so a runtime regression that CI
doesn't catch goes live; Next/React minors change behaviour more than tooling patches.

## Decision

`.github/workflows/dependabot-automerge.yml` runs on Dependabot PRs and, using `dependabot/fetch-metadata` (which also
checks the commits are Dependabot's), runs `gh pr merge --auto --squash` when the PR's **highest** update is:

- a patch, any dependency; or
- a minor, except the `next-react` group or anything named `next`/`react`.

Majors and Next/React minors stay manual. GitHub auto-merge only queues the merge: it happens when every required
check passes. `Dependency review` (moderate+ advisories, GPL/AGPL) becomes a **required** check so it gates
auto-merged PRs too. The repo setting "Allow auto-merge" is on. `shiki` joins the `content` group so it moves with
`@shikijs/*`.

## Consequences

- Green patch/minor bumps land within one CI run; red ones stay open as before.
- The merge is made with `GITHUB_TOKEN`, so it doesn't trigger `push` workflows (CI on main, `release.yml`). Fine:
  Dependabot PRs don't bump versions (the `Changeset` job skips them), so there is nothing to tag, and Vercel deploys
  via its own app. The PR's own CI already ran on the merge result.
- Dependency bumps still don't appear in app CHANGELOGs (unchanged from ADR 0005).
- Revisit if an auto-merged update breaks production: narrow the rule (patch only) or add a post-deploy smoke check.
