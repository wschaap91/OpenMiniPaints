import { readFileSync } from "node:fs";
import { Vibrant } from "node-vibrant/node";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// RGB → HSL conversion
// ---------------------------------------------------------------------------
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

// ---------------------------------------------------------------------------
// Helper: convert RGB triple to hex string
// ---------------------------------------------------------------------------
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(v).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ---------------------------------------------------------------------------
// Helper: detect media type from URL extension
// ---------------------------------------------------------------------------
function mediaTypeFromUrl(url: string): "image/jpeg" | "image/png" | "image/webp" {
  const lower = url.toLowerCase();
  if (lower.includes(".png") || lower.includes("png")) return "image/png";
  if (lower.includes(".webp") || lower.includes("webp")) return "image/webp";
  return "image/jpeg";
}

// ---------------------------------------------------------------------------
// Claude Vision fallback
// ---------------------------------------------------------------------------
async function visionFallback(
  imagePath: string,
  context: { name: string; brand: string; imageUrl?: string },
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn(`  [vision] ANTHROPIC_API_KEY not set — skipping Vision fallback for ${context.name}`);
    return null;
  }

  const client = new Anthropic({ apiKey });
  const imageData = readFileSync(imagePath).toString("base64");
  const mediaType = mediaTypeFromUrl(context.imageUrl ?? imagePath);

  const prompt = `This is a product image of '${context.name}' by ${context.brand}. Return only the dominant hex color of the paint swatch in the format #RRGGBB. No explanation.`;

  const RETRY_DELAY_MS = 2000;
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 64,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageData,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
      const match = text.match(/#[0-9A-Fa-f]{6}/);
      return match ? match[0] : null;
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) {
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          continue;
        }
        return null;
      }
      // Any other error: log and return null
      console.warn(`  [vision] unexpected error for ${context.name}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function extractHex(
  imagePath: string,
  context: { name: string; brand: string; imageUrl?: string },
): Promise<string | null> {
  // Step 1: Try node-vibrant to extract the dominant color
  try {
    const palette = await Vibrant.from(imagePath).getPalette();

    const swatch =
      palette.Vibrant ??
      Object.values(palette).find((s) => s != null) ??
      null;

    if (swatch) {
      const [r, g, b] = swatch.rgb;
      const [, s] = rgbToHsl(r, g, b);

      // If saturation is high enough, we trust this result
      if (s >= 0.15) {
        return rgbToHex(r, g, b);
      }
    }
  } catch (e) {
    console.warn(`  [vibrant] ${context.name}: ${e instanceof Error ? e.message : e} — falling through to Vision`);
  }

  // Step 2: Low-saturation result (likely label/packaging) or vibrant failed
  // → requires ANTHROPIC_API_KEY; logs a warning and returns null if not set
  return visionFallback(imagePath, context);
}
