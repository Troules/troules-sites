"use client";

import Link from "next/link";
import { addEntry, entryKey, removeEntry, setQty } from "@/lib/stash";
import { updateStash, useStash } from "./stash-store";

/** Adds one (item, rank, subtype) to the stash from its page; once it is in, the button becomes a quantity stepper. */
export function StashButton({ slug, rank, subtype }: { slug: string; rank: number | null; subtype: string | null }) {
  const stash = useStash();
  const key = entryKey({ slug, rank, subtype });
  const mine = stash?.find((e) => entryKey(e) === key);

  if (!mine)
    return (
      <button
        type="button"
        // Until the browser has read the stash we can't know whether a click should add or bump.
        disabled={stash === null}
        onClick={() => updateStash((list) => addEntry(list, { slug, rank, subtype }))}
        className="btn w-full"
      >
        <Plus /> Add to my stash
      </button>
    );

  return (
    <div className="flex items-center gap-2">
      <div className="border-line-strong flex items-center rounded-[7px] border">
        <button
          type="button"
          aria-label={mine.qty === 1 ? "Remove from my stash" : "One fewer in my stash"}
          onClick={() =>
            updateStash((list) => (mine.qty === 1 ? removeEntry(list, key) : setQty(list, key, mine.qty - 1)))
          }
          className="hover:bg-chip grid size-10 cursor-pointer place-items-center rounded-l-[6px] text-lg"
        >
          −
        </button>
        <span className="num min-w-9 text-center" aria-live="polite">
          {mine.qty}
          <span className="sr-only"> in my stash</span>
        </span>
        <button
          type="button"
          aria-label="One more in my stash"
          onClick={() => updateStash((list) => setQty(list, key, mine.qty + 1))}
          className="hover:bg-chip grid size-10 cursor-pointer place-items-center rounded-r-[6px] text-lg"
        >
          +
        </button>
      </div>
      <Link href="/stash" className="link text-[13px]">
        In my stash
      </Link>
    </div>
  );
}

function Plus() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
