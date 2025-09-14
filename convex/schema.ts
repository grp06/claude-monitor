import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  conversations: defineTable({
    sessionId: v.string(),
  }).index("by_sessionId", ["sessionId"]),
  prompts: defineTable({
    conversationId: v.id("conversations"),
    prompt: v.string(),
    timestamp: v.number(),
  }).index("by_conversationId", ["conversationId"]).index("by_conversationId_timestamp", ["conversationId", "timestamp"]),
  ai_prompts: defineTable({
    conversationId: v.id("conversations"),
    ai_prompt: v.string(),
    timestamp: v.number(),
  }).index("by_conversationId", ["conversationId"]).index("by_conversationId_timestamp", ["conversationId", "timestamp"]),
  usage: defineTable({
    conversationId: v.id("conversations"),
    cache_creation_input_tokens: v.number(),
    cache_read_input_tokens: v.number(),
    output_tokens: v.number(),
    ephemeral_1h_input_tokens: v.number(),
    cache_creation_ephemeral_5m_input_tokens: v.number(),
    cache_creation_ephemeral_1h_input_tokens: v.number(),
  }).index("by_conversationId", ["conversationId"]),
});
