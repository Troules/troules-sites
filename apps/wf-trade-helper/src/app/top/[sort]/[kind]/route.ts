import { getRows } from "@/lib/market";
import { KINDS, SORTS, TOP_LIMIT, top, type KindId, type Sort } from "@/lib/rank";

// The whole top list of one item type (arcanes, mods, sets…), prerendered as static JSON at build time. The
// dashboard fetches it when a reader picks a type; "all" is served by the page itself and /top/<sort>.

const TYPED = KINDS.filter((k) => k.id !== "all");

export async function generateStaticParams() {
  return SORTS.flatMap((s) => TYPED.map((k) => ({ sort: s.id, kind: k.id })));
}

export async function GET(_req: Request, { params }: RouteContext<"/top/[sort]/[kind]">) {
  const { sort, kind } = await params;
  if (!SORTS.some((s) => s.id === sort) || !TYPED.some((k) => k.id === kind))
    return new Response("Unknown list", { status: 404 });
  return Response.json(top(await getRows(), sort as Sort, TOP_LIMIT, kind as KindId));
}
