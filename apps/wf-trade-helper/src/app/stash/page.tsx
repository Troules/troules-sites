import type { Metadata } from "next";
import Link from "next/link";
import { StashManager } from "@/components/stash-manager";
import { getRows } from "@/lib/market";
import { top } from "@/lib/rank";

export const metadata: Metadata = {
  title: "My stash",
  description:
    "List the Warframe items you want to sell: what they are worth today, which sit near their 90-day high, and a trade-chat message ready to paste. Saved in your browser only.",
  alternates: { canonical: "/stash" },
};

export default async function StashPage() {
  // Quick-add suggestions for an empty stash: the items that move the most plat, one line each.
  const seen = new Set<string>();
  const suggestions = top(await getRows(), "plat", 40)
    .filter((r) => !seen.has(r.slug) && seen.add(r.slug))
    .slice(0, 6)
    .map((r) => ({ slug: r.slug, name: r.name, thumb: r.thumb }));

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-5 px-4 pt-6 pb-6 sm:px-5">
      <nav aria-label="Breadcrumb" className="text-muted text-xs">
        <Link href="/" className="link">
          Market
        </Link>{" "}
        / My stash
      </nav>
      <div>
        <h1 className="text-[32px] leading-tight font-semibold">My stash</h1>
        <p className="text-muted mt-1.5 max-w-[68ch] leading-relaxed">
          The items you hold and want to turn into platinum. See what they are worth at this week&apos;s prices, which
          ones to list today, and copy a trade-chat message for the lot.
        </p>
      </div>
      <StashManager suggestions={suggestions} />
    </main>
  );
}
