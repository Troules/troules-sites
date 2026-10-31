# 0007. Domains: one dynv6 zone, records point at Vercel

- Status: accepted
- Date: 2026-10-31

## Decision

- Zone `troules.dynv6.net` (free dynv6). `dynv6.net` is on the Public Suffix List, so `troules.dynv6.net` behaves
  like a registrable domain (own cookies scope, own certificate rate limits).
- Apex `troules.dynv6.net` → index project (A record; the zone's IPv4 address); `blog.troules.dynv6.net` → blog
  project (CNAME). **Use the values Vercel shows in Project › Domains**, which may differ from the generic ones.
- New site = one CNAME `<name>.troules.dynv6.net` + one domain in its Vercel project.
- Vercel issues the TLS certificates. HSTS `includeSubDomains` (no preload: dynv6 controls the parent).
- The dynv6 token is account-wide, so it stays in KeePass; Hermes never gets DNS access.

## Consequences

If dynv6 goes away, the sites stay reachable on `*.vercel.app`; moving to a paid domain = new records + Vercel domains.
