import { query } from "./_generated/server";
import { v } from "convex/values";

export const listForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const prompts = await ctx.db
      .query("ai_prompts")
      .withIndex("by_conversationId_timestamp", (q) => q.eq("conversationId", conversationId))
      .order("asc")
      .collect();
    return prompts;
  },
});

