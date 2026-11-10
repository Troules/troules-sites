# @troules/wf-trade-helper

## 0.4.0

### Minor Changes

- A bigger, more useful WF Trade Helper:
  
  - **My stash** (`/stash`): list what you want to sell, kept in your browser only. It shows what the lot is worth at this week's medians, which lines sit near their 90-day high ("Sell now") or low ("Hold"), and writes the trade-chat message (`WTS [Arcane Energize] R5 121p …`). Item pages get an "Add to my stash" button and a ready-made WTS line; the header shows how many lines you hold.
  - **Set or parts** (`/sets`, and a panel on every set and part page): each set's price against the sum of its parts, counting parts needed twice.
  - **Ducats for Baro** (`/ducats`): prime parts by ducats per plat, the parts worth too much to trade in, and a shopping list with a WTB message for the ducats you need.
  - **Top 100 by item type**: filter any sort to arcanes, mods, sets, parts, relics or other, so the lists are no longer all arcanes.
  - **Price history you can read**: hover, touch or use the arrow keys to get each day's median, range and trades; the 7-day median is drawn as a reference line.
  - **Movers this week**, a market-mood bar (rising / steady / falling), and "when to sell" windows shown in your own time zone.
  - New look: Saira in two widths (condensed for headings and every number), a darker Void palette, one row of navigation that scrolls on phones, and no table wider than a 320px screen.
  - Sweeper: `pnpm catalog` refreshes the item list with ducat values and every set's parts (`src/fixtures/sets.json`); the sample now includes the parts of seven sets.

## 0.3.1

### Patch Changes

- Tidy the header: a flat single-row bar instead of a framed glass panel, plain status text with a "Sample" badge in place of two pills, a Dashboard | Vosfor page switcher that marks the current page, and a compact search field on mobile. The data date moves into the footer too, so small screens still show it.

## 0.3.0

### Minor Changes

- Add the Vosfor calculator (`/vosfor`): ranks Loid's nine Arcane Collections by expected plat per pack, sell-all or sell-or-dissolve, with per-arcane drop odds, packs needed for a 90% chance, and a seeded simulation of your Vosfor.

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
