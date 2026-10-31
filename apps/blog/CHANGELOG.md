# @troules/blog

## 0.3.0

### Minor Changes

- [#11](https://github.com/Troules/troules-sites/pull/11) [`86360dd`](https://github.com/Troules/troules-sites/commit/86360dde06d4132ee28fa1b69854655d7e19de78) Thanks [@Troules](https://github.com/Troules)! - Paginate the article list, 10 per page: `/` is page 1, `/page/<n>` the older ones (unknown pages return 404, `/page/1` redirects to `/`). Article folders can no longer use reserved route names (`page`, `tags`, …).

## 0.2.1

### Patch Changes

- [#10](https://github.com/Troules/troules-sites/pull/10) [`fe0fcc8`](https://github.com/Troules/troules-sites/commit/fe0fcc8430ed4200589bf4ea53d558e4c5adc3f0) Thanks [@Troules](https://github.com/Troules)! - Order same-day articles newest first: front-matter `date` accepts an optional Europe/Paris time (`YYYY-MM-DDTHH:MM`) used only for ordering.

## 0.2.0

### Minor Changes

- [`3732abd`](https://github.com/Troules/troules-sites/commit/3732abd73bc95c050daecf5f5c808ccfcd6f987b) Thanks [@Troules](https://github.com/Troules)! - First release of the site factory: index site (liquid glass over Cassiopeia A) and the blog (Markdown articles,
  Mermaid, SVG, RSS, tags), with shared UI, registry and Next.js config.

### Patch Changes

- Updated dependencies [[`3732abd`](https://github.com/Troules/troules-sites/commit/3732abd73bc95c050daecf5f5c808ccfcd6f987b)]:
  - @troules/ui@0.2.0
  - @troules/registry@0.2.0
