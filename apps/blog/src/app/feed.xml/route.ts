import { getAllPosts } from "@/lib/content";
import { day, SITE } from "@/lib/site";

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

export async function GET() {
  const posts = (await getAllPosts()).filter((p) => !p.draft).slice(0, 30);
  const items = posts
    .map(
      (p) =>
        `<item><title>${esc(p.title)}</title><link>${SITE.url}/${p.slug}</link><guid>${SITE.url}/${p.slug}</guid>` +
        `<pubDate>${new Date(`${day(p.date)}T00:00:00Z`).toUTCString()}</pubDate><description>${esc(p.description)}</description>` +
        p.tags.map((t) => `<category>${esc(t)}</category>`).join("") +
        `</item>`,
    )
    .join("");
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(SITE.name)}</title>` +
    `<link>${SITE.url}</link><description>${esc(SITE.description)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
