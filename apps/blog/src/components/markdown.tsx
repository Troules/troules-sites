import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Root } from "hast";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import { imageSize } from "image-size";
import type { ComponentProps } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { isExternal, safeHref } from "@/lib/urls";
import { Mermaid } from "./mermaid";

function Link({ href, children, ...rest }: ComponentProps<"a">) {
  const safe = safeHref(href);
  if (!safe) return <span>{children}</span>;
  return isExternal(safe) ? (
    <a href={safe} rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  ) : (
    <a href={safe} {...rest}>
      {children}
    </a>
  );
}

function makeImage(slug: string) {
  return function ArticleImage({ src, alt, title, ...rest }: ComponentProps<"img"> & { "data-local"?: string }) {
    const file = rest["data-local"];
    if (typeof src !== "string" || !file) return null;
    // Intrinsic size avoids layout shift; the file is guaranteed to exist by the content tests.
    const { width, height } = imageSize(readFileSync(join(process.cwd(), "content", slug, file)));
    return (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element -- static files; SVG/animated GIF must stay untouched */}
        <img src={src} alt={alt ?? ""} width={width} height={height} loading="lazy" decoding="async" />
        {title ? <figcaption>{title}</figcaption> : null}
      </figure>
    );
  };
}

/** Renders the article hast tree. Every tag maps to plain React elements; nothing from the article executes. */
export function Markdown({ tree, slug }: { tree: Root; slug: string }) {
  const components = {
    a: Link,
    img: makeImage(slug),
    "mermaid-diagram": ({ chart }: { chart: string }) => <Mermaid chart={chart} />,
  } as unknown as Partial<Components>;
  return toJsxRuntime(tree, { Fragment, jsx, jsxs, components, passKeys: true, passNode: false });
}
