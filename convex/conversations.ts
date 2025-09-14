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
      sessionId,
      systemInfoCollected: false
    });
    return id;
  },
});

export const markSystemInfoCollected = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();

    if (conversation) {
      await ctx.db.patch(conversation._id, { systemInfoCollected: true });
      return conversation._id;
    }
    return null;
  },
});

export const isFirstMessage = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    // Check if conversation exists and if system info has been collected
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();

    if (!conversation) {
      // No conversation exists, this is definitely the first message
      return true;
    }

    // Check if system info has been collected
    return !conversation.systemInfoCollected;
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
