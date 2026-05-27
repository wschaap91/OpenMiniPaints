// Vallejo paint scraper (Model Color line — the most commonly referenced range).
//
// TODO: scrape acrylicosvallejo.com product listing or the official Vallejo
// color chart PDF. Falls back to a hand-curated Model Color seed sample.

import { Paint, PaintType, tryFetch, writeScraped } from "./_common";

const SOURCE_URL = "https://acrylicosvallejo.com/en/category/hobby/model-color-en/";

const SEED: Paint[] = [
  // --- model-color (70.NNN) ---
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
  { brand: "Vallejo", name: "Ivory", paintType: "model-color", hexColor: "#f0ead0", brandCode: "70.918", finish: "matte" },
  { brand: "Vallejo", name: "Buff", paintType: "model-color", hexColor: "#d8c898", brandCode: "70.976", finish: "matte" },
  { brand: "Vallejo", name: "Dark Sand", paintType: "model-color", hexColor: "#b8a060", brandCode: "70.847", finish: "matte" },
  { brand: "Vallejo", name: "English Uniform", paintType: "model-color", hexColor: "#8a7050", brandCode: "70.921", finish: "matte" },
  { brand: "Vallejo", name: "Khaki", paintType: "model-color", hexColor: "#c8b880", brandCode: "70.988", finish: "matte" },
  { brand: "Vallejo", name: "Green Ochre", paintType: "model-color", hexColor: "#8a8840", brandCode: "70.914", finish: "matte" },
  { brand: "Vallejo", name: "Flat Earth", paintType: "model-color", hexColor: "#906848", brandCode: "70.983", finish: "matte" },
  { brand: "Vallejo", name: "Saddle Brown", paintType: "model-color", hexColor: "#6a3818", brandCode: "70.940", finish: "matte" },
  { brand: "Vallejo", name: "Mahogany", paintType: "model-color", hexColor: "#5a1808", brandCode: "70.846", finish: "matte" },
  { brand: "Vallejo", name: "Cavalry Brown", paintType: "model-color", hexColor: "#701c0c", brandCode: "70.982", finish: "matte" },
  { brand: "Vallejo", name: "Carmine Red", paintType: "model-color", hexColor: "#9a1010", brandCode: "70.908", finish: "matte" },
  { brand: "Vallejo", name: "Red", paintType: "model-color", hexColor: "#c82020", brandCode: "70.926", finish: "matte" },
  { brand: "Vallejo", name: "Orange Red", paintType: "model-color", hexColor: "#e05a20", brandCode: "70.910", finish: "matte" },
  { brand: "Vallejo", name: "Sun Yellow", paintType: "model-color", hexColor: "#f0d818", brandCode: "70.915", finish: "matte" },
  { brand: "Vallejo", name: "Sky Blue", paintType: "model-color", hexColor: "#4878b0", brandCode: "70.961", finish: "matte" },
  { brand: "Vallejo", name: "Magic Blue", paintType: "model-color", hexColor: "#2050a8", brandCode: "70.925", finish: "matte" },
  { brand: "Vallejo", name: "Dark Prussian Blue", paintType: "model-color", hexColor: "#0a1840", brandCode: "70.899", finish: "matte" },
  { brand: "Vallejo", name: "Luftwaffe Uniform", paintType: "model-color", hexColor: "#505878", brandCode: "70.816", finish: "matte" },
  { brand: "Vallejo", name: "Violet", paintType: "model-color", hexColor: "#601878", brandCode: "70.960", finish: "matte" },
  // --- game-color (72.NNN) ---
  { brand: "Vallejo", name: "Dead White", paintType: "game-color", hexColor: "#f8f8f8", brandCode: "72.001", finish: "matte" },
  { brand: "Vallejo", name: "Skull White", paintType: "game-color", hexColor: "#f0f0f0", brandCode: "72.002", finish: "matte" },
  { brand: "Vallejo", name: "Black (Game Color)", paintType: "game-color", hexColor: "#080808", brandCode: "72.051", finish: "matte" },
  { brand: "Vallejo", name: "Charcoal", paintType: "game-color", hexColor: "#282828", brandCode: "72.155", finish: "matte" },
  { brand: "Vallejo", name: "Heavy Red", paintType: "game-color", hexColor: "#881818", brandCode: "72.141", finish: "matte" },
  { brand: "Vallejo", name: "Scarlett Red", paintType: "game-color", hexColor: "#c01818", brandCode: "72.012", finish: "matte" },
  { brand: "Vallejo", name: "Foul Green", paintType: "game-color", hexColor: "#50a840", brandCode: "72.025", finish: "matte" },
  { brand: "Vallejo", name: "Hawk Turquoise", paintType: "game-color", hexColor: "#208880", brandCode: "72.024", finish: "matte" },
  { brand: "Vallejo", name: "Magic Blue (Game Color)", paintType: "game-color", hexColor: "#2848a8", brandCode: "72.021", finish: "matte" },
  { brand: "Vallejo", name: "Beasty Brown", paintType: "game-color", hexColor: "#603820", brandCode: "72.043", finish: "matte" },
  // --- model-air (71.NNN) ---
  { brand: "Vallejo", name: "White (Model Air)", paintType: "model-air", hexColor: "#f8f8f8", brandCode: "71.001", finish: "matte" },
  { brand: "Vallejo", name: "Black (Model Air)", paintType: "model-air", hexColor: "#080808", brandCode: "71.057", finish: "matte" },
  { brand: "Vallejo", name: "Red (Model Air)", paintType: "model-air", hexColor: "#c81818", brandCode: "71.003", finish: "matte" },
  { brand: "Vallejo", name: "Blue (Model Air)", paintType: "model-air", hexColor: "#2040a0", brandCode: "71.004", finish: "matte" },
  { brand: "Vallejo", name: "Burnt Umber", paintType: "model-air", hexColor: "#602010", brandCode: "71.040", finish: "matte" },
  { brand: "Vallejo", name: "Dark Earth", paintType: "model-air", hexColor: "#704020", brandCode: "71.029", finish: "matte" },
  { brand: "Vallejo", name: "Sand", paintType: "model-air", hexColor: "#d0b870", brandCode: "71.028", finish: "matte" },
  { brand: "Vallejo", name: "Olive Drab", paintType: "model-air", hexColor: "#586030", brandCode: "71.043", finish: "matte" },
  { brand: "Vallejo", name: "Intermediate Blue", paintType: "model-air", hexColor: "#3868a8", brandCode: "71.088", finish: "matte" },
  { brand: "Vallejo", name: "Dark Sea Grey", paintType: "model-air", hexColor: "#607080", brandCode: "71.164", finish: "matte" },
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
          return { brand: "Vallejo", name, paintType: "model-color" as PaintType };
        }).filter((p) => p.name);
        const usable = parsed.filter((p) => p.hexColor);
        if (usable.length > 0) {
          writeScraped("vallejo", usable, "live");
          return;
        }
        // Live data has no hex colors — fall through to seed
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
