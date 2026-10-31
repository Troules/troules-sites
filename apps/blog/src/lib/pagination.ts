/** Articles per listing page. Page 1 is "/", page n ≥ 2 is "/page/n". */
export const PAGE_SIZE = 10;

export const pageCount = (total: number): number => Math.max(1, Math.ceil(total / PAGE_SIZE));

export const pageHref = (page: number): string => (page <= 1 ? "/" : `/page/${page}`);

/** Parses a "/page/[n]" segment: a canonical positive integer ("2", not "02" or "2.0"), else null. */
export function parsePage(segment: string): number | null {
  return /^[1-9]\d{0,5}$/.test(segment) ? Number(segment) : null;
}

/** The slice of `items` shown on `page`, or null when the page doesn't exist. */
export function paginate<T>(items: T[], page: number): { items: T[]; page: number; pages: number } | null {
  const pages = pageCount(items.length);
  if (!Number.isInteger(page) || page < 1 || page > pages) return null;
  return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, pages };
}
