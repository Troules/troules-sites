"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Glass } from "@troules/ui/glass";
import { search, type IndexEntry } from "@/lib/search";
import { ItemIcon } from "./item-icon";

/**
 * ⌘K / Ctrl+K item search. The full index (~3,900 names) is fetched once, on first open, from the static
 * /search-index.json, then searched in the browser: no request per keystroke, nothing on page load.
 */
export function SearchPalette({ catalogSize }: { catalogSize: number }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const hits = index ? search(index, query) : [];

  const open = () => {
    dialog.current?.showModal();
    input.current?.select();
    if (!index)
      fetch("/search-index.json")
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((data: IndexEntry[]) => setIndex(data))
        .catch(() => setFailed(true));
  };
  const close = () => dialog.current?.close();
  const go = (slug: string) => {
    close();
    router.push(`/items/${slug}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (hits.length) setActive((a) => (a + (e.key === "ArrowDown" ? 1 : hits.length - 1)) % hits.length);
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active].entry[0]);
    }
  };

  const status = failed
    ? "Search is unavailable right now. Try again later."
    : !index
      ? "Loading the item list…"
      : !query.trim()
        ? `Type to search ${catalogSize.toLocaleString("en-US")} items.`
        : hits.length
          ? `${hits.length} best matches`
          : `No item matches “${query.trim()}”.`;

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-keyshortcuts="Control+K Meta+K"
        className="border-line-strong text-muted hover:text-ink hover:border-muted/50 flex h-9 w-full max-w-[360px] min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border bg-white/[0.04] px-3 text-left text-sm transition-colors"
      >
        <SearchIcon />
        <span className="min-w-0 flex-1 truncate">
          Search <span className="max-sm:sr-only">{catalogSize.toLocaleString("en-US")} </span>items…
        </span>
        <kbd className="num border-line text-muted hidden rounded border px-1.5 text-[11px] leading-5 sm:block">⌘K</kbd>
      </button>

      <dialog
        ref={dialog}
        aria-label="Search items"
        onClose={() => setActive(0)}
        onClick={(e) => e.target === dialog.current && close()}
        className="m-0 mx-auto mt-[12vh] w-[calc(100%-32px)] max-w-[640px] overflow-visible bg-transparent p-0 text-inherit"
      >
        <Glass className="glass-dialog overflow-hidden">
          <div className="border-line flex items-center gap-2.5 border-b px-4 py-3.5">
            <SearchIcon />
            <input
              ref={input}
              type="search"
              role="combobox"
              aria-label="Item name"
              aria-expanded={hits.length > 0}
              aria-controls={listId}
              aria-activedescendant={hits[active] ? `${listId}-${active}` : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              placeholder="Type an item: arcane, primed, wisp…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKey}
              className="placeholder:text-muted min-h-8 flex-1 bg-transparent text-base outline-none"
            />
            <button
              type="button"
              onClick={close}
              className="num border-line-strong text-muted min-h-8 cursor-pointer rounded-md border px-2 text-xs"
            >
              Esc
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            <p role="status" className="text-muted mx-2.5 my-1.5 text-xs">
              {status}
            </p>
            <ul id={listId} role="listbox" aria-label="Matching items" className="m-0 list-none p-0">
              {hits.map((h, i) => {
                const [slug, name, thumb, kind] = h.entry;
                return (
                  <li
                    key={slug}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onClick={() => go(slug)}
                    onMouseMove={() => setActive(i)}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-1.5 ${
                      i === active ? "bg-chip" : ""
                    }`}
                  >
                    <ItemIcon name={name} thumb={thumb} />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {name.slice(0, h.at)}
                      <mark className="rounded-sm bg-[rgb(143_211_255/0.18)] text-[#bfe6ff]">
                        {name.slice(h.at, h.at + h.len)}
                      </mark>
                      {name.slice(h.at + h.len)}
                    </span>
                    <span className="border-line-strong text-muted rounded-full border px-2 py-0.5 text-xs">
                      {kind}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="border-line text-muted flex flex-wrap gap-4 border-t px-4 py-2.5 text-xs">
            <span>
              <kbd className="num">↑ ↓</kbd> move
            </span>
            <span>
              <kbd className="num">Enter</kbd> open
            </span>
            <span>
              <kbd className="num">Esc</kbd> close
            </span>
          </div>
        </Glass>
      </dialog>
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}
