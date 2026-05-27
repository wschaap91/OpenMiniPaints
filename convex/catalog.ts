import { createHash } from "crypto";
import { httpAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

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
};

// ---------------------------------------------------------------------------
// API key validation
// ---------------------------------------------------------------------------

async function validateApiKey(
  ctx: Parameters<Parameters<typeof httpAction>[0]>[0],
  request: Request,
): Promise<boolean> {
  const key = request.headers.get("x-api-key");
  if (!key) return false;
  const keyHash = createHash("sha256").update(key).digest("hex");
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
    headers: { "Content-Type": "application/json" },
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
    // Collect all matching documents to get a semantically correct total count.
    // For ~400-500 paints this is acceptable.
    let all = await ctx.db.query("catalogPaints").collect() as Paint[];

    if (brand) {
      all = all.filter((p) => p.brand === brand);
    }
    if (paintType) {
      all = all.filter((p) => p.paintType === paintType);
    }

    const total = all.length;
    const PAGE_SIZE = 50;

    // Decode cursor as an index into the filtered array.
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const page = all.slice(startIndex, startIndex + PAGE_SIZE);
    const nextIndex = startIndex + page.length;
    const isDone = nextIndex >= total;
    const continueCursor = isDone ? null : String(nextIndex);

    return {
      results: page,
      total,
      isDone,
      continueCursor,
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
        .filter((q) => q.eq(q.field("barcode"), barcode))
        .first();
      if (byBarcode) return byBarcode as Paint;
    }
    if (code) {
      const byCode = await ctx.db
        .query("catalogPaints")
        .filter((q) => q.eq(q.field("brandCode"), code))
        .first();
      if (byCode) return byCode as Paint;
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

  const paints = (await ctx.runQuery(internal.catalog.searchPaints, {
    q,
    brand,
  })) as Paint[];

  // Group by brand
  const grouped: Record<string, Paint[]> = {};
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

  const result = (await ctx.runQuery(internal.catalog.listPaints, {
    brand,
    paintType,
    cursor,
  })) as { results: Paint[]; total: number; isDone: boolean; continueCursor: string | null };

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

  const paint = (await ctx.runQuery(internal.catalog.lookupPaint, {
    code,
    barcode,
  })) as Paint | null;

  return jsonResponse({
    results: paint ? [paint] : [],
    total: paint ? 1 : 0,
  });
});
