// Build step (runs before dev and build):
// 1. copies article assets (images, SVG) from content/<slug>/ to public/content/<slug>/ (Markdown is never copied);
// 2. writes src/generated/routes.json (valid slugs and tags) for proxy.ts, so unknown URLs get a real 404.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const ASSET = /\.(png|jpe?g|webp|avif|gif|svg)$/i;
const root = new URL("..", import.meta.url).pathname;
const src = join(root, "content");
const out = join(root, "public", "content");
const production =
  process.env.VERCEL_ENV === "production" || (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");

rmSync(out, { recursive: true, force: true });
let n = 0;
const slugs = [];
const tags = new Set();
if (existsSync(src)) {
  for (const slug of readdirSync(src)) {
    const dir = join(src, slug);
    if (!statSync(dir).isDirectory() || !existsSync(join(dir, "index.md"))) continue;
    // Front matter is validated by the content tests; here we only need draft + tags.
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(join(dir, "index.md"), "utf8"));
    const data = fm ? (parse(fm[1], { schema: "core", maxAliasCount: 0 }) ?? {}) : {};
    if (production && data.draft === true) continue;
    slugs.push(slug);
    for (const t of Array.isArray(data.tags) ? data.tags : []) tags.add(String(t));
    for (const file of readdirSync(dir)) {
      if (!ASSET.test(file)) continue;
      mkdirSync(join(out, slug), { recursive: true });
      cpSync(join(dir, file), join(out, slug, file));
      n++;
    }
  }
}
mkdirSync(join(root, "src", "generated"), { recursive: true });
writeFileSync(
  join(root, "src", "generated", "routes.json"),
  JSON.stringify({ slugs: slugs.sort(), tags: [...tags].sort() }, null, 2) + "\n",
);
// eslint-disable-next-line no-console -- build script output
console.log(`copy-assets: ${n} asset(s), ${slugs.length} article(s), ${tags.size} tag(s)`);
