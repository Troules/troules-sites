# 0008. Liquid glass as progressive enhancement

- Status: accepted
- Date: 2026-10-31

## Decision

`@troules/ui/glass` = `.glass` CSS + `<Glass>` + `<GlassFilter>`:

1. All browsers: translucent gradient body, `backdrop-filter: blur() saturate()`, gradient specular rim (masked
   `::before`), pointer-following sheen (`::after`, CSS variables set on pointer move).
2. Chromium only: real refraction with an SVG `feTurbulence` + `feDisplacementMap` filter used _inside_
   `backdrop-filter: url(#troules-liquid)`. Only Chromium renders that; Safari parses it and draws nothing, so
   `@supports` can't detect it: `GlassFilter` sets `data-refraction` when `navigator.userAgentData` exists.
3. No backdrop-filter → near-opaque panel; `prefers-reduced-transparency` → solid panel; `prefers-reduced-motion` →
   no hover motion and no background drift.

Background: Webb NIRCam image of Cassiopeia A (ESA/Webb, CC BY 4.0; credit shown in the footer as required), cropped
square to 2400 px WebP (565 kB), served through `next/image` with a blur placeholder.

## Consequences

Text over glass keeps contrast because the image is dimmed by a radial vignette; axe checks it in CI.
