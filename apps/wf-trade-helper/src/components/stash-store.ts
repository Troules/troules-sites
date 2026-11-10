"use client";

import { useSyncExternalStore } from "react";
import { parseStash, STASH_KEY, type StashEntry } from "@/lib/stash";

/**
 * The stash lives in localStorage and nowhere else. useSyncExternalStore keeps every component on the page (the
 * header count, an item's "Add to stash" button, the stash page) and every open tab on the same list. If storage is
 * blocked (private mode, strict settings), the stash still works for the visit from memory.
 */
const EVENT = "wf-stash-change";
let memory: string | null = null;
let storageFailed = false;
let cache: { raw: string | null; list: StashEntry[] } = { raw: null, list: [] };

function raw(): string | null {
  if (storageFailed) return memory;
  try {
    return localStorage.getItem(STASH_KEY);
  } catch {
    return memory;
  }
}

function snapshot(): StashEntry[] {
  const now = raw();
  // Same string, same array: useSyncExternalStore re-renders whenever the snapshot's identity changes.
  if (now !== cache.raw) cache = { raw: now, list: parseStash(now) };
  return cache.list;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** The stash, or null until the browser has read it (server render and hydration), so nothing flashes "empty". */
export function useStash(): StashEntry[] | null {
  return useSyncExternalStore<StashEntry[] | null>(subscribe, snapshot, () => null);
}

export function updateStash(change: (list: StashEntry[]) => StashEntry[]): void {
  const next = JSON.stringify(change(snapshot()));
  memory = next;
  try {
    localStorage.setItem(STASH_KEY, next);
  } catch {
    // Storage blocked or full: `memory` keeps the stash for this visit.
    storageFailed = true;
  }
  window.dispatchEvent(new Event(EVENT));
}
