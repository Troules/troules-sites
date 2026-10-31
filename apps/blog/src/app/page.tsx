import { Pagination } from "@/components/pagination";
import { PostList } from "@/components/post-list";
import { getAllPosts } from "@/lib/content";
import { paginate } from "@/lib/pagination";
import { SITE } from "@/lib/site";

export default async function Home() {
  const { items, page, pages } = paginate(await getAllPosts(), 1)!;
  return (
    <>
      <h1 className="mt-10 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Field notes</h1>
      <p className="text-muted mt-3 max-w-[55ch] font-serif text-lg">{SITE.description}</p>
      <div className="mt-8">
        <PostList posts={items} />
        <Pagination page={page} pages={pages} />
      </div>
    </>
  );
}
