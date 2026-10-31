import { NextResponse, type NextRequest } from "next/server";
import routes from "./generated/routes.json";
import { pageCount, parsePage } from "./lib/pagination";

// With Partial Prerendering a page streams a 200 before notFound() can run, so unknown article/tag URLs
// are answered here, before rendering, with a real 404 (good for SEO and uptime checks).
const slugs = new Set(routes.slugs);
const tags = new Set(routes.tags);
const pages = pageCount(routes.slugs.length);

export async function proxy(request: NextRequest) {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean);
  if (parts[0] === "page" && parts.length === 2) {
    const n = parsePage(parts[1]!);
    if (n === 1) return NextResponse.redirect(new URL("/", request.url), 308);
    if (n !== null && n <= pages) return NextResponse.next();
  }
  const known =
    parts.length === 1 ? slugs.has(parts[0]!) : parts[0] === "tags" && parts.length === 2 && tags.has(parts[1]!);
  if (known) return NextResponse.next();
  // NextResponse.rewrite() keeps status 200, so re-serve the static /missing page with a 404 instead.
  const page = await fetch(new URL("/missing", request.url));
  return new NextResponse(page.body, {
    status: 404,
    headers: { "content-type": page.headers.get("content-type") ?? "text/html; charset=utf-8" },
  });
}

// Only dynamic routes: /<slug>, /tags/<tag> and /page/<n>. Everything static (/, /tags, feed, sitemap, assets) skips the proxy.
export const config = {
  matcher: [
    "/((?!_next/|_vercel/|content/|missing$|tags$|feed\\.xml$|sitemap\\.xml$|robots\\.txt$|favicon\\.ico$)[^/]+)",
    "/tags/:tag",
    "/page/:n",
  ],
};
