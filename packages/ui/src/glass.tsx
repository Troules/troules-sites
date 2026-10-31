"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type ElementType, type PointerEvent } from "react";

type GlassProps<T extends ElementType> = {
  as?: T;
  interactive?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/** A liquid-glass surface. Import "@troules/ui/glass.css" once and render <GlassFilter /> once per page. */
export function Glass<T extends ElementType = "div">({ as, interactive = false, className, ...rest }: GlassProps<T>) {
  const Tag: ElementType = as ?? "div";
  const onPointerMove = interactive
    ? (e: PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
    : undefined;
  const classes = ["glass", interactive && "glass-interactive", className].filter(Boolean).join(" ");
  return <Tag className={classes} onPointerMove={onPointerMove} {...rest} />;
}

/** True only in Chromium, the one engine that renders SVG filters inside backdrop-filter. */
export function supportsBackdropSvgFilter(nav: Navigator | undefined = globalThis.navigator): boolean {
  return !!nav && "userAgentData" in nav;
}

/**
 * The SVG displacement filter used for refraction, plus the feature flag on <html>.
 * Turbulence → displacement map: low frequency gives the slow "lens wobble" of liquid glass.
 */
export function GlassFilter() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (supportsBackdropSvgFilter()) document.documentElement.dataset.refraction = "";
  }, []);
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute" }}>
      <filter id="troules-liquid" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="38" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
