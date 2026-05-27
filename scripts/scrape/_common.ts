// Shared helpers for brand scrape scripts.
//
// Each brand scraper attempts a real fetch against a public URL with a short
// timeout, then falls back to a hardcoded seed list if anything goes wrong.
// Output is always written to `data/scraped/<brand>.json` with the same
// schema as `convex/admin.ts#bulkImport` expects.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type PaintType =
  | "base"
  | "layer"
  | "shade"
  | "contrast"
  | "dry"
  | "technical"
  | "model-color"
  | "game-color"
  | "model-air"
  | "3rd-gen"
  | "pure-pigment"
  | "metallic"
  | "complementary"
  | "transparent"
  | "white"
  | "black"
  | "acrylic"
  | "warpaints-fanatic"
  | "speedpaint";

export type Finish = "matte" | "satin" | "metallic";

export type Transparency = "translucent" | "transparent";

export type SpecialType = "metallic";

export interface Paint {
  brand: string;
  name: string;
  paintType: PaintType;
  hexColor?: string;
  brandCode?: string;
  barcode?: string;
  transparency?: Transparency;
  finish?: Finish;
  specialType?: SpecialType;
  imageUrl?: string;
}

export const FETCH_TIMEOUT_MS = 10_000;

/**
 * Best-effort fetch with a hard timeout. Returns null on any failure so the
 * caller can transparently fall back to seed data.
 */
export async function tryFetch(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "OpenMiniPaints-Scraper/0.1 (+https://github.com/openminipaints)",
        Accept: "text/html,application/json,*/*",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Write a JSON file under data/scraped/<slug>.json and log a summary line.
 */
export function writeScraped(slug: string, paints: Paint[], source: "live" | "seed") {
  const outPath = resolve(process.cwd(), "data", "scraped", `${slug}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(paints, null, 2));
  const brand = paints[0]?.brand ?? slug;
  const withImageUrl = paints.filter((p) => p.imageUrl != null).length;
  const withHexColor = paints.filter((p) => p.hexColor != null).length;
  console.log(
    `${brand}: ${paints.length} paints written to data/scraped/${slug}.json` +
      ` (${withImageUrl} with imageUrl, ${withHexColor} with hexColor)` +
      ` (source: ${source})`,
  );
}
