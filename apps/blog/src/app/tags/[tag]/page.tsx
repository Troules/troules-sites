import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostList } from "@/components/post-list";
import { getAllPosts, getAllTags } from "@/lib/content";

export async function generateStaticParams() {
  return (await getAllTags()).map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps<"/tags/[tag]">): Promise<Metadata> {
  return { title: `#${(await params).tag}` };
}

export default async function TagPage({ params }: PageProps<"/tags/[tag]">) {
  const { tag } = await params;
  const posts = (await getAllPosts()).filter((p) => p.tags.includes(tag));
  if (posts.length === 0) notFound();
  return (
    <>
      <h1 className="mt-10 font-serif text-4xl font-semibold">#{tag}</h1>
      <div className="mt-6">
        <PostList posts={posts} />
      </div>
    </>
  );
}
