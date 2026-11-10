import Link from "next/link";
import { Glass } from "@troules/ui/glass";
import { getMeta } from "@/lib/market";
import { shortDate } from "@/lib/format";
import { SearchPalette } from "./search-palette";
import { SiteNav } from "./site-nav";

/** The mark: a platinum coin seen flat, a hexagon with a facet cut into it. */
function Mark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 1.8l8.8 5.1v10.2L12 22.2l-8.8-5.1V6.9z"
        fill="rgb(143 211 255 / 0.12)"
        stroke="var(--color-accent)"
        strokeWidth="1.6"
      />
      <path d="M12 7.2l4.2 2.4v4.8L12 16.8l-4.2-2.4V9.6z" fill="var(--color-accent)" />
    </svg>
  );
}

export async function Header() {
  const meta = await getMeta();
  return (
    <Glass as="header" className="glass-bar border-line sticky top-0 z-10 border-b">
      <div className="mx-auto grid max-w-[1240px] grid-cols-[auto_1fr] items-center gap-x-4 px-4 sm:px-5 lg:flex lg:h-14 lg:gap-x-5">
        <Link href="/" className="flex h-12 shrink-0 items-center gap-2.5 text-[17px] font-semibold [font-stretch:80%]">
          <Mark />
          <span className="max-[380px]:sr-only">WF Trade Helper</span>
        </Link>
        <div className="col-span-2 row-start-2 -mx-1 pb-1.5 lg:col-auto lg:row-auto lg:mx-0 lg:pb-0">
          <SiteNav />
        </div>
        <div className="flex min-w-0 justify-end lg:flex-1 lg:justify-start">
          <SearchPalette catalogSize={meta.catalogSize} />
        </div>
        <p className="text-muted ml-auto hidden shrink-0 items-center gap-2 text-xs xl:flex">
          {meta.sample ? (
            <span className="text-down rounded bg-[color-mix(in_srgb,var(--color-down)_14%,transparent)] px-1.5 py-0.5 font-medium">
              Sample
            </span>
          ) : null}
          <span>
            PC + crossplay, <time dateTime={meta.asOf}>{shortDate(meta.asOf)}</time>
          </span>
        </p>
      </div>
    </Glass>
  );
}

export async function Footer() {
  const meta = await getMeta();
  return (
    <footer className="border-line text-muted mx-auto mt-6 max-w-[1240px] border-t px-5 pt-5 pb-10 text-xs leading-relaxed">
      <p className="max-w-[90ch]">
        Prices come from completed trades on{" "}
        <a href="https://warframe.market" className="link">
          warframe.market
        </a>{" "}
        (PC, crossplay), last 7 days unless stated, as of <time dateTime={meta.asOf}>{shortDate(meta.asOf)}</time>. Each
        item is ranked at its max rank. Your stash stays in this browser; nothing about it is sent anywhere.
        {meta.sample
          ? ` This build shows a sample of ${meta.tracked} items fetched ${meta.fetchedAt.replace("T", " ")}.`
          : null}
      </p>
      <p className="mt-1">
        Not affiliated with warframe.market or Digital Extremes. Warframe is a trademark of Digital Extremes.
      </p>
    </footer>
  );
}
