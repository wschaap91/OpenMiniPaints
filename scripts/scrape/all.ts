// Run every brand scraper sequentially.
// Usage: `npx tsx scripts/scrape/all.ts`

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const brands = [
  "citadel",
  "vallejo",
  "ak-interactive",
  "kimera",
  "proacryl",
  "army-painter",
];

for (const brand of brands) {
  const file = resolve(process.cwd(), "scripts", "scrape", `${brand}.ts`);
  const res = spawnSync("npx", ["tsx", file], { stdio: "inherit" });
  if (res.status !== 0) {
    console.error(`[all] ${brand} failed with code ${res.status}`);
  }
}
