import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Paint upsert helpers — used by import/scrape scripts (ticket #3)
// ---------------------------------------------------------------------------

const paintArgs = {
  brand: v.string(),
  name: v.string(),
  paintType: v.string(),
  hexColor: v.optional(v.string()),
  brandCode: v.optional(v.string()),
  barcode: v.optional(v.string()),
  transparency: v.optional(v.string()),
  finish: v.optional(v.string()),
  specialType: v.optional(v.string()),
};

/**
 * Insert or update a single paint identified by brand + name.
 * Returns the document id.
 */
export const upsertPaint = internalMutation({
  args: paintArgs,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("catalogPaints")
      .filter((q) =>
        q.and(q.eq(q.field("brand"), args.brand), q.eq(q.field("name"), args.name)),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("catalogPaints", args);
  },
});

/**
 * Bulk-import an array of paints, upserting each by brand + name.
 * Returns a summary: { inserted, updated, total }.
 */
export const bulkImport = internalMutation({
  args: {
    paints: v.array(v.object(paintArgs)),
  },
  handler: async (ctx, { paints }) => {
    let inserted = 0;
    let updated = 0;

    for (const paint of paints) {
      const existing = await ctx.db
        .query("catalogPaints")
        .filter((q) =>
          q.and(
            q.eq(q.field("brand"), paint.brand),
            q.eq(q.field("name"), paint.name),
          ),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, paint);
        updated++;
      } else {
        await ctx.db.insert("catalogPaints", paint);
        inserted++;
      }
    }

    return { inserted, updated, total: paints.length };
  },
});
