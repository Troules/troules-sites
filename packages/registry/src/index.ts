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
  {
    slug: "wf-trade-helper",
    name: "WF Trade Helper",
    url: `https://wf-trade-helper.${ROOT_DOMAIN}`,
    description: "Which Warframe items sell best: plat traded per day, prices and history from warframe.market.",
    status: "soon",
  },
];

export function liveSites(list: readonly Site[] = sites): Site[] {
  return list.filter((s) => s.status === "live");
}
