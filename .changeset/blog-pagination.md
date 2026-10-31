---
"@troules/blog": minor
---

Paginate the article list, 10 per page: `/` is page 1, `/page/<n>` the older ones (unknown pages return 404, `/page/1` redirects to `/`). Article folders can no longer use reserved route names (`page`, `tags`, …).
