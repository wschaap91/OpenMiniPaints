// Pro Acryl (Monument Hobbies) paint scraper.
//
// TODO: monumenthobbies.com is a Shopify store; products are also available
// as /products/<handle>.json. Live scraping is attempted; falls back to a
// curated Pro Acryl seed sample.

import { Finish, Paint, PaintType, tryFetch, writeScraped } from "./_common";

const SOURCE_URL = "https://monumenthobbies.com/collections/pro-acryl/products.json?limit=250";

const SEED: Paint[] = [
  { brand: "Pro Acryl", name: "Bold Titanium White", paintType: "acrylic", hexColor: "#f5f5f5", brandCode: "PA-001", finish: "matte" },
  { brand: "Pro Acryl", name: "Bold Pyrrole Red", paintType: "acrylic", hexColor: "#c81a1a", brandCode: "PA-002", finish: "matte" },
  { brand: "Pro Acryl", name: "Bold Phthalo Blue", paintType: "acrylic", hexColor: "#1a3a8a", brandCode: "PA-003", finish: "matte" },
  { brand: "Pro Acryl", name: "Bold Cadmium Yellow", paintType: "acrylic", hexColor: "#ffd400", brandCode: "PA-004", finish: "matte" },
  { brand: "Pro Acryl", name: "Bold Carbon Black", paintType: "acrylic", hexColor: "#0a0a0a", brandCode: "PA-005", finish: "matte" },
  { brand: "Pro Acryl", name: "Dark Red", paintType: "acrylic", hexColor: "#7a1a1a", brandCode: "PA-010", finish: "matte" },
  { brand: "Pro Acryl", name: "Bright Red", paintType: "acrylic", hexColor: "#e62a2a", brandCode: "PA-011", finish: "matte" },
  { brand: "Pro Acryl", name: "Warm Highlight", paintType: "acrylic", hexColor: "#f0d8a8", brandCode: "PA-012", finish: "matte" },
  { brand: "Pro Acryl", name: "Cool Highlight", paintType: "acrylic", hexColor: "#dfe6ec", brandCode: "PA-013", finish: "matte" },
  { brand: "Pro Acryl", name: "Dark Skin Tone", paintType: "acrylic", hexColor: "#5a3a2a", brandCode: "PA-020", finish: "matte" },
  { brand: "Pro Acryl", name: "Medium Skin Tone", paintType: "acrylic", hexColor: "#b88a6a", brandCode: "PA-021", finish: "matte" },
  { brand: "Pro Acryl", name: "Light Skin Tone", paintType: "acrylic", hexColor: "#e6c4a8", brandCode: "PA-022", finish: "matte" },
  { brand: "Pro Acryl", name: "Dark Earth", paintType: "acrylic", hexColor: "#3a2a1a", brandCode: "PA-030", finish: "matte" },
  { brand: "Pro Acryl", name: "Medium Earth", paintType: "acrylic", hexColor: "#7a5a3a", brandCode: "PA-031", finish: "matte" },
  { brand: "Pro Acryl", name: "Bone", paintType: "acrylic", hexColor: "#dccfa8", brandCode: "PA-032", finish: "matte" },
  { brand: "Pro Acryl", name: "Dark Olive", paintType: "acrylic", hexColor: "#3a4a1a", brandCode: "PA-040", finish: "matte" },
  { brand: "Pro Acryl", name: "Bright Green", paintType: "acrylic", hexColor: "#2aa84a", brandCode: "PA-041", finish: "matte" },
  { brand: "Pro Acryl", name: "Phthalo Green", paintType: "acrylic", hexColor: "#0a6a4a", brandCode: "PA-042", finish: "matte" },
  { brand: "Pro Acryl", name: "Sky Blue", paintType: "acrylic", hexColor: "#5a8fc7", brandCode: "PA-050", finish: "matte" },
  { brand: "Pro Acryl", name: "Dark Blue", paintType: "acrylic", hexColor: "#1a2a5a", brandCode: "PA-051", finish: "matte" },
];

async function main() {
  const html = await tryFetch(SOURCE_URL);
  if (html) {
    try {
      const data = JSON.parse(html);
      const products = (data as any)?.products;
      if (Array.isArray(products) && products.length > 0) {
        const paints: Paint[] = products.map((p: any) => ({
          brand: "Pro Acryl",
          name: String(p.title ?? "").replace(/^Pro Acryl\s*[-—]?\s*/i, "").trim(),
          paintType: "acrylic" as PaintType,
          brandCode: p.variants?.[0]?.sku,
          barcode: p.variants?.[0]?.barcode,
          finish: "matte" as Finish,
          imageUrl: p.images?.[0]?.src || undefined,
        })).filter((p) => p.name);
        if (paints.length > 0) {
          writeScraped("proacryl", paints, "live");
          process.exit(0);
        }
      }
    } catch {
      // fall through
    }
  }
  writeScraped("proacryl", SEED, "seed");
}

main().catch((err) => {
  console.error("proacryl scraper failed:", err);
  process.exit(1);
});
