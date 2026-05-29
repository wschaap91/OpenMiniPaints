// Army Painter (Warpaints Fanatic + Speedpaint 2.0) scraper.
//
// TODO: thearmypainter.com is a Shopify store; product JSON is available at
// /products/<handle>.json. Live scraping is attempted; falls back to a curated
// seed sample covering Warpaints Fanatic and Speedpaint 2.0.

import { Paint, PaintType, tryFetch, writeScraped } from "./_common";

const SOURCE_URL =
  "https://www.thearmypainter.com/collections/warpaints-fanatic/products.json?limit=250";

/**
 * Maps known Shopify product title prefixes to a range name and paintType.
 * Entries are matched in longest-first order to prevent shorter prefixes
 * (e.g. "Warpaints Fanatic") from eating longer ones
 * (e.g. "Warpaints Fanatic Metallic").
 */
const RANGE_PREFIX_MAP: Array<{
  prefix: string;
  range: string;
  paintType: PaintType;
}> = [
  { prefix: "Warpaints Fanatic Metallic", range: "Warpaints Fanatic Metallic", paintType: "metallic" },
  { prefix: "Warpaints Fanatic Effects",  range: "Warpaints Fanatic Effects",  paintType: "effects"  },
  { prefix: "Warpaints Fanatic Wash",     range: "Warpaints Fanatic Wash",     paintType: "wash"     },
  { prefix: "Warpaints Fanatic",          range: "Warpaints Fanatic",          paintType: "acrylic"  },
  { prefix: "Speedpaint 2.0",            range: "Speedpaint 2.0",            paintType: "speedpaint" },
  { prefix: "John Blanche Masterclass",   range: "John Blanche Masterclass",   paintType: "acrylic"  },
  { prefix: "Flexible Triad",             range: "Flexible Triad",             paintType: "set"      },
  { prefix: "Historical",                 range: "Historical",                 paintType: "acrylic"  },
];

/**
 * Parse a raw Shopify product title into a clean name, range, and paintType.
 *
 * Normal case: "Warpaints Fanatic Metallic: Gun Metal"
 *   → { range: "Warpaints Fanatic Metallic", name: "Gun Metal", paintType: "metallic" }
 *
 * No-colon special case: "Warpaints Fanatic Most Wanted Set"
 *   → { range: "Warpaints Fanatic", name: "Warpaints Fanatic Most Wanted Set", paintType: "set" }
 *   (name is left unchanged; the first matching prefix determines range/paintType)
 */
export function extractRangeFromName(rawName: string): {
  range: string;
  name: string;
  paintType: PaintType;
} {
  const colonIdx = rawName.indexOf(": ");
  if (colonIdx !== -1) {
    const prefix = rawName.slice(0, colonIdx).trim();
    const cleanName = rawName.slice(colonIdx + 2).trim();
    const match = RANGE_PREFIX_MAP.find((entry) => entry.prefix === prefix);
    if (match) {
      return { range: match.range, name: cleanName, paintType: match.paintType };
    }
    // Unknown prefix — fall through and return raw as name with no range matched
    return { range: prefix, name: cleanName, paintType: "acrylic" };
  }

  // No colon — check if the name *starts with* a known prefix (e.g. sets)
  // Match longest prefix first (RANGE_PREFIX_MAP is already sorted longest-first).
  const prefixMatch = RANGE_PREFIX_MAP.find((entry) =>
    rawName.startsWith(entry.prefix)
  );
  if (prefixMatch) {
    // Names without a colon that end with "Set" are product bundles, not individual
    // paints. Override paintType to "set" regardless of what the prefix map says.
    const paintType = rawName.endsWith(" Set") ? "set" : prefixMatch.paintType;
    return { range: prefixMatch.range, name: rawName, paintType };
  }

  // Completely unknown — return as-is
  return { range: "", name: rawName, paintType: "acrylic" };
}

