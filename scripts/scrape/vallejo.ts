// Vallejo paint scraper (Model Color line — the most commonly referenced range).
//
// TODO: scrape acrylicosvallejo.com product listing or the official Vallejo
// color chart PDF. Falls back to a hand-curated Model Color seed sample.

import { Paint, tryFetch, writeScraped } from "./_common";

const SOURCE_URL = "https://acrylicosvallejo.com/en/category/hobby/model-color-en/";

const SEED: Paint[] = [
  { brand: "Vallejo", name: "Black", paintType: "model-color", hexColor: "#000000", brandCode: "70.950", finish: "matte" },
  { brand: "Vallejo", name: "White", paintType: "model-color", hexColor: "#f5f5f5", brandCode: "70.951", finish: "matte" },
  { brand: "Vallejo", name: "Flat Red", paintType: "model-color", hexColor: "#a01818", brandCode: "70.957", finish: "matte" },
  { brand: "Vallejo", name: "Flat Blue", paintType: "model-color", hexColor: "#1f3d8a", brandCode: "70.962", finish: "matte" },
  { brand: "Vallejo", name: "Flat Yellow", paintType: "model-color", hexColor: "#ffd400", brandCode: "70.953", finish: "matte" },
  { brand: "Vallejo", name: "Flat Green", paintType: "model-color", hexColor: "#0b6a2a", brandCode: "70.968", finish: "matte" },
  { brand: "Vallejo", name: "Flat Brown", paintType: "model-color", hexColor: "#5a3a1e", brandCode: "70.984", finish: "matte" },
  { brand: "Vallejo", name: "Flat Flesh", paintType: "model-color", hexColor: "#d6a07a", brandCode: "70.955", finish: "matte" },
  { brand: "Vallejo", name: "Medium Flesh", paintType: "model-color", hexColor: "#c98a64", brandCode: "70.860", finish: "matte" },
  { brand: "Vallejo", name: "Dark Flesh", paintType: "model-color", hexColor: "#9a5a3d", brandCode: "70.927", finish: "matte" },
  { brand: "Vallejo", name: "Cold Grey", paintType: "model-color", hexColor: "#8a8f96", brandCode: "70.907", finish: "matte" },
  { brand: "Vallejo", name: "Neutral Grey", paintType: "model-color", hexColor: "#7a7a7a", brandCode: "70.992", finish: "matte" },
  { brand: "Vallejo", name: "Off-White", paintType: "model-color", hexColor: "#ecdfc6", brandCode: "70.820", finish: "matte" },
  { brand: "Vallejo", name: "German Camo Black Brown", paintType: "model-color", hexColor: "#2a1a14", brandCode: "70.822", finish: "matte" },
  { brand: "Vallejo", name: "Gold", paintType: "model-color", hexColor: "#b88c2c", brandCode: "70.996", finish: "metallic", specialType: "metallic" },
];

async function main() {
  const html = await tryFetch(SOURCE_URL);
  // The Vallejo product page is rendered with WooCommerce and not easily parsed
  // without a DOM parser. Treat any non-empty response as "scrape attempted" but
  // still use seed data unless we can find a structured chunk.
  if (html) {
    try {
      // Attempt to extract product entries from WooCommerce HTML.
      // Each product card typically has a <h2 class="woocommerce-loop-product__title">
      // and a data-product_id attribute we can use to detect structured content.
      const titleMatches = html.match(/<h2[^>]+woocommerce-loop-product__title[^>]*>([^<]+)<\/h2>/gi);
      if (titleMatches && titleMatches.length > 0) {
        const parsed: Paint[] = titleMatches.map((m) => {
          const name = m.replace(/<[^>]+>/g, "").trim();
          return { brand: "Vallejo", name, paintType: "model-color" };
        }).filter((p) => p.name);
        if (parsed.length > 0) {
          writeScraped("vallejo", parsed, "live");
          return;
        }
      }
    } catch {
      // parsing failed
    }
    console.log("Vallejo: live fetch returned non-parseable HTML, using seed");
  }
  writeScraped("vallejo", SEED, "seed");
}

main().catch((err) => {
  console.error("vallejo scraper failed:", err);
  process.exit(1);
});
