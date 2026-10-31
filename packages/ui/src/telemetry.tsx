import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/** Vercel Web Analytics (cookieless) + Speed Insights (real-user Core Web Vitals). Free on Hobby within quotas. */
export function Telemetry() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
