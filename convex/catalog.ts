import { httpAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Paint = {
  _id: string;
  brand: string;
  name: string;
  paintType: string;
  hexColor?: string;
  brandCode?: string;
  barcode?: string;
  transparency?: string;
  finish?: string;
  specialType?: string;
  imageUrl?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SHA-256 using the Web Crypto API — available in all Convex runtimes. */
async function sha256Hex(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// API key validation
// ---------------------------------------------------------------------------

async function validateApiKey(
  ctx: Parameters<Parameters<typeof httpAction>[0]>[0],
  request: Request,
): Promise<boolean> {
  const key = request.headers.get("x-api-key");
  if (!key) return false;
  const keyHash = await sha256Hex(key);
  const record = await ctx.runQuery(internal.apiKeys.getByHash, { keyHash });
  if (!record) return false;
  if (record.revokedAt !== undefined) return false;
  return true;
}

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "x-api-key, Content-Type",
    },
  });
}

// ---------------------------------------------------------------------------
// Internal queries
// ---------------------------------------------------------------------------

export const searchPaints = internalQuery({
  args: { q: v.string(), brand: v.optional(v.string()) },
  handler: async (ctx, { q, brand }) => {
    const searchQuery = ctx.db
      .query("catalogPaints")
      .withSearchIndex("by_name_brand", (s) => {
        const base = s.search("name", q);
        return brand ? base.eq("brand", brand) : base;
      });
    return await searchQuery.collect();
  },
});

export const listBrands = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Brand counts require scanning all documents. Acceptable for ~400-500 paints.
    // Future optimisation: maintain a denormalised brands counter document.
    const all = await ctx.db.query("catalogPaints").collect();
    const counts: Record<string, number> = {};
    for (const paint of all) {
      counts[paint.brand] = (counts[paint.brand] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const listPaints = internalQuery({
  args: {
    brand: v.optional(v.string()),
    paintType: v.optional(v.string()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { brand, paintType, cursor }) => {
    const PAGE_SIZE = 50;

    // Build base query — use the by_brand index when a brand filter is given
    // to avoid a full table scan. The by_brand index is defined in schema.ts.
    const baseQuery = brand
      ? ctx.db
          .query("catalogPaints")
          .withIndex("by_brand", (q) => q.eq("brand", brand))
      : ctx.db.query("catalogPaints");

    // Collect the filtered set to obtain an accurate total count.
    // paintType has no dedicated index so we filter in memory.
    // For ~400-500 paints this is acceptable.
    const allForCount = await baseQuery.collect();
    const filteredForCount = paintType
      ? allForCount.filter((p) => p.paintType === paintType)
      : allForCount;
    const total = filteredForCount.length;

    // Use Convex's built-in paginate() for a stable cursor that is not
    // invalidated by inserts or deletes (unlike a numeric offset).
    const paginateQuery = brand
      ? ctx.db
          .query("catalogPaints")
          .withIndex("by_brand", (q) => q.eq("brand", brand))
      : ctx.db.query("catalogPaints");

    const result = await paginateQuery.paginate({
      cursor: cursor ?? null,
      numItems: PAGE_SIZE,
    });

    // Apply paintType post-filter on the fetched page.
    // Note: this means the page may contain fewer than PAGE_SIZE items when
    // paintType is active, but cursor stability is preserved.
    const filteredPage = paintType
      ? result.page.filter((p) => p.paintType === paintType)
      : result.page;

    return {
      results: filteredPage,
      total,
      isDone: result.isDone,
      continueCursor: result.isDone ? null : result.continueCursor,
    };
  },
});

export const lookupPaint = internalQuery({
  args: {
    code: v.optional(v.string()),
    barcode: v.optional(v.string()),
  },
  handler: async (ctx, { code, barcode }) => {
    if (barcode) {
      const byBarcode = await ctx.db
        .query("catalogPaints")
        .withIndex("by_barcode", (q) => q.eq("barcode", barcode))
        .first();
      if (byBarcode) return byBarcode;
    }
    if (code) {
      const byCode = await ctx.db
        .query("catalogPaints")
        .withIndex("by_brandCode", (q) => q.eq("brandCode", code))
        .first();
      if (byCode) return byCode;
    }
    return null;
  },
});

// ---------------------------------------------------------------------------
// HTTP action handlers (exported for use in http.ts)
// ---------------------------------------------------------------------------

export const handleSearch = httpAction(async (ctx, request) => {
  if (!(await validateApiKey(ctx, request))) return unauthorizedResponse();

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const brand = url.searchParams.get("brand") ?? undefined;

  if (!q.trim()) {
    return jsonResponse({ error: "Missing required query param: q" }, 400);
  }

  // Type annotation required to work around TypeScript circularity on same-file ctx.runQuery.
  const paints: Doc<"catalogPaints">[] = await ctx.runQuery(
    internal.catalog.searchPaints,
    { q, brand },
  );

  // Group by brand
  const grouped: Record<string, Doc<"catalogPaints">[]> = {};
  for (const paint of paints) {
    if (!grouped[paint.brand]) grouped[paint.brand] = [];
    grouped[paint.brand].push(paint);
  }

  return jsonResponse({ results: grouped, total: paints.length });
});

export const handleBrands = httpAction(async (ctx, request) => {
  if (!(await validateApiKey(ctx, request))) return unauthorizedResponse();

  const brands = await ctx.runQuery(internal.catalog.listBrands, {});
  const total = brands.reduce((sum, b) => sum + b.count, 0);

  return jsonResponse({ results: brands, total });
});

export const handlePaints = httpAction(async (ctx, request) => {
  if (!(await validateApiKey(ctx, request))) return unauthorizedResponse();

  const url = new URL(request.url);
  const brand = url.searchParams.get("brand") ?? undefined;
  const paintType = url.searchParams.get("type") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;

  // Type annotation required to work around TypeScript circularity on same-file ctx.runQuery.
  const result: {
    results: Doc<"catalogPaints">[];
    total: number;
    isDone: boolean;
    continueCursor: string | null;
  } = await ctx.runQuery(internal.catalog.listPaints, {
    brand,
    paintType,
    cursor,
  });

  return jsonResponse({
    results: result.results,
    total: result.total,
    cursor: result.isDone ? undefined : result.continueCursor,
  });
});

export const handleLookup = httpAction(async (ctx, request) => {
  if (!(await validateApiKey(ctx, request))) return unauthorizedResponse();

  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? undefined;
  const barcode = url.searchParams.get("barcode") ?? undefined;

  if (!code && !barcode) {
    return jsonResponse(
      { error: "At least one of code or barcode is required" },
      400,
    );
  }

  // Type annotation required to work around TypeScript circularity on same-file ctx.runQuery.
  const paint: Doc<"catalogPaints"> | null = await ctx.runQuery(
    internal.catalog.lookupPaint,
    { code, barcode },
  );

  return jsonResponse({
    results: paint ? [paint] : [],
    total: paint ? 1 : 0,
  });
});
