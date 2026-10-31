import Link from "next/link";
import { pageHref } from "@/lib/pagination";

/** Newer / older links between listing pages. Renders nothing when everything fits on one page. */
export function Pagination({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="border-rule mt-4 flex items-center justify-between border-t pt-6 text-sm">
      {page > 1 ? (
        <Link href={pageHref(page - 1)} rel="prev" className="hover:text-accent">
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted font-mono text-xs">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={pageHref(page + 1)} rel="next" className="hover:text-accent">
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
