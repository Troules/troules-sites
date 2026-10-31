# 0006. Monitoring on free tiers

- Status: accepted
- Date: 2026-10-31

## Decision

| Signal                    | Tool                                                                                                            | Cost                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Traffic (cookieless)      | Vercel Web Analytics (`@troules/ui/telemetry`)                                                                  | Hobby: 50k events/month |
| Real-user Core Web Vitals | Vercel Speed Insights                                                                                           | Hobby free tier         |
| Availability + content    | `uptime.yml`: every 30 min, HTTPS 200 + marker per site → GitHub issue `uptime` (+ ntfy if `NTFY_TOPIC` secret) | free (public repo)      |
| Build / deploy failures   | Vercel commit statuses + GitHub notifications                                                                   | free                    |
| Lab performance budget    | Lighthouse in CI                                                                                                | free                    |

Both Analytics and Speed Insights must be enabled once per Vercel project (dashboard toggle).

## Not now

Sentry (free 5k errors/month) would add an account, a DSN and a client SDK for sites that have almost no client
logic. Revisit when a site gets real client-side behaviour or server functions.
