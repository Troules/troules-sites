// Next.js apps: Next's Core Web Vitals + TypeScript presets (they register react, react-hooks,
// jsx-a11y, @next/next and @typescript-eslint), then our rules, then prettier last.
import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { ignores, rules, prettier } from "./base.js";

export default defineConfig([
  ignores,
  ...nextVitals,
  ...nextTs,
  rules,
  {
    rules: {
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "react/no-danger": "warn",
    },
  },
  prettier,
]);