const SEED: Paint[] = [
  // Warpaints Fanatic — acrylic
  { brand: "Army Painter", name: "Matt Black",        range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#0a0a0a", brandCode: "WP1101", finish: "matte" },
  { brand: "Army Painter", name: "Matt White",        range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#f5f5f5", brandCode: "WP1102", finish: "matte" },
  { brand: "Army Painter", name: "Pure Red",          range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#c81a1a", brandCode: "WP1115", finish: "matte" },
  { brand: "Army Painter", name: "Dragon Red",        range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#a01818", brandCode: "WP1116", finish: "matte" },
  { brand: "Army Painter", name: "Lava Orange",       range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#ec5a1a", brandCode: "WP1124", finish: "matte" },
  { brand: "Army Painter", name: "Daemonic Yellow",   range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#ffc81a", brandCode: "WP1128", finish: "matte" },
  { brand: "Army Painter", name: "Greenskin",         range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#3a7a3a", brandCode: "WP1142", finish: "matte" },
  { brand: "Army Painter", name: "Angel Green",       range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#1a5a2a", brandCode: "WP1143", finish: "matte" },
  { brand: "Army Painter", name: "Ultramarine Blue",  range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#1a3a8a", brandCode: "WP1158", finish: "matte" },
  { brand: "Army Painter", name: "Crystal Blue",      range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#1a78c8", brandCode: "WP1159", finish: "matte" },
  { brand: "Army Painter", name: "Barbarian Flesh",   range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#d6a07a", brandCode: "WP1173", finish: "matte" },
  { brand: "Army Painter", name: "Tanned Flesh",      range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#b88a64", brandCode: "WP1174", finish: "matte" },
  { brand: "Army Painter", name: "Leather Brown",     range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#7a4a2a", brandCode: "WP1185", finish: "matte" },
  { brand: "Army Painter", name: "Oak Brown",         range: "Warpaints Fanatic", paintType: "acrylic",  hexColor: "#5a3a1a", brandCode: "WP1186", finish: "matte" },
  // Warpaints Fanatic Metallic
  { brand: "Army Painter", name: "Plate Mail Metal",  range: "Warpaints Fanatic Metallic", paintType: "metallic", hexColor: "#a8acb0", brandCode: "WP1192", finish: "metallic", specialType: "metallic" },
  { brand: "Army Painter", name: "Weapon Bronze",     range: "Warpaints Fanatic Metallic", paintType: "metallic", hexColor: "#b88c2c", brandCode: "WP1193", finish: "metallic", specialType: "metallic" },
  // Speedpaint 2.0
  { brand: "Army Painter", name: "Pallid Bone",         range: "Speedpaint 2.0", paintType: "speedpaint", hexColor: "#dccfa8", brandCode: "WP2001", finish: "satin", transparency: "translucent" },
  { brand: "Army Painter", name: "Blood Red",           range: "Speedpaint 2.0", paintType: "speedpaint", hexColor: "#a01818", brandCode: "WP2010", finish: "satin", transparency: "translucent" },
  { brand: "Army Painter", name: "Hive Dweller Purple", range: "Speedpaint 2.0", paintType: "speedpaint", hexColor: "#5a2a6a", brandCode: "WP2022", finish: "satin", transparency: "translucent" },
  { brand: "Army Painter", name: "Slaughter Red",       range: "Speedpaint 2.0", paintType: "speedpaint", hexColor: "#c41a1a", brandCode: "WP2011", finish: "satin", transparency: "translucent" },
];

async function main() {
  const html = await tryFetch(SOURCE_URL);
  if (html) {
    try {
      const data = JSON.parse(html);
      const products = (data as any)?.products;
      if (Array.isArray(products) && products.length > 0) {
        const paints: Paint[] = products
          .map((p: any): Paint | null => {
            const rawTitle = String(p.title ?? "").trim();
            if (!rawTitle) return null;
            const { range, name, paintType } = extractRangeFromName(rawTitle);
            const paint: Paint = {
              brand: "Army Painter",
              name,
              paintType,
              brandCode: p.variants?.[0]?.sku ?? undefined,
              barcode: p.variants?.[0]?.barcode ?? undefined,
              imageUrl: p.images?.[0]?.src || undefined,
              // hexColor, finish, transparency, specialType are not available from
              // the Shopify products.json API — omitted intentionally.
            };
            if (range) paint.range = range;
            return paint;
          })
          .filter((p): p is Paint => p !== null);
        if (paints.length > 0) {
          writeScraped("army-painter", paints, "live");
          process.exit(0);
        }
      }
    } catch {
      // fall through
    }
  }
  writeScraped("army-painter", SEED, "seed");
}

main().catch((err) => {
  console.error("army-painter scraper failed:", err);
  process.exit(1);
});
