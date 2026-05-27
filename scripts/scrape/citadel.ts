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
  // --- base ---
  { brand: "Citadel", name: "Abaddon Black", paintType: "base", hexColor: "#231f20", brandCode: "21-25", finish: "matte" },
  { brand: "Citadel", name: "Mephiston Red", paintType: "base", hexColor: "#9a1115", brandCode: "21-03", finish: "matte" },
  { brand: "Citadel", name: "Macragge Blue", paintType: "base", hexColor: "#143d7c", brandCode: "21-08", finish: "matte" },
  { brand: "Citadel", name: "Caliban Green", paintType: "base", hexColor: "#04401b", brandCode: "21-13", finish: "matte" },
  { brand: "Citadel", name: "Averland Sunset", paintType: "base", hexColor: "#ffb71a", brandCode: "21-09", finish: "matte" },
  { brand: "Citadel", name: "Rakarth Flesh", paintType: "base", hexColor: "#b9a380", brandCode: "21-23", finish: "matte" },
  { brand: "Citadel", name: "Zandri Dust", paintType: "base", hexColor: "#b8a373", brandCode: "21-31", finish: "matte" },
  { brand: "Citadel", name: "Bugmans Glow", paintType: "base", hexColor: "#80422c", brandCode: "21-30", finish: "matte" },
  { brand: "Citadel", name: "Leadbelcher", paintType: "base", hexColor: "#6a6f72", brandCode: "21-28", finish: "metallic", specialType: "metallic" },
  { brand: "Citadel", name: "Retributor Armour", paintType: "base", hexColor: "#a37a2c", brandCode: "21-53", finish: "metallic", specialType: "metallic" },
  { brand: "Citadel", name: "Corax White", paintType: "base", hexColor: "#e8e8e8", brandCode: "21-52", finish: "matte" },
  { brand: "Citadel", name: "Khorne Red", paintType: "base", hexColor: "#6b0b0b", brandCode: "21-04", finish: "matte" },
  { brand: "Citadel", name: "Kantor Blue", paintType: "base", hexColor: "#0f2851", brandCode: "21-07", finish: "matte" },
  { brand: "Citadel", name: "Waaagh! Flesh", paintType: "base", hexColor: "#255c38", brandCode: "21-12", finish: "matte" },
  { brand: "Citadel", name: "Castellan Green", paintType: "base", hexColor: "#245d3e", brandCode: "21-15", finish: "matte" },
  { brand: "Citadel", name: "Death Guard Green", paintType: "base", hexColor: "#8b9a5e", brandCode: "21-43", finish: "matte" },
  { brand: "Citadel", name: "Wraithbone", paintType: "base", hexColor: "#e8d8b0", brandCode: "21-63", finish: "matte" },
  { brand: "Citadel", name: "Deathworld Forest", paintType: "base", hexColor: "#4e5f38", brandCode: "21-22", finish: "matte" },
  { brand: "Citadel", name: "Screamer Pink", paintType: "base", hexColor: "#7b1d4c", brandCode: "21-26", finish: "matte" },
  { brand: "Citadel", name: "Celestra Grey", paintType: "base", hexColor: "#99a8a0", brandCode: "21-29", finish: "matte" },
  // --- layer ---
  { brand: "Citadel", name: "White Scar", paintType: "layer", hexColor: "#f0f0f0", brandCode: "22-57", finish: "matte" },
  { brand: "Citadel", name: "Evil Sunz Scarlet", paintType: "layer", hexColor: "#c81c1c", brandCode: "22-05", finish: "matte" },
  { brand: "Citadel", name: "Wild Rider Red", paintType: "layer", hexColor: "#ed3d23", brandCode: "22-06", finish: "matte" },
  { brand: "Citadel", name: "Yriel Yellow", paintType: "layer", hexColor: "#ffcc11", brandCode: "22-11", finish: "matte" },
  { brand: "Citadel", name: "Teclis Blue", paintType: "layer", hexColor: "#1660b3", brandCode: "22-17", finish: "matte" },
  { brand: "Citadel", name: "Moot Green", paintType: "layer", hexColor: "#15a64e", brandCode: "22-25", finish: "matte" },
  { brand: "Citadel", name: "Ushabti Bone", paintType: "layer", hexColor: "#d4b887", brandCode: "22-45", finish: "matte" },
  { brand: "Citadel", name: "Kislev Flesh", paintType: "layer", hexColor: "#d4956e", brandCode: "22-47", finish: "matte" },
  { brand: "Citadel", name: "Dawnstone", paintType: "layer", hexColor: "#7a8278", brandCode: "22-42", finish: "matte" },
  { brand: "Citadel", name: "Administratum Grey", paintType: "layer", hexColor: "#9fa8a0", brandCode: "22-43", finish: "matte" },
  { brand: "Citadel", name: "Skrag Brown", paintType: "layer", hexColor: "#884a2b", brandCode: "22-35", finish: "matte" },
  { brand: "Citadel", name: "Tau Light Ochre", paintType: "layer", hexColor: "#c88033", brandCode: "22-12", finish: "matte" },
  { brand: "Citadel", name: "Elysian Green", paintType: "layer", hexColor: "#5d8a4e", brandCode: "22-26", finish: "matte" },
  { brand: "Citadel", name: "Kabalite Green", paintType: "layer", hexColor: "#2a6e50", brandCode: "22-27", finish: "matte" },
  { brand: "Citadel", name: "Sotek Green", paintType: "layer", hexColor: "#1a7060", brandCode: "22-18", finish: "matte" },
  { brand: "Citadel", name: "Calgar Blue", paintType: "layer", hexColor: "#4e6ea8", brandCode: "22-16", finish: "matte" },
  // --- shade ---
  { brand: "Citadel", name: "Nuln Oil", paintType: "shade", hexColor: "#1a1a1a", brandCode: "24-14", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Agrax Earthshade", paintType: "shade", hexColor: "#3a2814", brandCode: "24-15", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Reikland Fleshshade", paintType: "shade", hexColor: "#8a4a2c", brandCode: "24-24", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Druchii Violet", paintType: "shade", hexColor: "#3b1a4a", brandCode: "24-16", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Biel-Tan Green", paintType: "shade", hexColor: "#1a5040", brandCode: "24-20", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Drakenhof Nightshade", paintType: "shade", hexColor: "#1a2860", brandCode: "24-17", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Fuegan Orange", paintType: "shade", hexColor: "#cc4400", brandCode: "24-22", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Carroburg Crimson", paintType: "shade", hexColor: "#6b1833", brandCode: "24-13", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Seraphim Sepia", paintType: "shade", hexColor: "#8b6030", brandCode: "24-19", finish: "satin", transparency: "translucent" },
  // --- contrast ---
  { brand: "Citadel", name: "Basilicanum Grey", paintType: "contrast", hexColor: "#383838", brandCode: "29-37", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Black Templar", paintType: "contrast", hexColor: "#0a0a14", brandCode: "29-38", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Blood Angels Red", paintType: "contrast", hexColor: "#881818", brandCode: "29-12", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Ultramarines Blue", paintType: "contrast", hexColor: "#1a3880", brandCode: "29-18", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Ork Flesh", paintType: "contrast", hexColor: "#3a7830", brandCode: "29-22", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Skeleton Horde", paintType: "contrast", hexColor: "#c8a84e", brandCode: "29-30", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Space Wolves Grey", paintType: "contrast", hexColor: "#606878", brandCode: "29-40", finish: "satin", transparency: "translucent" },
  { brand: "Citadel", name: "Nazdreg Yellow", paintType: "contrast", hexColor: "#e8b800", brandCode: "29-10", finish: "satin", transparency: "translucent" },
  // --- dry ---
  { brand: "Citadel", name: "Praxeti White", paintType: "dry", hexColor: "#f0f0e8", brandCode: "23-03", finish: "matte" },
  { brand: "Citadel", name: "Longbeard Grey", paintType: "dry", hexColor: "#c0c4c0", brandCode: "23-06", finish: "matte" },
  { brand: "Citadel", name: "Tyrant Skull", paintType: "dry", hexColor: "#d8c888", brandCode: "23-12", finish: "matte" },
  { brand: "Citadel", name: "Necron Compound", paintType: "dry", hexColor: "#888888", brandCode: "23-09", finish: "matte" },
  { brand: "Citadel", name: "Niblet Green", paintType: "dry", hexColor: "#48a848", brandCode: "23-24", finish: "matte" },
  // --- technical ---
  { brand: "Citadel", name: "Astrogranite", paintType: "technical", hexColor: "#505858", brandCode: "27-32", finish: "matte" },
  { brand: "Citadel", name: "Agrellan Earth", paintType: "technical", hexColor: "#887850", brandCode: "27-25", finish: "matte" },
  { brand: "Citadel", name: "Typhus Corrosion", paintType: "technical", hexColor: "#384030", brandCode: "27-02", finish: "matte" },
  { brand: "Citadel", name: "Blood for the Blood God", paintType: "technical", hexColor: "#880000", brandCode: "27-07", finish: "satin", transparency: "translucent" },
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
