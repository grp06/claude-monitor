import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {
    sessionId: v.string(),
    systemData: v.string(),
    n8nResponse: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, { sessionId, systemData, n8nResponse, timestamp }) => {
    // Check if system info already exists for this session
    const existing = await ctx.db
      .query("system_info")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        systemData,
        n8nResponse,
        timestamp,
      });
      return existing._id;
    } else {
      // Create new record
      const id = await ctx.db.insert("system_info", {
        sessionId,
        systemData,
        n8nResponse,
        timestamp,
      });
      return id;
    }
  },
});

export const getBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const systemInfo = await ctx.db
      .query("system_info")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();
    return systemInfo;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const systemInfos = await ctx.db.query("system_info").order("desc").collect();
    return systemInfos;
  },
});

export const hasSystemInfo = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const systemInfo = await ctx.db
      .query("system_info")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();
    return !!systemInfo;
  },
});