import { getRows } from "@/lib/market";
import { FIRST_ROWS, SORTS, TOP_LIMIT, top, type Sort } from "@/lib/rank";

// Ranks 11–100 of each dashboard list, prerendered as static JSON at build time; loaded on scroll by MoreRows.

export async function generateStaticParams() {
  return SORTS.map((s) => ({ sort: s.id }));
}

export async function GET(_req: Request, { params }: RouteContext<"/top/[sort]">) {
  const { sort } = await params;
  if (!SORTS.some((s) => s.id === sort)) return new Response("Unknown sort", { status: 404 });
  return Response.json(top(await getRows(), sort as Sort, TOP_LIMIT).slice(FIRST_ROWS));
}
