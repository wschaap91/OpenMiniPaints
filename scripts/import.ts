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

  const args = JSON.stringify({ paints });
  const cliArgs = ["convex", "run", "admin:bulkImport", args];
  if (useProd) cliArgs.push("--prod");

  const res = spawnSync("npx", cliArgs, { encoding: "utf-8" });
  if (res.status !== 0) {
    console.error(
      `${brand}: convex run failed (code ${res.status})\n${res.stderr || res.stdout}`,
    );
    return;
  }
  // `npx convex run` prints the mutation return value as JSON on stdout.
  const out = (res.stdout || "").trim();
  let summary = out;
  try {
    const parsed = JSON.parse(out);
    summary = `${parsed.inserted} inserted, ${parsed.updated} updated, ${parsed.total} total`;
  } catch {
    // keep raw output
  }
  console.log(`${brand}: ${summary} (from ${file.split("/").slice(-2).join("/")})`);
}

for (const brand of BRANDS) {
  importBrand(brand);
}
