// Shared rules for every package. Expects the @typescript-eslint plugin to be registered
// (by eslint-config-next/typescript in apps, by typescript-eslint in libraries).
import { globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";

export const ignores = globalIgnores([
  ".next/**",
  "out/**",
  "build/**",
  "coverage/**",
  "next-env.d.ts",
  "playwright-report/**",
  "test-results/**",
]);

export const rules = {
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/consistent-type-imports": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    eqeqeq: ["error", "smart"],
  },
};

export { prettier };
