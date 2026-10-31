# @troules/index

## 0.2.1

### Patch Changes

- [`1cbbaa9`](https://github.com/Troules/troules-sites/commit/1cbbaa98d7c9397bb4c23c9ab8fe335a5b94e69d) Thanks [@Troules](https://github.com/Troules)! - Static background: the slow drift animation re-rendered every glass panel's backdrop (including the CPU-bound SVG
  refraction filter) on each frame, adding up to ~1 s of main-thread blocking on slow devices.

## 0.2.0

### Minor Changes

- [`3732abd`](https://github.com/Troules/troules-sites/commit/3732abd73bc95c050daecf5f5c808ccfcd6f987b) Thanks [@Troules](https://github.com/Troules)! - First release of the site factory: index site (liquid glass over Cassiopeia A) and the blog (Markdown articles,
  Mermaid, SVG, RSS, tags), with shared UI, registry and Next.js config.

### Patch Changes

- Updated dependencies [[`3732abd`](https://github.com/Troules/troules-sites/commit/3732abd73bc95c050daecf5f5c808ccfcd6f987b)]:
  - @troules/ui@0.2.0
  - @troules/registry@0.2.0
