import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/content";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = (await getAllPosts()).filter((p) => !p.draft);
  return [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    ...posts.map((p) => ({ url: `${SITE.url}/${p.slug}`, lastModified: p.updated ?? p.date })),
  ];
}
