import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
 

interface RequestBody {
  prompt?: string;
  ai_prompt?: string;
  session_id?: string;
}

export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {}

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const requestBody = body as RequestBody;
  const prompt = typeof requestBody.prompt === "string" && requestBody.prompt.trim() !== "" ? requestBody.prompt : undefined;
  const ai_prompt = typeof requestBody.ai_prompt === "string" && requestBody.ai_prompt.trim() !== "" ? requestBody.ai_prompt : undefined;
  const sessionId = typeof requestBody.session_id === "string" ? requestBody.session_id : "";

  if (!sessionId || (!prompt && !ai_prompt)) {
    return Response.json({ error: "session_id and one of prompt or ai_prompt are required" }, { status: 400 });
  }

  const timestamp = Date.now();
  let finalPrompt = prompt;
  let finalAiPrompt = ai_prompt;

  const conversationId = await fetchMutation(api.conversations.addPrompt, {
    sessionId,
    prompt: finalPrompt,
    ai_prompt: finalAiPrompt,
    timestamp,
  });

  return Response.json({
    ok: true,
    conversationId
  });
}
