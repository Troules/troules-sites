import type { MetadataRoute } from "next";
import { ROOT_DOMAIN } from "@troules/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `https://${ROOT_DOMAIN}/`, changeFrequency: "monthly", priority: 1 }];
}
