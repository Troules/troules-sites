# 0009. Market data for wf-trade-helper

- Status: accepted (phase 1: sample data; phase 2 waits for Supabase, troules-infra Phase 4)
- Date: 2026-11-03

## Context

`wf-trade-helper` ranks Warframe items by how much platinum they trade per day, so its first data is about the
market as a whole, not a single page. Facts checked on 2026-11-03:

- Price history exists only in the **deprecated v1** API: `GET /v1/items/{slug}/statistics`, which covers 90 days of daily
  completed-trade buckets per rank and subtype. v2 has no statistics endpoint (404), and the docs give no shutdown date.
- `GET /v2/items` lists 3,893 items. `GET /v2/orders/item/{slug}/top` gives ≤5 online buyers and ≤5 online sellers.
- API rules (`42bytes-team/wfm-docs` › rules): **3 requests/s**, a descriptive User-Agent, cache aggressively, and
  don't mirror the site. Cloudflare answers 429 for too many requests and 509 for too many concurrent connections.
- A full sweep is 3,893 requests: about 28 min and 0.5 GB of downloads at 2.3 req/s. That is too long for a Vercel
  function. It was tested from the Hermes VM: all 200s.
- Third-party sign-in isn't possible: OAuth is "not publicly available yet", and `/auth/signin` is first-party only.

## Decision

1. **Sweep on the VM, not on Vercel.** `apps/wf-trade-helper/sweeper/wfm_sweep.py` uses the Python standard library
   only (the VM has no Node). It holds one keep-alive connection, sends requests one at a time 0.35 s apart, and backs
   off on 429/509/5xx (honouring `Retry-After`). It computes a summary per **(item, rank, subtype)**: mixing ranks is
   meaningless (an arcane sells for ~7p at rank 0 and ~120p at rank 5).
2. **Phase 1, now: committed sample data.** `pnpm --filter @troules/wf-trade-helper fixtures` writes the following into
   `src/fixtures/`:
   - `catalog.json` and `slugs.json`: the full item list;
   - `market.json`: summaries, 90-day history, 48-hour hourly buckets and `/top` books for about 45 items, with
     player names and ids removed.

   The site, CI, e2e and Lighthouse all run on this sample, with no network and no secrets. **Only the sample is
   committed**: `pnpm fixtures:full` writes every item (about 15 MB, an hour of polite requests) to the git-ignored
   `.data/full/`, and `WF_DATA_DIR=.data/full` in `.env.development.local` makes `next dev` read it. Builds (CI,
   e2e, Vercel) never see it, so their numbers stay reproducible.

3. **Phase 2, after Supabase: a daily sweep of all items into schema `wf`** (RLS on, anon may only `SELECT`). A
   systemd timer on the VM, defined in troules-infra, writes with the secret key. The site reads with the publishable
   key from Vercel env vars, inside the same `lib/market.ts` functions (`"use cache"`, `cacheLife("hours")`), and the
   live `/top` books get a minutes-long cache.
4. **The catalog is a snapshot.** `proxy.ts` 404s item slugs that aren't in `slugs.json`, the same way the blog handles
   unknown articles (ADR 0002). New game items appear after the next fixture refresh and deploy.
5. **Product rules:** lists show each item at its **max rank** only (owner's choice), with PC + crossplay prices in
   English. The sell helper suggests 1p under the cheapest online seller of the same rank and subtype. If a buyer
   already pays that much, it suggests selling to them; with no seller, it shows the 7-day median. Posting orders waits
   for warframe.market OAuth.
6. **Item icons** come straight from `warframe.market/static/assets/` as plain `<img>` tags, not through `next/image`,
   so they don't count against the 5k image transformations/month.

7. **Signals are computed from the stored history, not fetched** (`lib/signals.ts`, pure functions): the 7-day
   median's percentile among the last 90 daily medians (ties count half, so flat prices sit mid-range), volatility
   (coefficient of variation of the daily medians), arcane rank-up profit (21 rank-0 copies for rank 5, 10 for rank
   3, at 7-day medians, liquid markets only), and price profiles by weekday (each day vs the 7 days centred on it,
   so a trend does not leak in) and by UTC hour (v1 `statistics_closed.48hours`).
8. **Fake trades are dropped at sweep time.** Players "sell" items to friends at 99,999p (or 1p) to move platinum;
   one such day became Vay Hek Frequency Triangulator's 7-day median (98,103p vs ~5,500p normally). A day or hour
   whose median is more than 5x above or below the variant's 90-day median of daily medians is dropped before
   summaries are computed. `wfm_sweep.py clean DIR` re-applies the rule to stored data without any request.
9. **Regions are inferred, not measured.** Completed trades carry no location, and an order's `locale` is a
   language, not a continent. The "when to sell" panels compare evening windows in UTC (Europe 17–23, Americas
   01–07, Asia & Oceania 09–15, northern winter time) and say so on the page.

## Consequences

- The repo stays secret-free in phase 1. Phase 2 adds the first runtime env vars (Vercel) and a VM secret file, which
  counts as a security-control change: the owner confirms before it lands.
- If v1 statistics disappear, the fallback is a daily snapshot of `/v2/orders/item/{slug}/top` (asking prices, not
  sales); the history then has to grow from that day.
- Supabase Free is 500 MB. About 1.8M daily rows a year has to be measured after the first sweep; if it gets close,
  roll rows older than a year into monthly ones.
- Item pages for unlisted slugs are App Shells, upgraded to cached pages after the first visit. That uses proxy and
  function invocations, which is fine for a personal tool at Hobby scale (1M a month).
- v1 only returns the last 48 hours of hourly buckets, so each sweep sees every hour twice. The Supabase sweep should
  keep hourly rows (a few weeks are enough) so hour-of-day profiles firm up over time.
- Revisit when warframe.market publishes v2 statistics or opens OAuth.
