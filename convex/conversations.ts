import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const conversations = await ctx.db.query("conversations").order("desc").collect();
    return conversations;
  },
});

export const upsert = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();
    if (existing) return existing._id;
    const id = await ctx.db.insert("conversations", {
      sessionId
    });
    return id;
  },
});


export const isFirstMessage = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    // Check if conversation exists
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();

    // If no conversation exists, this is the first message
    return !conversation;
  },
});

export const addPrompt = mutation({
  args: { sessionId: v.string(), prompt: v.optional(v.string()), ai_prompt: v.optional(v.string()), timestamp: v.number() },
  handler: async (ctx, { sessionId, prompt, ai_prompt, timestamp }) => {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();
    const conversationId = existing?._id ?? (await ctx.db.insert("conversations", { sessionId }));
    if (prompt) await ctx.db.insert("prompts", { conversationId, prompt, timestamp });
    if (ai_prompt) await ctx.db.insert("ai_prompts", { conversationId, ai_prompt, timestamp });
    return conversationId;
  },
});
