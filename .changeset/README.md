# Changesets: every code PR is a release

1. `pnpm changeset`: pick the packages and the bump (patch = fix, minor = feature, major = breaking/redesign), write
   one line for the changelog.
2. `pnpm version-packages`: applies it (bumps each `package.json`, writes `CHANGELOG.md`, deletes the changeset).
3. Commit both. CI (`Changeset` job) fails a PR that changes code in `apps/` or `packages/` without a bump.

Articles (`apps/blog/content/`) and tests don't need one. After the merge, the Release workflow tags new versions.
