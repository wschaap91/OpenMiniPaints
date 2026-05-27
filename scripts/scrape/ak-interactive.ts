// AK Interactive 3rd Gen paint scraper.
//
// TODO: ak-interactive.com runs a Magento/Shopify-style storefront. Live
// scraping is best done via their sitemap + product JSON. Falls back to a
// hand-curated 3rd Gen sample.

import { Paint, PaintType, tryFetch, writeScraped } from "./_common";

const SOURCE_URL = "https://ak-interactive.com/en/3gen-acrylics/";

const SEED: Paint[] = [
  // Core range AK11001–AK11031
  { brand: "AK Interactive", name: "Pure White", paintType: "3rd-gen", hexColor: "#fafafa", brandCode: "AK11001", finish: "matte" },
  { brand: "AK Interactive", name: "Pure Black", paintType: "3rd-gen", hexColor: "#080808", brandCode: "AK11002", finish: "matte" },
  { brand: "AK Interactive", name: "Warm White", paintType: "3rd-gen", hexColor: "#f5f0e8", brandCode: "AK11003", finish: "matte" },
  { brand: "AK Interactive", name: "Deep Yellow", paintType: "3rd-gen", hexColor: "#e8b800", brandCode: "AK11004", finish: "matte" },
  { brand: "AK Interactive", name: "Orange", paintType: "3rd-gen", hexColor: "#e85a18", brandCode: "AK11005", finish: "matte" },
  { brand: "AK Interactive", name: "Scarlett Red", paintType: "3rd-gen", hexColor: "#c01818", brandCode: "AK11006", finish: "matte" },
  { brand: "AK Interactive", name: "Dark Red", paintType: "3rd-gen", hexColor: "#780808", brandCode: "AK11007", finish: "matte" },
  { brand: "AK Interactive", name: "Magenta", paintType: "3rd-gen", hexColor: "#a81060", brandCode: "AK11008", finish: "matte" },
  { brand: "AK Interactive", name: "Violet", paintType: "3rd-gen", hexColor: "#581878", brandCode: "AK11009", finish: "matte" },
  { brand: "AK Interactive", name: "Dark Blue", paintType: "3rd-gen", hexColor: "#101850", brandCode: "AK11010", finish: "matte" },
  { brand: "AK Interactive", name: "Deep Blue", paintType: "3rd-gen", hexColor: "#1828a0", brandCode: "AK11011", finish: "matte" },
  { brand: "AK Interactive", name: "Sky Blue", paintType: "3rd-gen", hexColor: "#5090c8", brandCode: "AK11012", finish: "matte" },
  { brand: "AK Interactive", name: "Turquoise", paintType: "3rd-gen", hexColor: "#188878", brandCode: "AK11013", finish: "matte" },
  { brand: "AK Interactive", name: "Dark Green", paintType: "3rd-gen", hexColor: "#184818", brandCode: "AK11014", finish: "matte" },
  { brand: "AK Interactive", name: "Medium Green", paintType: "3rd-gen", hexColor: "#288028", brandCode: "AK11015", finish: "matte" },
  { brand: "AK Interactive", name: "Yellow Green", paintType: "3rd-gen", hexColor: "#80a018", brandCode: "AK11016", finish: "matte" },
  { brand: "AK Interactive", name: "Buff", paintType: "3rd-gen", hexColor: "#c8b078", brandCode: "AK11017", finish: "matte" },
  { brand: "AK Interactive", name: "Leather Brown", paintType: "3rd-gen", hexColor: "#783820", brandCode: "AK11018", finish: "matte" },
  { brand: "AK Interactive", name: "Dark Brown", paintType: "3rd-gen", hexColor: "#381808", brandCode: "AK11019", finish: "matte" },
  { brand: "AK Interactive", name: "Cold Grey", paintType: "3rd-gen", hexColor: "#888898", brandCode: "AK11020", finish: "matte" },
  { brand: "AK Interactive", name: "Warm Grey", paintType: "3rd-gen", hexColor: "#908880", brandCode: "AK11021", finish: "matte" },
  { brand: "AK Interactive", name: "Light Grey", paintType: "3rd-gen", hexColor: "#c8c8c0", brandCode: "AK11022", finish: "matte" },
  { brand: "AK Interactive", name: "Dark Grey", paintType: "3rd-gen", hexColor: "#404040", brandCode: "AK11023", finish: "matte" },
  { brand: "AK Interactive", name: "Skin", paintType: "3rd-gen", hexColor: "#d0a070", brandCode: "AK11024", finish: "matte" },
  { brand: "AK Interactive", name: "Medium Skin", paintType: "3rd-gen", hexColor: "#c08060", brandCode: "AK11025", finish: "matte" },
  { brand: "AK Interactive", name: "Dark Skin", paintType: "3rd-gen", hexColor: "#785040", brandCode: "AK11026", finish: "matte" },
  { brand: "AK Interactive", name: "Gold", paintType: "3rd-gen", hexColor: "#b88c2c", brandCode: "AK11027", finish: "metallic", specialType: "metallic" },
  { brand: "AK Interactive", name: "Silver", paintType: "3rd-gen", hexColor: "#a8a8b0", brandCode: "AK11028", finish: "metallic", specialType: "metallic" },
  { brand: "AK Interactive", name: "Copper", paintType: "3rd-gen", hexColor: "#b87030", brandCode: "AK11029", finish: "metallic", specialType: "metallic" },
  { brand: "AK Interactive", name: "Dark Wash", paintType: "3rd-gen", hexColor: "#101010", brandCode: "AK11030", finish: "satin", transparency: "translucent" },
  { brand: "AK Interactive", name: "Sepia Wash", paintType: "3rd-gen", hexColor: "#604020", brandCode: "AK11031", finish: "satin", transparency: "translucent" },
  // Extended range
  { brand: "AK Interactive", name: "Intense Red", paintType: "3rd-gen", hexColor: "#b91a1a", brandCode: "AK11086", finish: "matte" },
  { brand: "AK Interactive", name: "Pure Blue", paintType: "3rd-gen", hexColor: "#1a3aa6", brandCode: "AK11052", finish: "matte" },
  { brand: "AK Interactive", name: "Cerulean Blue", paintType: "3rd-gen", hexColor: "#5a8fc7", brandCode: "AK11053", finish: "matte" },
  { brand: "AK Interactive", name: "Yellow Ochre", paintType: "3rd-gen", hexColor: "#ffd21a", brandCode: "AK11042", finish: "matte" },
  { brand: "AK Interactive", name: "Olive Green", paintType: "3rd-gen", hexColor: "#4a5a2a", brandCode: "AK11135", finish: "matte" },
  { brand: "AK Interactive", name: "Bright Green", paintType: "3rd-gen", hexColor: "#2aa84a", brandCode: "AK11067", finish: "matte" },
  { brand: "AK Interactive", name: "Earth", paintType: "3rd-gen", hexColor: "#7a5a3a", brandCode: "AK11144", finish: "matte" },
  { brand: "AK Interactive", name: "Burnt Sienna", paintType: "3rd-gen", hexColor: "#8a3a1a", brandCode: "AK11084", finish: "matte" },
  { brand: "AK Interactive", name: "Sand Yellow", paintType: "3rd-gen", hexColor: "#d6b87a", brandCode: "AK11036", finish: "matte" },
  { brand: "AK Interactive", name: "Flesh Base", paintType: "3rd-gen", hexColor: "#d8a883", brandCode: "AK11058", finish: "matte" },
  { brand: "AK Interactive", name: "Flesh Shadow", paintType: "3rd-gen", hexColor: "#a06a4a", brandCode: "AK11061", finish: "matte" },
];

async function main() {
  const html = await tryFetch(SOURCE_URL);
  if (html) {
    try {
      // AK Interactive may return JSON product data; attempt to parse it.
      const data = JSON.parse(html);
      const products = (data as any)?.products ?? (Array.isArray(data) ? data : null);
      if (Array.isArray(products) && products.length > 0) {
        const parsed: Paint[] = products.map((p: any) => ({
          brand: "AK Interactive",
          name: String(p.title ?? p.name ?? "").trim(),
          paintType: "3rd-gen" as PaintType,
          brandCode: p.sku ?? p.variants?.[0]?.sku,
        })).filter((p) => p.name);
        if (parsed.length > 0) {
          writeScraped("ak-interactive", parsed, "live");
          return;
        }
      }
    } catch {
      // Not JSON — fall through
    }
    console.log("AK Interactive: live fetch returned non-parseable response, using seed");
  }
  writeScraped("ak-interactive", SEED, "seed");
}

main().catch((err) => {
  console.error("ak-interactive scraper failed:", err);
  process.exit(1);
});
