import Link from "next/link";
import { Glass } from "@troules/ui/glass";
import { getMeta } from "@/lib/market";
import { SearchPalette } from "./search-palette";

export async function Header() {
  const meta = await getMeta();
  return (
    <Glass as="header" className="glass-bar border-line sticky top-0 z-10 border-b">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-4 px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 text-base font-semibold">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M12 2l9 5v10l-9 5-9-5V7z" />
            <path d="M12 7l4.5 2.5v5L12 17l-4.5-2.5v-5z" />
          </svg>
          WF Trade Helper
        </Link>
        <SearchPalette catalogSize={meta.catalogSize} />
        <div className="text-muted ml-auto flex flex-wrap gap-2 text-xs">
          <span className="border-line-strong rounded-full border px-2.5 py-1">PC · crossplay</span>
          <span className="num border-line-strong rounded-full border px-2.5 py-1">
            {meta.sample ? "Sample data" : "Data"} {meta.asOf}
          </span>
        </div>
      </div>
    </Glass>
  );
}

export async function Footer() {
  const meta = await getMeta();
  return (
    <footer className="text-muted mx-auto max-w-[1240px] px-5 pt-4 pb-10 text-xs leading-relaxed">
      <p>
        Prices come from completed trades on{" "}
        <a href="https://warframe.market" className="text-accent underline underline-offset-2">
          warframe.market
        </a>{" "}
        (PC, crossplay), last 7 days unless stated. Each item is ranked at its max rank.
        {meta.sample
          ? ` This build shows a sample of ${meta.tracked} items fetched ${meta.fetchedAt.replace("T", " ")}; the daily sweep of all items comes next.`
          : null}
      </p>
      <p className="mt-1">
        Not affiliated with warframe.market or Digital Extremes. Warframe is a trademark of Digital Extremes.
      </p>
    </footer>
  );
}
