# troules-sites: instructions for coding agents

Monorepo for every Troules mini-site ("site factory"). Public repo; deployed by Vercel (Hobby, free tier).
Architecture and the reasons behind it: `docs/architecture.md` and `docs/adr/`. Read the relevant ADR before
changing a decision, and write a new ADR when you change one.

## Map

| Path                                                   | What                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `apps/index`                                           | `troules.dynv6.net`: list of sites, liquid glass over the Cassiopeia A image                            |
| `apps/blog`                                            | `blog.troules.dynv6.net`: Markdown articles in `apps/blog/content/<slug>/`                              |
| `packages/ui`                                          | Shared React: `Glass`/`GlassFilter` (liquid glass), `Telemetry` (Vercel Analytics + Speed Insights)     |
| `packages/registry`                                    | The list of sites the index shows. **Add a site here when you add an app**                              |
| `packages/next-config`                                 | `withTroules()`: security headers, React Compiler, Cache Components, workspace transpiling              |
| `packages/eslint-config`, `packages/typescript-config` | Shared lint and TS presets (`next`, `library`)                                                          |
| `skills/blog-article-creator`                          | Hermes skill that writes and publishes articles from Telegram                                           |
| `.claude/skills`                                       | Agent skills for this repo, installed with `npx skills add … -a claude-code` (lock: `skills-lock.json`) |

## Next.js 16 is not the Next.js you know

Each app has an `AGENTS.md` written by Next: read `apps/<app>/node_modules/next/dist/docs/` before writing Next code.
Cache Components + Partial Prefetching are on (`withTroules`). Static by default: async data goes through
`"use cache"` functions; request data (`cookies()`, `headers()`) only inside `<Suspense>`. `proxy.ts` replaces middleware.

## Commands (pnpm only, from the repo root)

```bash
pnpm install                 # also installs git hooks (lefthook)
pnpm dev                     # all apps; or: pnpm --filter @troules/blog dev
pnpm check                   # lint + typecheck + unit tests + prettier: run before every commit
pnpm build && pnpm e2e       # production builds + Playwright e2e/axe (needs `playwright install chromium` once)
pnpm lighthouse              # Lighthouse budgets on production builds (perf ≥ 90, a11y ≥ 95, BP ≥ 90, SEO ≥ 90)
pnpm changeset               # describe a code change (required by CI for apps/ and packages/ changes)
```

## Rules

- **Dependencies**: shared versions live in the `catalog:` of `pnpm-workspace.yaml`; reference them with `"catalog:"`.
  pnpm refuses versions younger than 7 days (`minimumReleaseAge`); don't lower it to get a fresh release.
- **Definition of done**: `pnpm check` and `pnpm build` pass, e2e pass for the apps you touched, a changeset exists,
  docs/ADR updated if behaviour or architecture changed.
- **Commits and PR titles**: Conventional Commits (`feat(blog): …`, `fix(ui): …`, `chore: …`). Enforced by commitlint
  and CI. `main` only changes through PRs with green CI (ruleset, no bypass except the release bot).
- **Branches**: `hermes/*` is reserved for Hermes and may only touch `apps/blog/content/` (CI `Content guard`).
- **Secrets**: none in this repo, ever. Runtime config goes in Vercel env vars. The pre-commit hook blocks common token shapes.
- **Articles are untrusted input**: plain Markdown rendered without raw HTML or MDX. Don't add `rehype-raw`, MDX, or
  `allowDangerousHtml`; keep `safeHref` and the local-only image rule (ADR 0003).
- **Accessibility**: e2e runs axe (WCAG 2.1 AA). Respect `prefers-reduced-motion` and `prefers-reduced-transparency`.
- **Free tier**: no paid services. Check `docs/architecture.md` › Limits before adding anything that runs per request.

## Adding a site

Follow `docs/new-site.md`.
