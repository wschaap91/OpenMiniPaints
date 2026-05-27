// Citadel (Games Workshop) paint scraper.
//
// TODO: find a stable machine-readable source. The Games Workshop site is
// JS-rendered behind Cloudflare; the citadelcolour.com paint app loads
// `assets/data/paints.json` style payloads but the URL is not stable.
// For now we attempt a fetch then fall back to a curated seed sample.

import { Paint, tryFetch, writeScraped } from "./_common";

const SOURCE_URL =
  "https://www.warhammer.com/app/resources/catalog/product/citadel-colour-paints.json";

const SEED: Paint[] = [
  { brand: "Citadel", name: "Abaddon Black", paintType: "base", hexColor: "#231f20", brandCode: "21-25", finish: "matte" },
  { brand: "Citadel", name: "Mephiston Red", paintType: "base", hexColor: "#9a1115", brandCode: "21-03", finish: "matte" },
  { brand: "Citadel", name: "Macragge Blue", paintType: "base", hexColor: "#143d7c", brandCode: "21-08", finish: "matte" },
  { brand: "Citadel", name: "Caliban Green", paintType: "base", hexColor: "#04401b", brandCode: "21-13", finish: "matte" },
  { brand: "Citadel", name: "Averland Sunset", paintType: "base", hexColor: "#ffb71a", brandCode: "21-09", finish: "matte" },
  { brand: "Citadel", name: "Rakarth Flesh", paintType: "base", hexColor: "#b9a380", brandCode: "21-23", finish: "matte" },
  { brand: "Citadel", name: "Zandri Dust", paintType: "base", hexColor: "#b8a373", brandCode: "21-31", finish: "matte" },
  { brand: "Citadel", name: "Bugmans Glow", paintType: "base", hexColor: "#80422c", brandCode: "21-30", finish: "matte" },
  { brand: "Citadel", name: "White Scar", paintType: "layer", hexColor: "#f0f0f0", brandCode: "22-57", finish: "matte" },
  { brand: "Citadel", name: "Evil Sunz Scarlet", paintType: "layer", hexColor: "#c81c1c", brandCode: "22-05", finish: "matte" },
  { brand: "Citadel", name: "Wild Rider Red", paintType: "layer", hexColor: "#ed3d23", brandCode: "22-06", finish: "matte" },
  { brand: "Citadel", name: "Yriel Yellow", paintType: "layer", hexColor: "#ffcc11", brandCode: "22-11", finish: "matte" },
  { brand: "Citadel", name: "Teclis Blue", paintType: "layer", hexColor: "#1660b3", brandCode: "22-17", finish: "matte" },
  { brand: "Citadel", name: "Moot Green", paintType: "layer", hexColor: "#15a64e", brandCode: "22-25", finish: "matte" },
  { brand: "Citadel", name: "Nuln Oil", paintType: "shade", hexColor: "#1a1a1a", brandCode: "24-14", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Agrax Earthshade", paintType: "shade", hexColor: "#3a2814", brandCode: "24-15", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Reikland Fleshshade", paintType: "shade", hexColor: "#8a4a2c", brandCode: "24-24", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Druchii Violet", paintType: "shade", hexColor: "#3b1a4a", brandCode: "24-16", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Leadbelcher", paintType: "base", hexColor: "#6a6f72", brandCode: "21-28", finish: "metallic", specialType: "metallic" },
  { brand: "Citadel", name: "Retributor Armour", paintType: "base", hexColor: "#a37a2c", brandCode: "21-53", finish: "metallic", specialType: "metallic" },
];

async function main() {
  const html = await tryFetch(SOURCE_URL);
  if (html) {
    try {
      const data = JSON.parse(html);
      if (Array.isArray(data) && data.length > 0) {
        const paints: Paint[] = data.map((row: any) => ({
          brand: "Citadel",
          name: String(row.name ?? row.title ?? "").trim(),
          paintType: String(row.type ?? row.category ?? "base").toLowerCase(),
          hexColor: row.hex ?? row.color,
          brandCode: row.code ?? row.sku,
          barcode: row.barcode ?? row.ean,
        })).filter((p) => p.name);
        if (paints.length > 0) {
          writeScraped("citadel", paints, "live");
          return;
        }
      }
    } catch {
      // fall through to seed
    }
  }
  writeScraped("citadel", SEED, "seed");
}

main().catch((err) => {
  console.error("citadel scraper failed:", err);
  process.exit(1);
});
