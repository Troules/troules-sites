import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests only; Playwright owns e2e/ and `python3 -m unittest` owns sweeper/.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.{ts,tsx}"] },
});
