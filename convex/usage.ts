import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    conversationId: v.id("conversations"),
    cache_creation_input_tokens: v.number(),
    cache_read_input_tokens: v.number(),
    output_tokens: v.number(),
    ephemeral_1h_input_tokens: v.number(),
    cache_creation_ephemeral_5m_input_tokens: v.number(),
    cache_creation_ephemeral_1h_input_tokens: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("usage")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        cache_creation_input_tokens: args.cache_creation_input_tokens,
        cache_read_input_tokens: args.cache_read_input_tokens,
        output_tokens: args.output_tokens,
        ephemeral_1h_input_tokens: args.ephemeral_1h_input_tokens,
        cache_creation_ephemeral_5m_input_tokens: args.cache_creation_ephemeral_5m_input_tokens,
        cache_creation_ephemeral_1h_input_tokens: args.cache_creation_ephemeral_1h_input_tokens,
      });
      return existing._id;
    }
    const id = await ctx.db.insert("usage", args);
    return id;
  },
});

export const totalOutputTokens = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("usage").collect();
    let total = 0;
    for (const d of docs) total += d.output_tokens ?? 0;
    return total;
  },
});

export const getUsageForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usage")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .unique();
  },
});
