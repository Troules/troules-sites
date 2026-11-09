# @troules/wf-trade-helper

## 0.2.0

### Minor Changes

- Live market data: a daily sweep of every item on the Troules VM loads warframe.market history into Supabase (schema `wf`), then triggers a rebuild that downloads the snapshot once, so the site stays static (ADR 0009, phase 2). Item pages linked from the home page are prerendered; the rest render on first visit. Ayatan sculptures are split by socketed stars instead of mixing two prices.

## 0.1.0

### Minor Changes

- New site wf-trade-helper: a Warframe market dashboard with a top 10 by plat traded per day (max rank only), ⌘K item search, item pages with 90-day history and a sell helper, all running on a committed sample from warframe.market until the daily sweep lands (ADR 0009). The registry lists it as coming soon.
- The top list goes to 100: the first 10 rows are server-rendered and the rest load as you scroll, from static per-sort JSON (`/top/<sort>`). It never scrolls sideways: columns drop out as its container narrows.
- Selling signals from price history: a "Near 90d high" tab with each item's 90-day position and volatility, arcane rank-up profit, and "when to sell" profiles by UTC hour and weekday that compare the Europe, Americas and Asia & Oceania evenings, for the whole market and per item.
- The sweep drops fake trades (days priced 5x away from the item's usual median), which had put a 99,999p wash trade at the top of the plat/day list; the price list only ranks items with at least one trade a day.
- `pnpm fixtures:full` sweeps every item into the git-ignored `.data/full/` for `next dev`; only the ~45-item sample is committed.

### Patch Changes

- Updated dependencies []:
  - @troules/registry@0.3.0
