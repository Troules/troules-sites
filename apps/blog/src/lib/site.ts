import { ROOT_DOMAIN } from "@troules/registry";

export const SITE = {
  name: "Troules · Blog",
  url: `https://blog.${ROOT_DOMAIN}`,
  home: `https://${ROOT_DOMAIN}`,
  description: "Notes from research and video deep-dives, written with Hermes and published from Telegram.",
} as const;

export function formatDate(iso: string, lang: "en" | "fr" = "en"): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export const KIND_LABEL = { research: "Research", "video-summary": "Video summary", note: "Note" } as const;
// guard test
