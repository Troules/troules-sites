"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStash } from "./stash-store";

/**
 * Page switcher in the header. Links + aria-current, not ARIA tabs: each option is its own page. Item pages belong
 * to the market. On a phone the row scrolls sideways under the search field instead of wrapping.
 */
const PAGES = [
  { href: "/", label: "Market", sr: "" },
  { href: "/stash", label: "Stash", sr: "" },
  { href: "/sets", label: "Sets", sr: " or parts" },
  { href: "/ducats", label: "Ducats", sr: " per plat" },
  { href: "/vosfor", label: "Vosfor", sr: " calculator" },
] as const;

const isCurrent = (href: string, path: string) =>
  href === "/" ? path === "/" || path.startsWith("/items") : path.startsWith(href);

export function SiteNav() {
  const pathname = usePathname();
  const stash = useStash();
  return (
    <nav aria-label="Pages" className="min-w-0">
      <ul className="flex [scrollbar-width:none] gap-0.5 overflow-x-auto">
        {PAGES.map((page) => {
          const current = isCurrent(page.href, pathname);
          return (
            <li key={page.href} className="shrink-0">
              <Link
                href={page.href}
                aria-current={current ? "page" : undefined}
                className={`relative flex h-9 items-center gap-1.5 rounded-[7px] px-2.5 text-[15px] font-medium [font-stretch:80%] transition-colors ${
                  current ? "text-ink bg-chip" : "text-muted hover:text-ink"
                }`}
              >
                {page.label}
                {page.sr ? <span className="sr-only">{page.sr}</span> : null}
                {page.href === "/stash" && stash?.length ? (
                  <span className="num bg-accent text-bg rounded-full px-1.5 text-[11px] leading-[18px] font-semibold">
                    {stash.length}
                    <span className="sr-only"> items</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
