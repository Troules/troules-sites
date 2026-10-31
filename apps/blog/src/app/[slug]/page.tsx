import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { getAllPosts, getPost } from "@/lib/content";
import { formatDate, KIND_LABEL } from "@/lib/site";

export async function generateStaticParams() {
  return (await getAllPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
      ...(post.cover ? { images: [`/content/${post.slug}/${post.cover.src.slice(2)}`] } : {}),
    },
    robots: post.draft ? { index: false } : undefined,
  };
}

export default async function PostPage({ params }: PageProps<"/[slug]">) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  return (
    <article lang={post.lang} className="mt-10">
      <div className="progress" aria-hidden="true" />
      <p className="text-muted font-mono text-xs">
        <time dateTime={post.date}>{formatDate(post.date, post.lang)}</time>
        {post.updated ? (
          <>
            {" "}
            · updated <time dateTime={post.updated}>{formatDate(post.updated, post.lang)}</time>
          </>
        ) : null}
        {" · "}
        {KIND_LABEL[post.kind]} · {post.minutes} min read
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
        {post.title}
      </h1>
      <p className="text-muted mt-4 font-serif text-xl leading-relaxed text-pretty">{post.description}</p>
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
        {post.tags.map((t) => (
          <li key={t}>
            <Link
              href={`/tags/${t}`}
              className="border-rule text-muted hover:text-ink rounded-full border px-2.5 py-0.5 text-xs"
            >
              #{t}
            </Link>
          </li>
        ))}
      </ul>

      {post.video ? (
        <p className="border-rule mt-8 rounded-lg border p-4 text-sm">
          Summary of{" "}
          <a href={post.video.url} rel="noopener noreferrer" className="font-medium underline underline-offset-4">
            {post.video.title}
          </a>
          {post.video.channel ? <> by {post.video.channel}</> : null}.
        </p>
      ) : null}

      <div className="prose prose-lg prose-zinc dark:prose-invert prose-headings:font-sans prose-headings:tracking-tight prose-a:text-accent prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-headings:scroll-mt-8 prose-pre:border prose-pre:border-rule prose-img:rounded-lg mt-10 max-w-none font-serif">
        <Markdown tree={post.tree} slug={post.slug} />
      </div>

      {post.sources.length > 0 ? (
        <section aria-labelledby="sources" className="border-rule mt-14 border-t pt-6">
          <h2 id="sources" className="text-muted text-sm font-semibold tracking-wide uppercase">
            Sources
          </h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
            {post.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  rel="noopener noreferrer"
                  className="decoration-rule hover:decoration-accent underline underline-offset-4"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </article>
  );
}
