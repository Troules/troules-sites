import type { MetadataRoute } from "next";
import { ROOT_DOMAIN } from "@troules/registry";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/missing", "/search-index.json"] },
    sitemap: `https://wf-trade-helper.${ROOT_DOMAIN}/sitemap.xml`,
  };
}
