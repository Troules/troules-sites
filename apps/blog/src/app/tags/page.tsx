import type { Metadata } from "next";
import Link from "next/link";
import { getAllTags } from "@/lib/content";

export const metadata: Metadata = { title: "Tags" };

export default async function TagsPage() {
  const tags = await getAllTags();
  return (
    <>
      <h1 className="mt-10 font-serif text-4xl font-semibold">Tags</h1>
      <ul className="mt-8 flex flex-wrap gap-3">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link href={`/tags/${tag}`} className="border-rule hover:text-accent rounded-full border px-3 py-1">
              #{tag} <span className="text-muted">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
