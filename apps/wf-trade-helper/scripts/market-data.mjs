// Writes src/generated/market.json, the one market file the site reads (lib/market.ts). Runs before `next dev` and
// `next build`. Sources, first match wins (ADR 0009):
//   1. Supabase: WF_SUPABASE_URL + WF_SUPABASE_KEY (publishable key; Vercel env vars). The daily sweep on the VM
//      uploads a snapshot and calls a deploy hook, so every production build downloads it exactly once.
//   2. WF_DATA_DIR/market.json: the full local catalog from `pnpm fixtures:full` (.env.development.local).
//   3. src/fixtures/market.json: the committed sample (CI, e2e, Lighthouse).
// A Supabase error fails the build on purpose: the last good deployment stays live instead of a sample one.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "src/generated/market.json");
const STALE_DAYS = 3;

mkdirSync(dirname(out), { recursive: true });

const { WF_SUPABASE_URL: url, WF_SUPABASE_KEY: key, WF_DATA_DIR: dir } = process.env;

if (url && key) {
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/snapshot?name=eq.market&select=taken_at,body`, {
    headers: { apikey: key, "accept-profile": "wf", accept: "application/vnd.pgrst.object+json" },
  });
  if (!res.ok) throw new Error(`Supabase snapshot: HTTP ${res.status} ${await res.text()}`);
  const { taken_at: takenAt, body } = await res.json();
  if (!Array.isArray(body?.summaries) || !body.history) throw new Error("Supabase snapshot: unexpected shape");
  const age = (Date.now() - Date.parse(takenAt)) / 86_400_000;
  if (age > STALE_DAYS) console.warn(`market-data: the Supabase snapshot is ${age.toFixed(1)} days old`);
  writeFileSync(out, JSON.stringify({ ...body, source: "supabase" }));
  console.warn(`market-data: Supabase snapshot from ${takenAt}, ${Object.keys(body.history).length} items`);
} else if (dir) {
  const market = JSON.parse(readFileSync(resolve(root, dir, "market.json"), "utf8"));
  writeFileSync(out, JSON.stringify({ ...market, source: "local" }));
  console.warn(`market-data: ${dir}, ${Object.keys(market.history).length} items`);
} else {
  copyFileSync(resolve(root, "src/fixtures/market.json"), out);
  console.warn("market-data: committed sample");
}
