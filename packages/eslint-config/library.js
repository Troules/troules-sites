// Plain TypeScript/React packages (packages/*).
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import { ignores, rules, prettier } from "./base.js";

export default defineConfig([ignores, ...tseslint.configs.recommended, rules, prettier]);
