import { ROOT_DOMAIN } from "@troules/registry";

export const SITE = {
  name: "Troules · Blog",
  url: `https://blog.${ROOT_DOMAIN}`,
  home: `https://${ROOT_DOMAIN}`,
  description: "Notes from research and video deep-dives, written with Hermes and published from Telegram.",
} as const;

/** The YYYY-MM-DD part of a front-matter date (which may carry an ordering-only time). */
export const day = (iso: string): string => iso.slice(0, 10);

/** Newest first; same-day posts by their optional time, then by slug. */
export function byNewest(a: { date: string; slug: string }, b: { date: string; slug: string }): number {
  return b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug);
}

export function formatDate(iso: string, lang: "en" | "fr" = "en"): string {
  return new Date(`${day(iso)}T00:00:00Z`).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export const KIND_LABEL = { research: "Research", "video-summary": "Video summary", note: "Note" } as const;
