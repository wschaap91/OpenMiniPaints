# OpenMiniPaints — Spec

Last updated: 2026-05-29 (after PR #22)

## Architecture

Backend-only REST API. No frontend or client app. Two layers: a Convex Cloud backend that hosts the HTTP router, queries, mutations, and database; and a local data pipeline (scripts) that scrapes brand catalogs, enriches hex colors, and imports records into Convex via CLI. API consumers authenticate via `x-api-key` header.

- Convex Cloud: HTTP actions, database, all read endpoints
- Scripts: scrape → enrich → import pipeline, API key generator
- No frontend, no auth provider, no CDN

## Stack

- `convex ^1.17.0` — serverless backend, database, HTTP router
- `@anthropic-ai/sdk ^0.99.0` — Claude Vision hex color extraction (pipeline only)
- `node-vibrant ^4.0.4` — dominant color extraction from images (pipeline only)
- `typescript ^5.7.0` / `tsx ^4.19.0` — script runtime

## Data Model

**`catalogPaints`**
```ts
{
  brand: string
  name: string
  paintType: PaintType   // union of 22 known values
  hexColor?: string      // e.g. "#231f20"
  brandCode?: string
  barcode?: string       // EAN
  range?: string
  transparency?: "translucent" | "transparent"
  finish?: "matte" | "satin" | "metallic"
  specialType?: "metallic"
  imageUrl?: string
}
```
Indexes: `by_name_brand` (search, filter: `brand`), `by_barcode`, `by_brandCode`, `by_brand_name` (upsert key), `by_brand` (paginated listing), `by_brand_range`

**`apiKeys`**
```ts
{
  keyHash: string    // SHA-256 hex of raw key — raw key never stored
  label: string
  createdAt: number  // Unix ms
  revokedAt?: number // set = revoked
}
```
Index: `by_keyHash`

## API Surface

Auth: all endpoints require `x-api-key` header. Returns 401 if missing or revoked. CORS: `Access-Control-Allow-Origin: *`, OPTIONS handlers on all routes.

Error shape: `{ error: string }` with appropriate HTTP status.

**GET /search**
- Params: `q` (required), `brand` (optional)
- Response: `{ results: { "<brand>": Paint[] }, total: number }`
- 400 if `q` is empty

**GET /brands**
- No params
- Response: `{ results: { name: string, count: number }[], total: number }`
- Sorted alphabetically

**GET /paints**
- Params: `brand` (optional), `type` (optional), `cursor` (optional, opaque)
- Page size: 50; uses `by_brand` index when brand filter present
- Response: `{ results: Paint[], total: number, cursor?: string }`

**GET /lookup**
- Params: `barcode` (optional), `code` (optional) — at least one required
- Response: `{ results: Paint[], total: number }` — 0 or 1 result
- 400 if neither param present

## Key Patterns

**Scraper pattern**: each brand script defines `SOURCE_URL` + `SEED: Paint[]`. Live fetch with 10s timeout via `tryFetch()`; falls back to seed on failure. Output written to `data/scraped/<brand>.json` via `writeScraped()`. Variant: the Army Painter scraper additionally runs raw Shopify product titles through `extractRangeFromName()`, which uses a `RANGE_PREFIX_MAP` (8 entries) to derive a clean `name`, `range`, and `paintType` from the title prefix.

**Hex enrichment (two-stage)**:
1. node-vibrant palette — use if saturation >= 0.15
2. Claude Vision fallback (`claude-sonnet-4-6`, base64 image) — 3 retries on rate limit

**Import pattern**: `spawnSync("npx", ["convex", "run", "admin:bulkImport", json])` in batches of 50 with 60s timeout. Requires `CONVEX_DEPLOY_KEY`.

**API key security**: SHA-256 hash stored only. `generate-key.ts` uses `spawnSync` array form (no shell injection). CI execution blocked explicitly.

**Internal-only writes**: all mutations are `internalMutation` — not HTTP-callable. Invoked via `npx convex run` with `CONVEX_DEPLOY_KEY`.

## Directory Structure

```
convex/            — HTTP router, queries, mutations, schema, auth
scripts/
  scrape/          — 6 brand scrapers + _common.ts + all.ts
  enrich/          — _color.ts (extractHex), hex-extractor.ts (runner)
  import.ts        — bulk import to Convex
  generate-key.ts  — API key generator
data/
  scraped/         — raw JSON per brand (gitignored)
  curated/         — enriched JSON per brand (gitignored)
  images/          — cached product images (gitignored)
.prd/              — product requirement documents
.spec/             — system specification
.adr/              — architecture decision records
```

## Infrastructure

- **Convex Cloud** — backend, database, HTTP API at `<project>.convex.site`
- **Anthropic API** — Claude Vision for hex enrichment (local pipeline only)
- 458 paints at launch across 6 brands: Citadel (62), Vallejo (54), AK Interactive (42), Kimera Colors (30), Pro Acryl (20), Army Painter (250)
- 99% hex color coverage at launch
