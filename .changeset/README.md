# Changesets

Every PR that changes code in `apps/` or `packages/` adds one: `pnpm changeset`, pick the packages and the bump
(patch = fix, minor = feature, major = breaking/redesign), write one line for the changelog. CI enforces it.
Articles (`apps/blog/content/`) don't need one. On merge, the Release workflow opens a "Version packages" PR that
bumps each `package.json` version and writes its `CHANGELOG.md`.
