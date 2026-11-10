import type { MetadataRoute } from "next";
import { ROOT_DOMAIN } from "@troules/registry";
import { getMeta, getTrackedSlugs } from "@/lib/market";

const BASE = `https://wf-trade-helper.${ROOT_DOMAIN}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, meta] = await Promise.all([getTrackedSlugs(), getMeta()]);
  return [
    { url: `${BASE}/`, lastModified: meta.asOf },
    { url: `${BASE}/sets`, lastModified: meta.asOf },
    { url: `${BASE}/ducats`, lastModified: meta.asOf },
    { url: `${BASE}/vosfor`, lastModified: meta.asOf },
    { url: `${BASE}/stash`, lastModified: meta.asOf },
    ...slugs.map((slug) => ({ url: `${BASE}/items/${slug}`, lastModified: meta.asOf })),
  ];
}
