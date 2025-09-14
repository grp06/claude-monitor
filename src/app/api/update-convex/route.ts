import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

interface RequestBody {
  prompt?: string;
  ai_prompt?: string;
  session_id?: string;
  usage?: unknown;
}

export async function POST(req: Request) {
  console.log("=== Starting POST /api/update-convex ===");

  let body: unknown = null;
  try {
    console.log("Attempting to parse request body...");
    body = await req.json();
    console.log("Successfully parsed body:", JSON.stringify(body, null, 2));
  } catch (error) {
    console.error("Failed to parse request body as JSON:", error);
    return Response.json({
      error: "Invalid JSON body",
      details: error instanceof Error ? error.message : "Unknown parsing error"
    }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    console.error("Body validation failed - body is not an object:", { body, type: typeof body });
    return Response.json({
      error: "Invalid JSON body",
      details: "Body must be a valid JSON object"
    }, { status: 400 });
  }

  console.log("Body is valid object, extracting fields...");
  const requestBody = body as RequestBody;
  const prompt = typeof requestBody.prompt === "string" && requestBody.prompt.trim() !== "" ? requestBody.prompt : undefined;
  const ai_prompt = typeof requestBody.ai_prompt === "string" && requestBody.ai_prompt.trim() !== "" ? requestBody.ai_prompt : undefined;
  const sessionId = typeof requestBody.session_id === "string" ? requestBody.session_id : "";

  console.log("Extracted values:", {
    prompt: prompt ? "[PRESENT]" : "[NOT PRESENT]",
    ai_prompt: ai_prompt ? "[PRESENT]" : "[NOT PRESENT]",
    sessionId: sessionId ? sessionId : "[EMPTY/INVALID]"
  });

  if (!sessionId) {
    console.error("Session ID validation failed - session_id is missing or empty");
    return Response.json({
      error: "session_id is required",
      details: "session_id must be a non-empty string"
    }, { status: 400 });
  }

  console.log("Processing request:", { sessionId, hasPrompt: !!prompt, hasAiPrompt: !!ai_prompt });

  const timestamp = Date.now();
  let conversationId;

  try {
    if (prompt || ai_prompt) {
      console.log("Adding prompt to conversation...");
      conversationId = await fetchMutation(api.conversations.addPrompt, {
        sessionId,
        prompt,
        ai_prompt,
        timestamp,
      });
      console.log("Successfully added prompt, conversationId:", conversationId);
    } else {
      console.log("Upserting conversation...");
      conversationId = await fetchMutation(api.conversations.upsert, { sessionId });
      console.log("Successfully upserted conversation, conversationId:", conversationId);
    }
  } catch (error) {
    console.error("Failed to create/update conversation:", error);
    return Response.json({
      error: "Failed to create/update conversation",
      details: error instanceof Error ? error.message : "Unknown error",
      sessionId,
      operation: prompt || ai_prompt ? "addPrompt" : "upsert"
    }, { status: 500 });
  }

  // Validate conversationId before proceeding
  if (!conversationId) {
    console.error("No conversationId returned from mutation");
    return Response.json({
      error: "Failed to get conversation ID",
      details: "Conversation mutation did not return an ID"
    }, { status: 500 });
  }

  const rawUsage = requestBody.usage as Record<string, any> | undefined;
  if (rawUsage && typeof rawUsage === "object") {
    try {
      console.log("Processing usage data...");
      const cache_creation = typeof rawUsage.cache_creation === "object" && rawUsage.cache_creation !== null ? rawUsage.cache_creation : {};
      const payload = {
        conversationId,
        cache_creation_input_tokens: Number(rawUsage.cache_creation_input_tokens) || 0,
        cache_read_input_tokens: Number(rawUsage.cache_read_input_tokens) || 0,
        output_tokens: Number(rawUsage.output_tokens) || 0,
        ephemeral_1h_input_tokens: Number(rawUsage.ephemeral_1h_input_tokens) || 0,
        cache_creation_ephemeral_5m_input_tokens: Number((cache_creation as any).ephemeral_5m_input_tokens) || 0,
        cache_creation_ephemeral_1h_input_tokens: Number((cache_creation as any).ephemeral_1h_input_tokens) || 0,
      };

      console.log("Usage payload:", payload);
      await fetchMutation(api.usage.upsert, payload);
      console.log("Successfully upserted usage data");
    } catch (error) {
      console.error("Failed to upsert usage data:", error);
      return Response.json({
        error: "Failed to save usage data",
        details: error instanceof Error ? error.message : "Unknown error",
        conversationId,
        usageData: rawUsage
      }, { status: 500 });
    }
  }

  console.log("Request completed successfully");
  return Response.json({ ok: true, conversationId });
}
