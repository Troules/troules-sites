import { z } from "zod";

/** Article slug = folder name under content/. Lowercase kebab-case, ASCII only. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD")
  .refine((d) => !Number.isNaN(Date.parse(d)), "not a real date");

/** Publication date, optionally with a Europe/Paris time ("2026-10-31T22:05") that only orders same-day posts. */
const publishDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/, "use YYYY-MM-DD or YYYY-MM-DDTHH:MM")
  .refine((d) => !Number.isNaN(Date.parse(d)), "not a real date");

const httpsUrl = z.url({ protocol: /^https$/, error: "must be an https:// URL" });

/** Local asset path relative to the article folder: "./diagram.svg". No subfolders, no "..". */
const localAsset = z
  .string()
  .regex(/^\.\/[\w.-]+\.(png|jpe?g|webp|avif|gif|svg)$/i, 'use "./file.ext" (png, jpg, webp, avif, gif, svg)');

export const frontmatterSchema = z
  .object({
    title: z.string().min(5).max(120),
    description: z.string().min(20).max(200),
    date: publishDate,
    updated: isoDate.optional(),
    lang: z.enum(["en", "fr"]).default("en"),
    kind: z.enum(["research", "video-summary", "note"]),
    tags: z.array(z.string().regex(SLUG_RE, "tags are lowercase kebab-case")).min(1).max(6),
    sources: z.array(z.object({ title: z.string().min(2), url: httpsUrl })).default([]),
    video: z
      .object({
        url: httpsUrl.refine((u) => /^(www\.)?(youtube\.com|youtu\.be)$/.test(new URL(u).hostname), "YouTube URL"),
        title: z.string().min(2),
        channel: z.string().optional(),
      })
      .optional(),
    cover: z.object({ src: localAsset, alt: z.string().min(5) }).optional(),
    draft: z.boolean().default(false),
  })
  .strict()
  .superRefine((fm, ctx) => {
    if (fm.kind !== "note" && fm.sources.length === 0)
      ctx.addIssue({ code: "custom", path: ["sources"], message: `${fm.kind} articles need at least one source` });
    if (fm.kind === "video-summary" && !fm.video)
      ctx.addIssue({ code: "custom", path: ["video"], message: "video-summary articles need a video" });
    if (fm.updated && fm.updated < fm.date.slice(0, 10))
      ctx.addIssue({ code: "custom", path: ["updated"], message: "updated is before date" });
  });

export type Frontmatter = z.infer<typeof frontmatterSchema>;
