import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { readingMinutes, renderMarkdown } from "./markdown";
import { safeHref } from "./urls";

function elements(tree: Root, tag: string): Element[] {
  const out: Element[] = [];
  visit(tree, "element", (n) => {
    if (n.tagName === tag) out.push(n);
  });
  return out;
}

describe("renderMarkdown (security)", () => {
  it("drops raw HTML, including scripts", async () => {
    const { tree } = await renderMarkdown('Hi <script>alert(1)</script><img src=x onerror="alert(1)">', "s");
    expect(elements(tree, "script")).toHaveLength(0);
    expect(JSON.stringify(tree)).not.toContain("onerror");
  });

  it("drops remote and parent-directory images", async () => {
    const { tree } = await renderMarkdown("![a](https://evil.example/x.png) ![b](../other/x.png) ![c](./ok.svg)", "s");
    const srcs = elements(tree, "img").map((i) => i.properties.src);
    expect(srcs).toEqual([undefined, undefined, "/content/s/ok.svg"]);
  });

  it("only allows safe link protocols", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref("data:text/html,x")).toBeUndefined();
    expect(safeHref("//evil.example")).toBeUndefined();
    expect(safeHref("https://ok.example")).toBe("https://ok.example");
    expect(safeHref("/tags/x")).toBe("/tags/x");
    expect(safeHref("#section")).toBe("#section");
  });
});

describe("renderMarkdown (features)", () => {
  it("turns mermaid fences into a diagram element", async () => {
    const { tree } = await renderMarkdown("```mermaid\ngraph TD; A-->B\n```", "s");
    const [d] = elements(tree, "mermaid-diagram");
    expect(d?.properties.chart).toBe("graph TD; A-->B");
  });

  it("highlights code and collects h2/h3 headings with ids", async () => {
    const { tree, headings } = await renderMarkdown("## Hello world\n\n### Sub\n\n```ts\nconst a = 1\n```", "s");
    expect(headings).toEqual([
      { depth: 2, id: "hello-world", text: "Hello world" },
      { depth: 3, id: "sub", text: "Sub" },
    ]);
    expect(JSON.stringify(tree)).toContain("shiki");
  });

  it("estimates reading time without counting code", () => {
    expect(readingMinutes("word ".repeat(460) + "```\n" + "code ".repeat(5000) + "\n```")).toBe(2);
  });
});
