"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type Tab = { id: string; label: string; panel: ReactNode };

/**
 * WAI-ARIA tabs (automatic activation). Panels are rendered on the server and only hidden here, so switching is
 * instant, needs no request, and the default panel is in the static HTML.
 */
export function Tabs({ label, tabs, className }: { label: string; tabs: Tab[]; className?: string }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setActive(tabs[next]!.id);
    refs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="border-line bg-bg inline-flex w-fit max-w-full flex-wrap gap-1 rounded-[10px] border p-[3px]"
      >
        {tabs.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`min-h-9 cursor-pointer rounded-[7px] px-3 text-[13px] font-medium ${
                selected ? "bg-chip text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={t.id !== active}
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
