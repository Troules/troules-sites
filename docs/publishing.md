# Publishing articles from Telegram

The owner asks Hermes (Telegram) to write about something; Hermes follows the skill in
[`skills/blog-article-creator`](../skills/blog-article-creator/SKILL.md) and the flow in [ADR 0004](adr/0004-publishing-from-telegram.md).

## Commands to Hermes (examples)

- "Write an article from what we just found about X." / "Fais un article de cette vidéo."
- After the preview: "publish", "change the title to …", "add a diagram of …", "drop".

## Iterating on the skill

The skill is versioned here. Edit `skills/blog-article-creator/`, bump `version` in `SKILL.md`, note it in the skill's
`CHANGELOG.md`, open a PR. After merge, update Hermes: `hermes skills update blog-article-creator` (or reinstall:
`hermes skills install Troules/troules-sites/skills/blog-article-creator --category writing --yes`).

## Writing by hand

Create `apps/blog/content/<slug>/index.md` (see `skills/blog-article-creator/references/article-format.md`),
`pnpm --filter @troules/blog test` to validate, open a PR. No changeset needed for articles.
