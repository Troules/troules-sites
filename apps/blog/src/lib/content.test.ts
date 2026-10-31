// @vitest-environment jsdom
// Validates every article in content/: this is the gate Hermes's pull requests must pass.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Root } from "hast";
import { visit } from "unist-util-visit";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: () => {} }));

const { CONTENT_DIR, listSlugs, readPostSource } = await import("./content");
const { renderMarkdown } = await import("./markdown");

const slugs = listSlugs();
const ALLOWED = /\.(md|png|jpe?g|webp|avif|gif|svg)$/i;
const MAX_ASSET_BYTES = 1_500_000;

describe("content/", () => {
  it("has at least one article", () => expect(slugs.length).toBeGreaterThan(0));

  it("contains only article folders with index.md", () => {
    for (const entry of readdirSync(CONTENT_DIR)) {
      expect(existsSync(join(CONTENT_DIR, entry, "index.md")), `${entry} must be a folder with index.md`).toBe(true);
    }
  });
});

describe.each(slugs)("content/%s", (slug) => {
  const dir = join(CONTENT_DIR, slug);

  it("has valid front matter", () => {
    expect(() => readPostSource(slug)).not.toThrow();
  });

  it("only contains allowed, reasonably sized files", () => {
    for (const f of readdirSync(dir)) {
      expect(f, `unexpected file type`).toMatch(ALLOWED);
      expect(readFileSync(join(dir, f)).length, `${f} is over 1.5 MB: compress it`).toBeLessThan(MAX_ASSET_BYTES);
    }
  });

  it("has safe SVGs (no script, event handlers or external references)", () => {
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
      const svg = readFileSync(join(dir, f), "utf8");
      expect(svg, f).not.toMatch(/<script|<foreignObject|\son\w+\s*=|javascript:|href\s*=\s*["']https?:/i);
    }
  });

  it("references only images that exist, each with alt text", async () => {
    const { meta, body } = readPostSource(slug);
    if (meta.cover) expect(existsSync(join(dir, meta.cover.src))).toBe(true);
    const raw = [...body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)/g)];
    for (const [, alt, src] of raw) {
      expect(src, "images must be local: ./file.ext").toMatch(/^\.\/[\w.-]+$/);
      expect(existsSync(join(dir, src!)), `${src} is missing`).toBe(true);
      expect(alt!.length, `alt text for ${src}`).toBeGreaterThan(3);
    }
  });

  it("has Mermaid diagrams that parse", async () => {
    const { body } = readPostSource(slug);
    const { tree } = await renderMarkdown(body, slug);
    const charts: string[] = [];
    visit(tree as Root, "element", (n) => {
      if (n.tagName === "mermaid-diagram") charts.push(String(n.properties.chart));
    });
    if (charts.length === 0) return;
    const { default: mermaid } = await import("mermaid");
    for (const c of charts) await expect(mermaid.parse(c), c.slice(0, 60)).resolves.toBeTruthy();
  });

  it("starts at h2 (the title is the h1) and doesn't skip heading levels", () => {
    const { body } = readPostSource(slug);
    const levels = [...body.replace(/```[\s\S]*?```/g, "").matchAll(/^(#{1,6})\s/gm)].map((m) => m[1]!.length);
    expect(levels.includes(1), "don't use # (h1) in the body").toBe(false);
    levels.forEach((l, i) => i > 0 && expect(l - levels[i - 1]!, "heading level skipped").toBeLessThanOrEqual(1));
  });
});
