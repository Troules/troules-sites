# Publishing with the GitHub tools

Repo: owner `Troules`, repo `troules-sites`, base branch `main`. Your branch: `hermes/<slug>`.
Your token can read/write contents and pull requests on this repo only. It can't change workflows, and the
`Content guard` check fails any PR from a `hermes/*` branch that touches files outside `apps/blog/content/`.

## Open

1. `create_branch` — `branch: "hermes/<slug>"`, `from_branch: "main"`.
2. `push_files` — one commit with every file of the article:
   `branch: "hermes/<slug>"`, `message: "feat(blog): add <slug>"`,
   `files: [{ path: "apps/blog/content/<slug>/index.md", content: "…" }, { path: "apps/blog/content/<slug>/diagram.svg", content: "…" }]`.
3. `create_pull_request` — `head: "hermes/<slug>"`, `base: "main"`,
   `title: "feat(blog): <short lowercase summary>"` (Conventional Commits; CI checks the title),
   `body`: the description, the outline, and the list of sources.

## Wait for checks and the preview

- Checks take 2–4 minutes. Poll `pull_request_read` with `method: "get_check_runs"` (GitHub Actions jobs) and
  `method: "get_status"` (Vercel's deployment status), at most once a minute, max 10 minutes.
  Required: `Lint, types, tests, build` and `Content guard` succeed (skipped jobs are fine).
- The Vercel preview URL is in the Vercel bot comment (`pull_request_read`, `method: "get_comments"`) or the
  `target_url` of the Vercel status for the blog project. Article URL = `<preview-url>/<slug>`.
- If a check fails: read the failure from the check output, fix with `push_files` to the same branch, and wait again.
  After 2 failed attempts, tell the owner what fails and stop.

## Revise

`push_files` to `hermes/<slug>` with message `fix(blog): <what changed>`. Re-check, resend the preview link.

## Publish (only after the owner's explicit go-ahead)

1. `pull_request_read` `method: "get"` → note `head.sha` and check it's the commit the owner previewed, and that
   checks passed.
2. `merge_pull_request` — `pullNumber`, `merge_method: "squash"`, `expectedHeadSha: <that sha>`,
   `commit_title: "feat(blog): add <slug> (#<number>)"`. The owner taps approve in Telegram.
3. Reply with `https://blog.troules.dynv6.net/<slug>` (live about a minute later).

If the merge is refused (checks pending/failed, new commits), say so; never retry with a different sha.

## Drop

`update_pull_request` — `state: "closed"`. Leave the branch.
