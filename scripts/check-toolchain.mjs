// Fails when the installed TypeScript or ESLint is outside the range our lint plugins support.
// pnpm doesn't flag these (the peers are optional), and an unsupported major can break in odd ways:
// TypeScript 7.0.2 (Dependabot PR #2) made `tsc` lose Next's global PageProps types with parallel checkers.
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

// Locate packages through pnpm's node_modules layout (some packages don't export ./package.json).
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dirIn = (base, name) => {
  const d = join(base, "node_modules", name);
  return existsSync(d) ? realpathSync(d) : null;
};
const manifest = (dir) => JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
const configDir = join(root, "packages/eslint-config");
const nextConfigDir = dirIn(configDir, "eslint-config-next");
// A dependency of eslint-config-next sits next to it in pnpm's virtual store.
const pluginDir = (name) =>
  dirIn(configDir, name) ??
  (existsSync(join(dirname(nextConfigDir), name)) ? join(dirname(nextConfigDir), name) : null);
const peerRange = (plugin, peer) => {
  const d = pluginDir(plugin);
  if (!d) throw new Error(`cannot resolve ${plugin}`);
  return manifest(d).peerDependencies?.[peer];
};
const appDir = join(root, "apps/blog");
const version = (name) => manifest(dirIn(appDir, name)).version;

const installed = { typescript: version("typescript"), eslint: version("eslint") };
const checks = [
  ["typescript-eslint", "typescript"],
  ["typescript-eslint", "eslint"],
  ["eslint-plugin-react", "eslint"],
  ["eslint-plugin-jsx-a11y", "eslint"],
  ["eslint-plugin-react-hooks", "eslint"],
];
let failed = 0;
for (const [plugin, peer] of checks) {
  const range = peerRange(plugin, peer);
  const ok = !range || semver.satisfies(installed[peer], range, { includePrerelease: true });
  console[ok ? "log" : "error"](
    `${ok ? "ok  " : "FAIL"} ${peer}@${installed[peer]} for ${plugin} (${range ?? "no range"})`,
  );
  if (!ok) failed++;
}
process.exit(failed ? 1 : 0);
