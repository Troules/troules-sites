# 0009. Market data for wf-trade-helper

- Status: accepted (phase 1: sample data, 2026-11-03; phase 2: daily Supabase sweep, 2026-11-09)
- Date: 2026-11-03, amended 2026-11-09

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

3. **Phase 2: a daily sweep of every item into Supabase schema `wf`** (`supabase/wf.sql`, RLS forced on every table).
   - **Write:** a systemd timer on the VM (troules-infra, ansible role `wf_sweep`, 01:30 UTC) runs
     `wfm_sweep.py sweep`: the full sweep, then one psql transaction as the login role **`wf_sweeper`**, which can only
     read and write rows in `wf` (no DDL, no other schema; scope tests in troules-infra). Not the Supabase secret key:
     that key bypasses RLS everywhere and never goes on the VM. `wf.daily` and `wf.hourly` keep every row ever seen
     (each sweep rewrites only the rows of its 90-day / 48-hour window that changed); `wf.snapshot` holds one
     `market` document, the same shape as `src/fixtures/market.json`.
   - **Read: once per deployment, not per request.** After the upload the sweep calls a Vercel deploy hook. The
     build's first step (`scripts/market-data.mjs`) downloads the snapshot with the publishable key (anon may only
     `SELECT` `wf.snapshot`, through the Data API) into the git-ignored `src/generated/market.json`, which
     `lib/market.ts` reads. Reading Supabase at runtime instead would cost ~15 MB per cache refresh, about 10 GB a month
     against the free 5 GB of egress; one build a day is ~0.5 GB. The app's turbo `build` is uncached, since its input
     changes without any file change. A Supabase error fails the build, so the last good deployment stays live.
   - **Prerendering:** only the item pages the home page links to (every top-100 list and the rank-ups, ~370 with the
     full catalog). All ~3,900 would add ~850 MB to each daily deployment; the others render on first visit.
   - Without the Supabase env vars (CI, e2e, Lighthouse, local) the same step copies the committed sample, or
     `WF_DATA_DIR`'s full local catalog for `next dev`.
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

- The repo stays secret-free. Phase 2 adds two Vercel build env vars (`WF_SUPABASE_URL`, `WF_SUPABASE_KEY`, the
  publishable key) and two root-only VM credential files (the `wf_sweeper` pgpass line and the deploy hook URL); the
  owner approved this design on 2026-11-09.
- Ayatan sculptures have one v1 bucket per socketed-star count; the sweeper turns those into subtypes (`no stars`,
  `2 cyan + 2 amber`), so they no longer mix two prices.
- If v1 statistics disappear, the fallback is a daily snapshot of `/v2/orders/item/{slug}/top` (asking prices, not
  sales); the history then has to grow from that day.
- Supabase Free is 500 MB. The first load was 281k daily and 58k hourly rows (85 MB with indexes and the snapshot);
  about 1.7M daily rows a year. Every sweep prints the database size; if it gets close, roll rows older than a year
  into monthly ones. Hourly rows are kept 60 days.
- Item pages for unlisted slugs are App Shells, upgraded to cached pages after the first visit. That uses proxy and
  function invocations, which is fine for a personal tool at Hobby scale (1M a month).
- v1 only returns the last 48 hours of hourly buckets, so each sweep sees every hour twice. `wf.hourly` keeps them
  (60 days), but the snapshot still carries 48 hours: widening the hour profiles to the stored weeks is a follow-up.
- Revisit when warframe.market publishes v2 statistics or opens OAuth.
