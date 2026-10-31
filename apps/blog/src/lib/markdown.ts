import type { Element, Root } from "hast";
import { toString } from "hast-util-to-string";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { createHighlighter, type Highlighter } from "shiki";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

export type Heading = { depth: 2 | 3; id: string; text: string };

/** Languages articles may highlight; anything else renders as plain text. One highlighter per process. */
export const CODE_LANGS = [
  "bash",
  "css",
  "diff",
  "html",
  "javascript",
  "json",
  "jsx",
  "markdown",
  "python",
  "rust",
  "sql",
  "toml",
  "tsx",
  "typescript",
  "yaml",
] as const;
let highlighter: Promise<Highlighter> | undefined;
function getHighlighter(): Promise<Highlighter> {
  highlighter ??= createHighlighter({ themes: ["github-light", "github-dark"], langs: [...CODE_LANGS] });
  return highlighter;
}

/** ```mermaid fences → <mermaid-diagram chart="…">, rendered client-side. Runs before Shiki. */
function rehypeMermaid() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return;
      const code = node.children[0];
      if (code?.type !== "element" || code.tagName !== "code") return;
      const cls = code.properties.className;
      if (!Array.isArray(cls) || !cls.includes("language-mermaid")) return;
      const diagram: Element = {
        type: "element",
        tagName: "mermaid-diagram",
        properties: { chart: toString(code).trim() },
        children: [],
      };
      parent.children[index] = diagram;
    });
  };
}

/** Relative image src ("./x.svg") → "/content/<slug>/x.svg". Anything else (remote, data:, ../) is dropped. */
function rehypeLocalImages(slug: string) {
  return () => (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;
      const src = String(node.properties.src ?? "");
      const m = /^\.\/([\w.-]+\.(?:png|jpe?g|webp|avif|gif|svg))$/i.exec(src);
      node.properties.src = m ? `/content/${slug}/${m[1]}` : undefined;
      node.properties.dataLocal = m ? m[1] : undefined;
    });
  };
}

function rehypeCollectHeadings(out: Heading[]) {
  return () => (tree: Root) => {
    visit(tree, "element", (node) => {
      if ((node.tagName === "h2" || node.tagName === "h3") && typeof node.properties.id === "string") {
        out.push({ depth: node.tagName === "h2" ? 2 : 3, id: node.properties.id, text: toString(node) });
      }
    });
  };
}

/**
 * Markdown (GFM + GitHub alerts) → sanitized-by-construction hast.
 * No MDX and no raw HTML (remark-rehype drops it unless allowDangerousHtml), so an article can't run code.
 */
export async function renderMarkdown(markdown: string, slug: string): Promise<{ tree: Root; headings: Heading[] }> {
  const headings: Heading[] = [];
  const shiki = await getHighlighter();
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlert)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeMermaid)
    .use(rehypeLocalImages(slug))
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeCollectHeadings(headings))
    .use(rehypeShikiFromHighlighter, shiki, {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      fallbackLanguage: "text",
    });
  const tree = (await processor.run(processor.parse(markdown))) as Root;
  return { tree, headings };
}

/** Words per minute for an average adult reading screen text. */
export function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}
