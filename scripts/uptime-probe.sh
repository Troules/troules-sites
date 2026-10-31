#!/usr/bin/env bash
# Probes each production site: HTTPS 200 within 10 s and an expected marker in the HTML.
# Exit 1 if any site fails. Add a line per site.
set -u
fail=0
probe() {
  local url=$1 marker=$2 body code
  body=$(curl -sS -L --max-time 10 -w '\n%{http_code}' "$url") || { echo "FAIL $url: no response"; fail=1; return; }
  code=${body##*$'\n'}
  if [ "$code" != 200 ]; then echo "FAIL $url: HTTP $code"; fail=1
  elif ! grep -q "$marker" <<<"$body"; then echo "FAIL $url: marker '$marker' missing"; fail=1
  else echo "OK   $url"; fi
}
probe "https://troules.dynv6.net/" "Troules"
probe "https://blog.troules.dynv6.net/" "Field notes"
probe "https://blog.troules.dynv6.net/feed.xml" "<rss"
exit $fail
