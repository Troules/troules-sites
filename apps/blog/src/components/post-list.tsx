import Link from "next/link";
import type { PostMeta } from "@/lib/content";
import { day, formatDate, KIND_LABEL } from "@/lib/site";

export function PostList({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return <p className="text-muted">Nothing here yet.</p>;
  return (
    <ol className="divide-rule divide-y">
      {posts.map((p) => (
        <li key={p.slug} className="py-7">
          <article lang={p.lang}>
            <p className="text-muted font-mono text-xs">
              <time dateTime={day(p.date)}>{formatDate(p.date, p.lang)}</time> · {KIND_LABEL[p.kind]} · {p.minutes} min
              {p.draft ? (
                <span className="ml-2 rounded bg-amber-500/15 px-1.5 text-amber-700 dark:text-amber-300">draft</span>
              ) : null}
            </p>
            <h2 className="mt-2 font-serif text-2xl leading-snug font-semibold">
              <Link href={`/${p.slug}`} className="hover:text-accent">
                {p.title}
              </Link>
            </h2>
            <p className="text-muted mt-2 font-serif text-lg leading-relaxed">{p.description}</p>
          </article>
        </li>
      ))}
    </ol>
  );
}
