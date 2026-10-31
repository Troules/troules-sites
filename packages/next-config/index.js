// Shared Next.js config for every Troules site. Plain JS (with JSDoc types) so next.config.ts can import it
// without a TypeScript loader for workspace packages.

/** Security headers sent on every route. CSP is kept to directives that work with static pages
 *  (no nonce): framing, base-uri, form-action, object-src. Script CSP would need per-request nonces. */
export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/**
 * @param {import("next").NextConfig} config
 * @returns {import("next").NextConfig}
 */
export function withTroules(config = {}) {
  const userHeaders = config.headers;
  return {
    reactCompiler: true,
    cacheComponents: true,
    partialPrefetching: true,
    poweredByHeader: false,
    ...config,
    transpilePackages: ["@troules/ui", "@troules/registry", ...(config.transpilePackages ?? [])],
    turbopack: {
      ...config.turbopack,
      rules: {
        "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
        ...config.turbopack?.rules,
      },
    },
    async headers() {
      const extra = userHeaders ? await userHeaders() : [];
      return [{ source: "/:path*", headers: securityHeaders }, ...extra];
    },
  };
}
