"use client";

import { useEffect, useId, useState } from "react";

/**
 * Renders a Mermaid diagram in the browser. mermaid (~ several hundred kB) is imported only when a page
 * contains a diagram. Until it renders (or without JS) the source is shown as a code block.
 * securityLevel "strict": no HTML labels, no click handlers in diagrams.
 */
export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    async function draw() {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: dark.matches ? "dark" : "neutral",
          fontFamily: "var(--font-sans)",
        });
        const { svg } = await mermaid.render(`m${id}`, chart);
        if (!cancelled) setSvg(svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }
    void draw();
    dark.addEventListener("change", draw);
    return () => {
      cancelled = true;
      dark.removeEventListener("change", draw);
    };
  }, [chart, id]);

  if (svg && !failed) {
    return (
      <figure
        className="mermaid not-prose my-8 flex justify-center overflow-x-auto"
        role="img"
        aria-label="Diagram"
        // eslint-disable-next-line react/no-danger -- mermaid.render output, securityLevel "strict" (DOMPurify-sanitized SVG)
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  return (
    <pre className="mermaid-source" data-failed={failed || undefined}>
      <code>{chart}</code>
    </pre>
  );
}
