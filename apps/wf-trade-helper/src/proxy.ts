import { NextResponse, type NextRequest } from "next/server";
import slugList from "./fixtures/slugs.json";

// With Partial Prerendering a page streams a 200 before notFound() can run, so unknown item URLs are answered
// here, before rendering, with a real 404. slugs.json is the warframe.market catalog (regenerate: `pnpm fixtures`).
const slugs = new Set(slugList);

export async function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (slug && slugs.has(slug)) return NextResponse.next();
  // NextResponse.rewrite() keeps status 200, so re-serve the static /missing page with a 404 instead.
  const page = await fetch(new URL("/missing", request.url));
  return new NextResponse(page.body, {
    status: 404,
    headers: { "content-type": page.headers.get("content-type") ?? "text/html; charset=utf-8" },
  });
}

export const config = { matcher: ["/items/:slug"] };
