/** [slug, name, thumb, kind]: the compact search index served at /search-index.json. */
export type IndexEntry = [string, string, string | null, string];

export type Hit = { entry: IndexEntry; at: number; len: number };

/**
 * Every query word must appear in the name. Ranking: name starts with the query, then a word starts with
 * it, then anywhere; shorter names first (so "Wisp Prime Set" beats "Wisp Prime Blueprint" for "wisp").
 */
export function search(index: IndexEntry[], query: string, limit = 8): Hit[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return [];
  const words = q.split(" ");
  const scored: { hit: Hit; score: number }[] = [];
  for (const entry of index) {
    const name = entry[1].toLowerCase();
    if (!words.every((w) => name.includes(w))) continue;
    const at = name.indexOf(q);
    const first = name.indexOf(words[0]!);
    const pos = at >= 0 ? at : first;
    const wordStart = pos === 0 || name[pos - 1] === " ";
    const score = (at === 0 ? 0 : wordStart ? 1 : 2) * 1000 + (at >= 0 ? 0 : 500) + name.length;
    scored.push({ hit: { entry, at: at >= 0 ? at : first, len: at >= 0 ? q.length : words[0]!.length }, score });
  }
  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.hit);
}
