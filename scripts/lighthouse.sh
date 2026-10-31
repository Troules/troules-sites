#!/usr/bin/env bash
# Runs Lighthouse against the production builds of every app (run `pnpm build` first) and enforces the
# budgets in lighthouserc.json. Uses Playwright's Chromium so CI doesn't need a second browser.
set -euo pipefail
cd "$(dirname "$0")/.."
pids=()
trap 'kill "${pids[@]}" 2>/dev/null || true' EXIT
(cd apps/index && exec pnpm start -p 3100 >/dev/null 2>&1) & pids+=($!)
(cd apps/blog && exec pnpm start -p 3200 >/dev/null 2>&1) & pids+=($!)
for port in 3100 3200; do
  for _ in $(seq 1 60); do curl -fs -o /dev/null "http://localhost:$port/" && break; sleep 0.5; done
done
# Warm up like a CDN would: render each page once and request every optimized image it references,
# so the measurement isn't dominated by first-request image resizing (cached at the edge on Vercel).
for url in $(node -e 'console.log(require("./lighthouserc.json").ci.collect.url.join(" "))'); do
  origin=$(echo "$url" | grep -oE '^https?://[^/]+')
  for img in $(curl -fs "$url" | grep -oE '/_next/image\?[^" ]+' | sed 's/&amp;/\&/g' | sort -u); do
    curl -fs -o /dev/null "$origin$img" || true
  done
done
CHROME_PATH=$(cd apps/index && node -e 'console.log(require("@playwright/test").chromium.executablePath())')
export CHROME_PATH
pnpm exec lhci collect && pnpm exec lhci assert && pnpm exec lhci upload
