import type { Metadata } from "next";
import NotFound from "../not-found";

// Static 404 page that proxy.ts rewrites unknown URLs to (with HTTP status 404).
export const metadata: Metadata = { title: "Not found", robots: { index: false } };

export default function Missing() {
  return <NotFound />;
}
