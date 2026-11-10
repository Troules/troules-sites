import { getPriceIndex } from "@/lib/market";

// Static JSON for the stash page: every priced (item, rank, subtype) as a compact tuple, fetched once on /stash.
export async function GET() {
  return Response.json(await getPriceIndex());
}
