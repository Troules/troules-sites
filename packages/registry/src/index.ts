/**
 * The list of Troules sites. The index site renders it; add a site here when you add an app.
 * `status`: "live" sites are linked, "soon" ones are shown greyed out.
 */
export type Site = {
  slug: string;
  name: string;
  url: string;
  description: string;
  status: "live" | "soon";
};

export const ROOT_DOMAIN = "troules.dynv6.net";

export const sites: readonly Site[] = [
  {
    slug: "blog",
    name: "Blog",
    url: `https://blog.${ROOT_DOMAIN}`,
    description: "Notes from research and video deep-dives, written with Hermes and published from Telegram.",
    status: "live",
  },
];

export function liveSites(list: readonly Site[] = sites): Site[] {
  return list.filter((s) => s.status === "live");
}
