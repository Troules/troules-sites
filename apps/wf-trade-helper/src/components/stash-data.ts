"use client";

import { useEffect, useState } from "react";
import type { IndexEntry } from "@/lib/search";
import type { PriceIndex } from "@/lib/stash";

/**
 * What the stash needs beyond the list itself: prices (/prices.json) and item names and icons (/search-index.json,
 * the file the ⌘K palette uses). Both are static files; they are fetched once per visit, and only by readers who
 * have a stash or open the stash page.
 */
export type StashData = { prices: PriceIndex; items: IndexEntry[]; bySlug: Map<string, IndexEntry> };

let inflight: Promise<StashData> | null = null;

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as T;
}

function load(): Promise<StashData> {
  inflight ??= Promise.all([json<PriceIndex>("/prices.json"), json<IndexEntry[]>("/search-index.json")])
    .then(([prices, items]) => ({ prices, items, bySlug: new Map(items.map((i) => [i[0], i])) }))
    .catch((e: unknown) => {
      inflight = null; // let the next attempt retry
      throw e;
    });
  return inflight;
}

export function useStashData(enabled: boolean): { data: StashData | null; failed: boolean; retry: () => void } {
  const [data, setData] = useState<StashData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    load().then(
      (d) => live && (setData(d), setFailed(false)),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [enabled, attempt]);
  return { data, failed, retry: () => setAttempt((n) => n + 1) };
}
