---
title: "How this blog works"
description: "From a Telegram conversation to a published article: research, review on a preview link, one tap to publish."
date: 2026-10-31
lang: en
kind: note
tags: [meta, hermes, publishing]
cover:
  src: ./pipeline.svg
  alt: Telegram to Hermes to GitHub pull request to Vercel
---

This blog is written in conversation. I talk with **Hermes**, my assistant on Telegram, about a topic or a
YouTube video. When something is worth keeping, Hermes turns it into an article, and I publish it without
leaving the chat.

![The publishing pipeline at a glance](./pipeline.svg "Telegram → Hermes → pull request → preview → publish")

## The pipeline

```mermaid
sequenceDiagram
    actor Me
    participant H as Hermes (Telegram)
    participant G as GitHub
    participant CI as CI checks
    participant V as Vercel
    Me->>H: "Write an article from this"
    H->>G: branch + Markdown + pull request
    G->>CI: lint, schema, links, path guard
    G->>V: preview deployment
    H-->>Me: PR link + preview link
    Me->>H: "publish"
    H->>G: merge (I tap approve)
    G->>V: production deployment
```

## Why Markdown in git

- **Reviewable**: every article is a pull request with a preview link, so nothing goes live unseen.
- **Safe**: articles are plain Markdown. No MDX, no raw HTML, so an article can't run code.
- **Durable**: no database to pause or migrate. The site is static and served from Vercel's CDN.

> [!NOTE]
> Hermes can only touch `apps/blog/content/` and can't change the code or the checks that guard it.
