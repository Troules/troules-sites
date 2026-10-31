import { parse } from "yaml";

/** Splits "---\nyaml\n---\nbody". YAML parsed in core schema: no custom tags, no code. */
export function splitFrontmatter(source: string): { data: unknown; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!m) throw new Error("missing front matter (file must start with ---)");
  return { data: parse(m[1]!, { schema: "core", maxAliasCount: 0 }), body: m[2]! };
}
