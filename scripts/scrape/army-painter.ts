// Army Painter (Warpaints Fanatic + Speedpaint 2.0) scraper.
//
// TODO: thearmypainter.com is a Shopify store; product JSON is available at
// /products/<handle>.json. Live scraping is attempted; falls back to a curated
// seed sample covering Warpaints Fanatic and Speedpaint 2.0.

import { Paint, PaintType, tryFetch, writeScraped } from "./_common";

const SOURCE_URL =
  "https://www.thearmypainter.com/collections/warpaints-fanatic/products.json?limit=250";

const SEED: Paint[] = [
  // Warpaints Fanatic
  { brand: "Army Painter", name: "Matt Black", paintType: "warpaints-fanatic", hexColor: "#0a0a0a", brandCode: "WP1101", finish: "matte" },
  { brand: "Army Painter", name: "Matt White", paintType: "warpaints-fanatic", hexColor: "#f5f5f5", brandCode: "WP1102", finish: "matte" },
  { brand: "Army Painter", name: "Pure Red", paintType: "warpaints-fanatic", hexColor: "#c81a1a", brandCode: "WP1115", finish: "matte" },
  { brand: "Army Painter", name: "Dragon Red", paintType: "warpaints-fanatic", hexColor: "#a01818", brandCode: "WP1116", finish: "matte" },
  { brand: "Army Painter", name: "Lava Orange", paintType: "warpaints-fanatic", hexColor: "#ec5a1a", brandCode: "WP1124", finish: "matte" },
  { brand: "Army Painter", name: "Daemonic Yellow", paintType: "warpaints-fanatic", hexColor: "#ffc81a", brandCode: "WP1128", finish: "matte" },
  { brand: "Army Painter", name: "Greenskin", paintType: "warpaints-fanatic", hexColor: "#3a7a3a", brandCode: "WP1142", finish: "matte" },
  { brand: "Army Painter", name: "Angel Green", paintType: "warpaints-fanatic", hexColor: "#1a5a2a", brandCode: "WP1143", finish: "matte" },
  { brand: "Army Painter", name: "Ultramarine Blue", paintType: "warpaints-fanatic", hexColor: "#1a3a8a", brandCode: "WP1158", finish: "matte" },
  { brand: "Army Painter", name: "Crystal Blue", paintType: "warpaints-fanatic", hexColor: "#1a78c8", brandCode: "WP1159", finish: "matte" },
  { brand: "Army Painter", name: "Barbarian Flesh", paintType: "warpaints-fanatic", hexColor: "#d6a07a", brandCode: "WP1173", finish: "matte" },
  { brand: "Army Painter", name: "Tanned Flesh", paintType: "warpaints-fanatic", hexColor: "#b88a64", brandCode: "WP1174", finish: "matte" },
  { brand: "Army Painter", name: "Leather Brown", paintType: "warpaints-fanatic", hexColor: "#7a4a2a", brandCode: "WP1185", finish: "matte" },
  { brand: "Army Painter", name: "Oak Brown", paintType: "warpaints-fanatic", hexColor: "#5a3a1a", brandCode: "WP1186", finish: "matte" },
  { brand: "Army Painter", name: "Plate Mail Metal", paintType: "warpaints-fanatic", hexColor: "#a8acb0", brandCode: "WP1192", finish: "metallic", specialType: "metallic" },
  { brand: "Army Painter", name: "Weapon Bronze", paintType: "warpaints-fanatic", hexColor: "#b88c2c", brandCode: "WP1193", finish: "metallic", specialType: "metallic" },
  // Speedpaint 2.0
  { brand: "Army Painter", name: "Pallid Bone", paintType: "speedpaint", hexColor: "#dccfa8", brandCode: "WP2001", finish: "satin", transparency: "translucent" },
  { brand: "Army Painter", name: "Blood Red", paintType: "speedpaint", hexColor: "#a01818", brandCode: "WP2010", finish: "satin", transparency: "translucent" },
  { brand: "Army Painter", name: "Hive Dweller Purple", paintType: "speedpaint", hexColor: "#5a2a6a", brandCode: "WP2022", finish: "satin", transparency: "translucent" },
  { brand: "Army Painter", name: "Slaughter Red", paintType: "speedpaint", hexColor: "#c41a1a", brandCode: "WP2011", finish: "satin", transparency: "translucent" },
];

async function main() {
  const html = await tryFetch(SOURCE_URL);
  if (html) {
    try {
      const data = JSON.parse(html);
      const products = (data as any)?.products;
      if (Array.isArray(products) && products.length > 0) {
        const paints: Paint[] = products.map((p: any) => ({
          brand: "Army Painter",
          name: String(p.title ?? "").trim(),
          paintType: "warpaints-fanatic" as PaintType,
          brandCode: p.variants?.[0]?.sku ?? undefined,
          barcode: p.variants?.[0]?.barcode ?? undefined,
          imageUrl: p.images?.[0]?.src || undefined,
          // hexColor, finish, transparency, specialType are not available from
          // the Shopify products.json API — omitted intentionally.
        })).filter((p) => p.name);
        if (paints.length > 0) {
          writeScraped("army-painter", paints, "live");
          process.exit(0);
        }
      }
    } catch (e) {
      console.warn("[army-painter] live parse failed, using seed:", e);
    }
  }
  writeScraped("army-painter", SEED, "seed");
}

main().catch((err) => {
  console.error("army-painter scraper failed:", err);
  process.exit(1);
});
