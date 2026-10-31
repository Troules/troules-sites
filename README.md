# troules-sites

The Troules mini-site factory: a pnpm + Turborepo monorepo of Next.js 16 sites on Vercel.

| Site  | URL                            | App          |
| ----- | ------------------------------ | ------------ |
| Index | https://troules.dynv6.net      | `apps/index` |
| Blog  | https://blog.troules.dynv6.net | `apps/blog`  |

```bash
corepack enable && pnpm install
pnpm dev        # http://localhost:3000 (index), :3001 (blog) — or --filter one app
pnpm check      # lint, types, unit tests, formatting
```

- How it's built and why: [`docs/architecture.md`](docs/architecture.md), decisions in [`docs/adr/`](docs/adr/).
- Adding a site: [`docs/new-site.md`](docs/new-site.md).
- How articles get published from Telegram: [`docs/publishing.md`](docs/publishing.md).
- Instructions for coding agents: [`AGENTS.md`](AGENTS.md).

Background image of the index: Cassiopeia A (Webb NIRCam), credit NASA, ESA, CSA, STScI, D. Milisavljevic (Purdue
University), T. Temim (Princeton University), I. De Looze (University of Gent), CC BY 4.0.
Code: MIT.
