import type { MetadataRoute } from "next";
import { ROOT_DOMAIN } from "@troules/registry";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `https://${ROOT_DOMAIN}/sitemap.xml` };
}
