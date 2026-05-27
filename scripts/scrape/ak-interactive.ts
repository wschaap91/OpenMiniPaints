// AK Interactive 3rd Gen paint scraper.
//
// TODO: ak-interactive.com runs a Magento/Shopify-style storefront. Live
// scraping is best done via their sitemap + product JSON. Falls back to a
// hand-curated 3rd Gen sample.

import { Paint, tryFetch, writeScraped } from "./_common";

const SOURCE_URL = "https://ak-interactive.com/en/3gen-acrylics/";

const SEED: Paint[] = [
  { brand: "AK Interactive", name: "Pure White", paintType: "3rd-gen", hexColor: "#fafafa", brandCode: "AK11001", finish: "matte" },
  { brand: "AK Interactive", name: "Pure Black", paintType: "3rd-gen", hexColor: "#0a0a0a", brandCode: "AK11029", finish: "matte" },
  { brand: "AK Interactive", name: "Intense Red", paintType: "3rd-gen", hexColor: "#b91a1a", brandCode: "AK11086", finish: "matte" },
  { brand: "AK Interactive", name: "Pure Blue", paintType: "3rd-gen", hexColor: "#1a3aa6", brandCode: "AK11052", finish: "matte" },
  { brand: "AK Interactive", name: "Sky Blue", paintType: "3rd-gen", hexColor: "#5a8fc7", brandCode: "AK11053", finish: "matte" },
  { brand: "AK Interactive", name: "Yellow", paintType: "3rd-gen", hexColor: "#ffd21a", brandCode: "AK11042", finish: "matte" },
  { brand: "AK Interactive", name: "Olive Green", paintType: "3rd-gen", hexColor: "#4a5a2a", brandCode: "AK11135", finish: "matte" },
  { brand: "AK Interactive", name: "Bright Green", paintType: "3rd-gen", hexColor: "#2aa84a", brandCode: "AK11067", finish: "matte" },
  { brand: "AK Interactive", name: "Earth", paintType: "3rd-gen", hexColor: "#7a5a3a", brandCode: "AK11144", finish: "matte" },
  { brand: "AK Interactive", name: "Burnt Sienna", paintType: "3rd-gen", hexColor: "#8a3a1a", brandCode: "AK11084", finish: "matte" },
  { brand: "AK Interactive", name: "Sand Yellow", paintType: "3rd-gen", hexColor: "#d6b87a", brandCode: "AK11036", finish: "matte" },
  { brand: "AK Interactive", name: "Flesh Base", paintType: "3rd-gen", hexColor: "#d8a883", brandCode: "AK11058", finish: "matte" },
  { brand: "AK Interactive", name: "Flesh Shadow", paintType: "3rd-gen", hexColor: "#a06a4a", brandCode: "AK11061", finish: "matte" },
  { brand: "AK Interactive", name: "Grey Highlight", paintType: "3rd-gen", hexColor: "#a8acb0", brandCode: "AK11023", finish: "matte" },
  { brand: "AK Interactive", name: "Neutral Grey", paintType: "3rd-gen", hexColor: "#6f7378", brandCode: "AK11021", finish: "matte" },
];

async function main() {
  const html = await tryFetch(SOURCE_URL);
  if (html && html.includes("AK11")) {
    // Could parse product cards here. For now, seed.
  }
  writeScraped("ak-interactive", SEED, "seed");
}

main().catch((err) => {
  console.error("ak-interactive scraper failed:", err);
  process.exit(1);
});
