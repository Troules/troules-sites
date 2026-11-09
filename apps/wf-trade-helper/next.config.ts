import type { NextConfig } from "next";
import { withTroules } from "@troules/next-config";

const nextConfig: NextConfig = withTroules({
  // lib/market.ts reads the market file from disk (a path built at runtime, which tracing can't follow), so ship it
  // with every server function that may re-render a page.
  outputFileTracingIncludes: { "/*": ["src/generated/market.json"] },
});

export default nextConfig;
