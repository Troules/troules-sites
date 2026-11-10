/**
 * "My stash": the items a player owns and wants to sell, kept in their browser only (localStorage, no account, no
 * request). Pure functions here; components/stash-store.ts owns the storage. Prices come from the static
 * /prices.json, one compact tuple per (item, rank, subtype).
 */
export type StashEntry = { slug: string; rank: number | null; subtype: string | null; qty: number };

/** [rank, subtype, 7-day median, trades per day, 7-day trend %, 90-day position 0–1], max rank first. */
export type PriceVariant = [number | null, string | null, number, number, number | null, number | null];
export type PriceIndex = Record<string, PriceVariant[]>;

export const STASH_KEY = "wf-stash-v1";
export const MAX_QTY = 9999;
/** A stash is a shortlist, not an inventory mirror; the cap also bounds what a corrupted value can make us render. */
export const MAX_ENTRIES = 200;

export const entryKey = (e: Pick<StashEntry, "slug" | "rank" | "subtype">) => `${e.slug}|${e.rank}|${e.subtype}`;

const clampQty = (n: unknown) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(n)) || 1));

/** Reads whatever is in storage defensively: another tab, an old version or the user may have written anything. */
export function parseStash(raw: string | null | undefined): StashEntry[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  const out: StashEntry[] = [];
  for (const e of data as Partial<StashEntry>[]) {
    if (!e || typeof e.slug !== "string" || !/^[a-z0-9_]{1,80}$/.test(e.slug)) continue;
    const entry: StashEntry = {
      slug: e.slug,
      rank: typeof e.rank === "number" && Number.isInteger(e.rank) ? e.rank : null,
      subtype: typeof e.subtype === "string" ? e.subtype.slice(0, 40) : null,
      qty: clampQty(e.qty),
    };
    const k = entryKey(entry);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(entry);
    if (out.length === MAX_ENTRIES) break;
  }
  return out;
}

/** Adds `qty` copies; an entry that is already there grows instead of appearing twice. */
export function addEntry(list: StashEntry[], e: Omit<StashEntry, "qty">, qty = 1): StashEntry[] {
  const k = entryKey(e);
  if (list.some((x) => entryKey(x) === k))
    return list.map((x) => (entryKey(x) === k ? { ...x, qty: clampQty(x.qty + qty) } : x));
  if (list.length >= MAX_ENTRIES) return list;
  return [...list, { slug: e.slug, rank: e.rank, subtype: e.subtype, qty: clampQty(qty) }];
}

export function setQty(list: StashEntry[], key: string, qty: number): StashEntry[] {
  return list.map((x) => (entryKey(x) === key ? { ...x, qty: clampQty(qty) } : x));
}

export function removeEntry(list: StashEntry[], key: string): StashEntry[] {
  return list.filter((x) => entryKey(x) !== key);
}

/** Switches an entry to another rank or subtype, merging into an entry that already holds that variant. */
export function setVariant(list: StashEntry[], key: string, rank: number | null, subtype: string | null): StashEntry[] {
  const from = list.find((x) => entryKey(x) === key);
  if (!from) return list;
  const to = { slug: from.slug, rank, subtype };
  if (entryKey(to) === key) return list;
  if (list.some((x) => entryKey(x) === entryKey(to))) return addEntry(removeEntry(list, key), to, from.qty);
  return list.map((x) => (entryKey(x) === key ? { ...x, rank, subtype } : x));
}

export function priceOf(index: PriceIndex, e: Pick<StashEntry, "slug" | "rank" | "subtype">): PriceVariant | null {
  return index[e.slug]?.find((v) => v[0] === e.rank && v[1] === e.subtype) ?? null;
}

export type Call = "sell" | "hold" | "falling" | "fair" | "thin" | "none";

/** Order in which the stash is read: what to list today first. */
export const CALLS: Record<Call, { label: string; order: number }> = {
  sell: { label: "Sell now", order: 0 },
  falling: { label: "Falling", order: 1 },
  fair: { label: "Fair price", order: 2 },
  hold: { label: "Hold", order: 3 },
  thin: { label: "Thin market", order: 4 },
  none: { label: "No trades", order: 5 },
};

/** A week this much down is a slide, not a wobble. */
export const FALLING_TREND = -10;

/**
 * What to do with one stash line, from the same signals the lists show: sell near the top of the 90-day range,
 * hold near the bottom, and say so plainly when the market is too thin for the median to mean much.
 */
export function call(v: PriceVariant | null): { call: Call; why: string } {
  if (!v) return { call: "none", why: "Nobody completed a trade for it in the last 7 days." };
  const [, , , vol, trend, pos] = v;
  if (vol < 1) return { call: "thin", why: "Under one trade a day: expect to wait for a buyer at this price." };
  if (pos != null && pos >= 0.8)
    return { call: "sell", why: `Higher than on ${Math.round(pos * 100)}% of the last 90 days.` };
  if (pos != null && pos <= 0.2)
    return { call: "hold", why: `Cheaper than on ${Math.round((1 - pos) * 100)}% of the last 90 days.` };
  if (trend != null && trend <= FALLING_TREND)
    return {
      call: "falling",
      why: `Down ${Math.abs(trend).toFixed(0)}% on the month before: sell before it slides further.`,
    };
  return { call: "fair", why: "Mid-range for the last 90 days." };
}

export type StashLine = StashEntry & {
  key: string;
  variant: PriceVariant | null;
  value: number;
  call: Call;
  why: string;
};

export function stashLines(list: StashEntry[], index: PriceIndex): StashLine[] {
  return list.map((e) => {
    const variant = priceOf(index, e);
    return { ...e, key: entryKey(e), variant, value: variant ? variant[2] * e.qty : 0, ...call(variant) };
  });
}

/** What to list first: by call, then the most plat. */
export function byPriority(lines: StashLine[]): StashLine[] {
  return [...lines].sort((a, b) => CALLS[a.call].order - CALLS[b.call].order || b.value - a.value);
}

export type ChatItem = { name: string; rank: number | null; subtype: string | null; price: number | null };

/** Trade chat links an item when its exact name is in square brackets. */
export function chatItem(i: ChatItem): string {
  const parts = [`[${i.name}]`];
  if (i.rank != null) parts.push(`R${i.rank}`);
  if (i.subtype) parts.push(i.subtype);
  if (i.price != null) parts.push(`${Math.max(1, Math.round(i.price))}p`);
  return parts.join(" ");
}

/** Messages short enough to read in a scrolling chat; each one starts with WTS or WTB. */
export const CHAT_CHUNK = 180;

export function chatMessages(mode: "WTS" | "WTB", items: ChatItem[], limit = CHAT_CHUNK): string[] {
  const out: string[] = [];
  let line = mode;
  for (const item of items.map(chatItem)) {
    if (line !== mode && line.length + 1 + item.length > limit) {
      out.push(line);
      line = mode;
    }
    line += ` ${item}`;
  }
  if (line !== mode) out.push(line);
  return out;
}
