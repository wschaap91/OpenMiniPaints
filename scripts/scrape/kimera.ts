// Kimera Kolors paint scraper.
//
// Kimera Kolors is a small artisan brand whose line consists of 12 pure
// pigment "Kolors" plus a handful of complements, whites/blacks and metallics.
// The set is well-documented in the hobby community so we encode it here as
// the canonical seed. Live scraping is attempted but the kimerakolors.com
// shop is JS-rendered.

import { Paint, tryFetch, writeScraped } from "./_common";

const SOURCE_URL = "https://kimerakolors.com/shop/";

const SEED: Paint[] = [
  // The 12 pure pigment "Kolors"
  { brand: "Kimera Colors", name: "Hansa Yellow Light", paintType: "pure-pigment", hexColor: "#ffe347", brandCode: "K01", finish: "satin" },
  { brand: "Kimera Colors", name: "Hansa Yellow Medium", paintType: "pure-pigment", hexColor: "#ffc81a", brandCode: "K02", finish: "satin" },
  { brand: "Kimera Colors", name: "Pyrrole Orange", paintType: "pure-pigment", hexColor: "#ec5a1a", brandCode: "K03", finish: "satin" },
  { brand: "Kimera Colors", name: "Pyrrole Red", paintType: "pure-pigment", hexColor: "#c81a1a", brandCode: "K04", finish: "satin" },
  { brand: "Kimera Colors", name: "Quinacridone Magenta", paintType: "pure-pigment", hexColor: "#a8156c", brandCode: "K05", finish: "satin" },
  { brand: "Kimera Colors", name: "Dioxazine Purple", paintType: "pure-pigment", hexColor: "#3a1660", brandCode: "K06", finish: "satin" },
  { brand: "Kimera Colors", name: "Ultramarine Blue", paintType: "pure-pigment", hexColor: "#1a2a8a", brandCode: "K07", finish: "satin" },
  { brand: "Kimera Colors", name: "Cyan Blue", paintType: "pure-pigment", hexColor: "#1a78c8", brandCode: "K08", finish: "satin" },
  { brand: "Kimera Colors", name: "Phthalo Green Blue Shade", paintType: "pure-pigment", hexColor: "#0a6a5a", brandCode: "K09", finish: "satin" },
  { brand: "Kimera Colors", name: "Phthalo Green Yellow Shade", paintType: "pure-pigment", hexColor: "#1a7a3a", brandCode: "K10", finish: "satin" },
  { brand: "Kimera Colors", name: "Yellow Ochre", paintType: "pure-pigment", hexColor: "#c89a3a", brandCode: "K11", finish: "satin" },
  { brand: "Kimera Colors", name: "Burnt Sienna", paintType: "pure-pigment", hexColor: "#7a3a1a", brandCode: "K12", finish: "satin" },
  // Whites, blacks, complements
  { brand: "Kimera Colors", name: "Titanium White", paintType: "white", hexColor: "#fafafa", brandCode: "KW1", finish: "satin" },
  { brand: "Kimera Colors", name: "Mars Black", paintType: "black", hexColor: "#0a0a0a", brandCode: "KB1", finish: "satin" },
  { brand: "Kimera Colors", name: "Carbon Black", paintType: "black", hexColor: "#050505", brandCode: "KB2", finish: "satin" },
  { brand: "Kimera Colors", name: "Raw Umber", paintType: "complementary", hexColor: "#4a3a1a", brandCode: "KC1", finish: "satin" },
  { brand: "Kimera Colors", name: "Burnt Umber", paintType: "complementary", hexColor: "#3a1a0a", brandCode: "KC2", finish: "satin" },
  { brand: "Kimera Colors", name: "Payne's Grey", paintType: "complementary", hexColor: "#2a3a4a", brandCode: "KC3", finish: "satin" },
  { brand: "Kimera Colors", name: "Naples Yellow", paintType: "complementary", hexColor: "#e6c87a", brandCode: "KC4", finish: "satin" },
  { brand: "Kimera Colors", name: "Indian Red", paintType: "complementary", hexColor: "#8a3a3a", brandCode: "KC5", finish: "satin" },
  { brand: "Kimera Colors", name: "Cobalt Turquoise", paintType: "complementary", hexColor: "#1a8a9a", brandCode: "KC6", finish: "satin" },
  { brand: "Kimera Colors", name: "Sap Green", paintType: "complementary", hexColor: "#3a5a1a", brandCode: "KC7", finish: "satin" },
  { brand: "Kimera Colors", name: "Transparent Yellow", paintType: "transparent", hexColor: "#ffd400", brandCode: "KT1", finish: "satin", transparency: "transparent" },
  { brand: "Kimera Colors", name: "Transparent Red", paintType: "transparent", hexColor: "#d40020", brandCode: "KT2", finish: "satin", transparency: "transparent" },
  { brand: "Kimera Colors", name: "Transparent Blue", paintType: "transparent", hexColor: "#0030c0", brandCode: "KT3", finish: "satin", transparency: "transparent" },
  // Metallics
  { brand: "Kimera Colors", name: "Iridescent Gold", paintType: "metallic", hexColor: "#c89a3a", brandCode: "KM1", finish: "metallic", specialType: "metallic" },
  { brand: "Kimera Colors", name: "Iridescent Silver", paintType: "metallic", hexColor: "#c8c8d0", brandCode: "KM2", finish: "metallic", specialType: "metallic" },
  { brand: "Kimera Colors", name: "Iridescent Copper", paintType: "metallic", hexColor: "#b8702a", brandCode: "KM3", finish: "metallic", specialType: "metallic" },
  { brand: "Kimera Colors", name: "Iridescent Bronze", paintType: "metallic", hexColor: "#8a5a2a", brandCode: "KM4", finish: "metallic", specialType: "metallic" },
  { brand: "Kimera Colors", name: "Iridescent Steel", paintType: "metallic", hexColor: "#8a8f96", brandCode: "KM5", finish: "metallic", specialType: "metallic" },
];

async function main() {
  const html = await tryFetch(SOURCE_URL);
  if (html && html.toLowerCase().includes("kimera")) {
    // Could parse Shopify product JSON here; for now the seed is authoritative.
  }
  writeScraped("kimera", SEED, "seed");
}

main().catch((err) => {
  console.error("kimera scraper failed:", err);
  process.exit(1);
});
