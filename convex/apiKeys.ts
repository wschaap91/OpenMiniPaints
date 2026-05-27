import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation — not HTTP-exposed.
 * Called by other Convex functions only.
 *
 * To create a key from a script, use scripts/generate-key.ts which invokes
 * the `convex run` CLI command, which can call internal functions directly
 * via the Convex admin API using CONVEX_DEPLOY_KEY.
 */
export const getByHash = internalQuery({
  args: { keyHash: v.string() },
  handler: async (ctx, { keyHash }) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", keyHash))
      .first();
  },
});

export const createKey = internalMutation({
  args: {
    keyHash: v.string(),
    label: v.string(),
  },
  handler: async (ctx, { keyHash, label }) => {
    const id = await ctx.db.insert("apiKeys", {
      keyHash,
      label,
      createdAt: Date.now(),
    });
    return id;
  },
});
