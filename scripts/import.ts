// Import curated (or scraped, as fallback) paint JSON into Convex by invoking
// the internal mutation `admin:bulkImport` through `npx convex run`.
//
// Usage:
//   npx tsx scripts/import.ts            # uses dev deployment
//   npx tsx scripts/import.ts --prod     # uses prod deployment
//
// Reads, per brand, the first of:
//   data/curated/<brand>.json
//   data/scraped/<brand>.json
// Skips brands with no file.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const BRANDS = [
  "citadel",
  "vallejo",
  "ak-interactive",
  "kimera",
  "proacryl",
  "army-painter",
];

const useProd = process.argv.includes("--prod");

function pickFile(brand: string): string | null {
  const curated = resolve(process.cwd(), "data", "curated", `${brand}.json`);
  const scraped = resolve(process.cwd(), "data", "scraped", `${brand}.json`);
  if (existsSync(curated)) return curated;
  if (existsSync(scraped)) return scraped;
  return null;
}

const BATCH_SIZE = 50;

function importBrand(brand: string) {
  const file = pickFile(brand);
  if (!file) {
    console.log(`${brand}: no data file found, skipping`);
    return;
  }
  let paints: unknown;
  try {
    paints = JSON.parse(readFileSync(file, "utf-8"));
  } catch (err) {
    console.error(`${brand}: failed to parse ${file}:`, err);
    return;
  }
  if (!Array.isArray(paints) || paints.length === 0) {
    console.log(`${brand}: ${file} is empty, skipping`);
    return;
  }

  let totalInserted = 0;
  let totalUpdated = 0;

  // Split into batches to stay within Convex's per-mutation argument size and execution time limits.
  for (let i = 0; i < paints.length; i += BATCH_SIZE) {
    const batch = paints.slice(i, i + BATCH_SIZE);
    const args = JSON.stringify({ paints: batch });
    const cliArgs = ["convex", "run", "admin:bulkImport", args];
    if (useProd) cliArgs.push("--prod");

    const res = spawnSync("npx", cliArgs, { encoding: "utf-8", timeout: 60_000 });
    if (res.status === null) {
      console.error(`${brand}: batch ${Math.floor(i / BATCH_SIZE) + 1} timed out (60s)`);
      return;
    }
    if (res.status !== 0) {
      console.error(
        `${brand}: convex run failed (batch ${Math.floor(i / BATCH_SIZE) + 1}, code ${res.status})\n${res.stderr || res.stdout}`,
      );
      return;
    }
    try {
      const parsed = JSON.parse((res.stdout || "").trim());
      totalInserted += parsed.inserted ?? 0;
      totalUpdated += parsed.updated ?? 0;
    } catch {
      console.warn(`${brand}: could not parse convex run output for batch ${Math.floor(i / BATCH_SIZE) + 1} — counts may be inaccurate. stdout: ${(res.stdout || "").trim()}`);
    }
  }

  console.log(`${brand}: ${totalInserted} inserted, ${totalUpdated} updated, ${paints.length} total (from ${file.split("/").slice(-2).join("/")})`);
}

for (const brand of BRANDS) {
  importBrand(brand);
}
