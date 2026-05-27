import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { extractHex } from "./_color.ts";
import type { Paint } from "../scrape/_common.ts";

const KNOWN_BRANDS = ["citadel", "vallejo", "ak-interactive", "kimera", "proacryl", "army-painter"];

function sanitizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function downloadImage(url: string, dest: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(`  download failed (${res.status}): ${url}`);
      return false;
    }
    const buf = await res.arrayBuffer();
    writeFileSync(dest, Buffer.from(buf));
    return true;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      console.warn(`  download timed out: ${url}`);
    } else {
      console.warn(`  download error: ${e}`);
    }
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function processBrand(brand: string): Promise<void> {
  const scrapedPath = resolve(process.cwd(), "data", "scraped", `${brand}.json`);
  if (!existsSync(scrapedPath)) {
    console.warn(`[${brand}] scraped file not found, skipping`);
    return;
  }
  let paints: Paint[];
  try {
    paints = JSON.parse(readFileSync(scrapedPath, "utf8"));
  } catch (err) {
    console.error(`[${brand}] failed to parse scraped file:`, err);
    return;
  }
  const imagesDir = resolve(process.cwd(), "data", "images", brand);
  mkdirSync(imagesDir, { recursive: true });

  const enriched: Paint[] = [];
  for (const paint of paints) {
    if (!paint.imageUrl) {
      console.log(`[${brand}] ${paint.name}: skipped (no imageUrl)`);
      enriched.push(paint);
      continue;
    }
    if (paint.hexColor) {
      // Already has hex — pass through
      console.log(`[${brand}] ${paint.name}: already has hex ${paint.hexColor}`);
      enriched.push(paint);
      continue;
    }
    const dest = resolve(imagesDir, `${sanitizeName(paint.name)}.jpg`);
    let downloaded = false;
    if (existsSync(dest)) {
      console.log(`[${brand}] ${paint.name}: cached`);
      downloaded = true;
    } else {
      downloaded = await downloadImage(paint.imageUrl, dest);
      if (downloaded) console.log(`[${brand}] ${paint.name}: downloaded`);
    }
    if (!downloaded) {
      enriched.push(paint);
      continue;
    }
    const hex = await extractHex(dest, { name: paint.name, brand: paint.brand, imageUrl: paint.imageUrl });
    if (hex) {
      console.log(`[${brand}] ${paint.name}: hex ${hex}`);
      enriched.push({ ...paint, hexColor: hex });
    } else {
      console.log(`[${brand}] ${paint.name}: vision null`);
      enriched.push(paint);
    }
  }

  const curatedPath = resolve(process.cwd(), "data", "curated", `${brand}.json`);
  mkdirSync(dirname(curatedPath), { recursive: true });
  writeFileSync(curatedPath, JSON.stringify(enriched, null, 2));
  console.log(`[${brand}] wrote ${enriched.length} paints to data/curated/${brand}.json`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const brandIdx = args.indexOf("--brand");
  const brands = brandIdx !== -1
    ? [args[brandIdx + 1]]
    : KNOWN_BRANDS;

  if (brandIdx !== -1 && !KNOWN_BRANDS.includes(brands[0])) {
    console.error(`Unknown brand: ${brands[0]}. Known: ${KNOWN_BRANDS.join(", ")}`);
    process.exit(1);
  }

  for (const brand of brands) {
    await processBrand(brand);
  }
}

main().catch((err) => {
  console.error("hex-extractor failed:", err);
  process.exit(1);
});
