import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/pagination";
import { PostList } from "@/components/post-list";
import { getAllPosts } from "@/lib/content";
import { pageCount, pageHref, paginate, parsePage } from "@/lib/pagination";

// Page 1 is included even though proxy.ts redirects /page/1 to "/": with Cache Components this list must never be
// empty, and it would be while every article fits on the home page.
export async function generateStaticParams() {
  const pages = pageCount((await getAllPosts()).length);
  return Array.from({ length: pages }, (_, i) => ({ n: String(i + 1) }));
}

export async function generateMetadata({ params }: PageProps<"/page/[n]">): Promise<Metadata> {
  const page = parsePage((await params).n) ?? 1;
  return { title: `Page ${page}`, alternates: { canonical: pageHref(page) } };
}

export default async function ListingPage({ params }: PageProps<"/page/[n]">) {
  const page = parsePage((await params).n);
  const result = page === null ? null : paginate(await getAllPosts(), page);
  if (!result) notFound();
  return (
    <>
      <h1 className="mt-10 font-serif text-4xl font-semibold tracking-tight">Field notes · page {result.page}</h1>
      <div className="mt-8">
        <PostList posts={result.items} />
        <Pagination page={result.page} pages={result.pages} />
      </div>
    </>
  );
}
