import { getSearchIndex } from "@/lib/market";

// Static JSON for the ⌘K palette: [slug, name, thumb, kind] per item (~60 KB gzipped), fetched on first open.
export async function GET() {
  return Response.json(await getSearchIndex());
}
