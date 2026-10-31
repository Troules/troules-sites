import "server-only";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Root } from "hast";
import { cacheLife } from "next/cache";
import { frontmatterSchema, SLUG_RE, type Frontmatter } from "./schema";
import { splitFrontmatter } from "./frontmatter";
import { readingMinutes, renderMarkdown, type Heading } from "./markdown";
import { byNewest } from "./site";

export const CONTENT_DIR = join(process.cwd(), "content");

export type PostMeta = Frontmatter & { slug: string; minutes: number };
export type Post = PostMeta & { tree: Root; headings: Heading[] };

/** Drafts are visible in local dev and Vercel preview deployments, never in production. */
export const showDrafts = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development";

// Paths are written as join(process.cwd(), "content", …) literally so the bundler traces only content/.
export function listSlugs(): string[] {
  if (!existsSync(join(process.cwd(), "content"))) return [];
  return readdirSync(join(process.cwd(), "content"))
    .filter(
      (d) =>
        statSync(join(process.cwd(), "content", d)).isDirectory() &&
        existsSync(join(process.cwd(), "content", d, "index.md")),
    )
    .sort();
}

/** Reads and validates one article. Throws with the file path and every schema issue. */
export function readPostSource(slug: string): { meta: PostMeta; body: string } {
  if (!SLUG_RE.test(slug)) throw new Error(`content/${slug}: folder name must be lowercase kebab-case`);
  const { data, body } = splitFrontmatter(readFileSync(join(process.cwd(), "content", slug, "index.md"), "utf8"));
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new Error(`content/${slug}/index.md: invalid front matter\n${issues}`);
  }
  return { meta: { ...parsed.data, slug, minutes: readingMinutes(body) }, body };
}

export async function getAllPosts(): Promise<PostMeta[]> {
  "use cache";
  cacheLife("max");
  return listSlugs()
    .map((slug) => readPostSource(slug).meta)
    .filter((p) => showDrafts || !p.draft)
    .sort(byNewest);
}

export async function getPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheLife("max");
  if (!listSlugs().includes(slug)) return null;
  const { meta, body } = readPostSource(slug);
  if (meta.draft && !showDrafts) return null;
  const { tree, headings } = await renderMarkdown(body, slug);
  return { ...meta, tree, headings };
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  "use cache";
  cacheLife("max");
  const counts = new Map<string, number>();
  for (const p of await getAllPosts()) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
