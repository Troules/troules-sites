"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Page switcher in the header, styled like the dashboard's tab lists so it reads as "which view am I in" rather than
 * a stray link. Item pages belong to the dashboard. Links + aria-current, not ARIA tabs: each option is its own page.
 */
const PAGES = [
  { href: "/", label: "Dashboard", srSuffix: "", match: (p: string) => !p.startsWith("/vosfor") },
  { href: "/vosfor", label: "Vosfor", srSuffix: " calculator", match: (p: string) => p.startsWith("/vosfor") },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Pages" className="shrink-0">
      <ul className="border-line bg-bg flex gap-0.5 rounded-[10px] border p-[3px]">
        {PAGES.map((page) => {
          const current = page.match(pathname);
          return (
            <li key={page.href}>
              <Link
                href={page.href}
                aria-current={current ? "page" : undefined}
                className={`flex h-7 items-center rounded-[7px] px-2.5 text-[13px] font-medium transition-colors ${
                  current ? "bg-chip text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {page.label}
                {page.srSuffix ? <span className="sr-only">{page.srSuffix}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
