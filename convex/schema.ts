import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  catalogPaints: defineTable({
    brand: v.string(),
    name: v.string(),
    paintType: v.string(),
    hexColor: v.optional(v.string()),
    brandCode: v.optional(v.string()),
    barcode: v.optional(v.string()),
    transparency: v.optional(v.string()),
    finish: v.optional(v.string()),
    specialType: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).searchIndex("by_name_brand", {
    searchField: "name",
    filterFields: ["brand"],
  })
  .index("by_barcode", ["barcode"])
  .index("by_brandCode", ["brandCode"])
  .index("by_brand_name", ["brand", "name"])
  .index("by_brand", ["brand"]),

  apiKeys: defineTable({
    keyHash: v.string(),
    label: v.string(),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  }).index("by_keyHash", ["keyHash"]),
});
