# Adding a site

1. **Scaffold** (from the repo root):
   ```bash
   cd apps && npx create-next-app@<catalog next version> <name> --ts --tailwind --app --eslint --src-dir \
     --react-compiler --empty --use-pnpm --skip-install --disable-git --no-agent-feedback --import-alias '@/*'
   ```
   Then align it with `apps/index`: copy `package.json` (rename to `@troules/<name>`, keep `catalog:` versions),
   `tsconfig.json`, `eslint.config.mjs`, `next.config.ts` (`withTroules()`), `vitest.config.mts`,
   `playwright.config.ts` (pick new ports), `.gitignore`. Delete the generated `pnpm-workspace.yaml` and `README.md`.
   Add `<Telemetry />` to the root layout. Write at least one e2e test with axe.
2. **Register** it in `packages/registry/src/index.ts` (status `soon` until it's live) and add a probe line to
   `scripts/uptime-probe.sh` and a URL to `lighthouserc.json` + a server in `scripts/lighthouse.sh`.
3. `pnpm install && pnpm check && pnpm build && pnpm e2e`, `pnpm changeset`, open a PR.
4. **Vercel** (owner): Add New › Project › import `Troules/troules-sites` › Root Directory `apps/<name>` ›
   Framework Next.js. Settings › Build and Deployment › Root Directory: keep _Include files outside the root directory_
   **Enabled** and turn _Skip deployments_ **Enabled**; leave _Ignored Build Step_ on **Automatic** (Vercel deprecated
   `turbo-ignore` in favour of Skip deployments).
   Enable Web Analytics and Speed Insights in the project.
5. **Domain**: Vercel › Project › Domains › add `<name>.troules.dynv6.net`; create the CNAME it shows in the dynv6 zone.
6. Set the registry status to `live`, PR, merge. Write an ADR if the site brings a new kind of decision.
