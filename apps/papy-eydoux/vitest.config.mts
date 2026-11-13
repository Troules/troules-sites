import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests only; Playwright owns e2e/. The alias mirrors tsconfig's "@/*" so timeline.ts (and its .webp imports,
// which Vite resolves as plain asset URLs) can be loaded in tests.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.{ts,tsx}"] },
});
