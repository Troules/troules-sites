/** Hrefs allowed in article links: http(s), mailto, in-page anchors, and site-relative paths. */
export function safeHref(href: unknown): string | undefined {
  if (typeof href !== "string") return undefined;
  if (href.startsWith("#") || (href.startsWith("/") && !href.startsWith("//"))) return href;
  try {
    const u = new URL(href);
    return ["http:", "https:", "mailto:"].includes(u.protocol) ? href : undefined;
  } catch {
    return undefined;
  }
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}
