import { describe, expect, it } from "vitest";
import { securityHeaders, withTroules } from "./index.js";

describe("withTroules", () => {
  it("adds security headers on every route and keeps user headers", async () => {
    const cfg = withTroules({ headers: async () => [{ source: "/x", headers: [{ key: "A", value: "b" }] }] });
    const h = await cfg.headers();
    expect(h[0]).toEqual({ source: "/:path*", headers: securityHeaders });
    expect(h[1].source).toBe("/x");
  });

  it("enables the React Compiler and transpiles workspace packages", () => {
    const cfg = withTroules({ transpilePackages: ["foo"] });
    expect(cfg.reactCompiler).toBe(true);
    expect(cfg.poweredByHeader).toBe(false);
    expect(cfg.transpilePackages).toEqual(["@troules/ui", "@troules/registry", "foo"]);
  });

  it("forbids framing", () => {
    const csp = securityHeaders.find((h) => h.key === "Content-Security-Policy").value;
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
