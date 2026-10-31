import { PostList } from "@/components/post-list";
import { getAllPosts } from "@/lib/content";
import { SITE } from "@/lib/site";

export default async function Home() {
  const posts = await getAllPosts();
  return (
    <>
      <h1 className="mt-10 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Field notes</h1>
      <p className="text-muted mt-3 max-w-[55ch] font-serif text-lg">{SITE.description}</p>
      <div className="mt-8">
        <PostList posts={posts} />
      </div>
    </>
  );
}
