import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

function loadUrl() {
  let url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    try {
      const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
      for (const line of env.split("\n")) {
        const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
        if (m) {
          const key = m[1];
          let val = m[2];
          if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (key === "NEXT_PUBLIC_CONVEX_URL") {
            url = val;
            break;
          }
        }
      }
    } catch {}
  }
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return url;
}

function extractText(message) {
  if (!message) return "";
  const c = message.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map((p) => (p && typeof p.text === "string" ? p.text : "")).join(" ");
  if (c && typeof c.text === "string") return c.text;
  return "";
}

async function main() {
  let file = "sampleData.jsonl";
  let sessionId = "seed-session-1";
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--file=")) file = arg.slice(7);
    else if (arg.startsWith("--session-id=")) sessionId = arg.slice(13);
  }
  const url = loadUrl();
  const convex = new ConvexHttpClient(url);
  const text = readFileSync(resolve(process.cwd(), file), "utf8");
  const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
  for (const line of lines) {
    try {
      const evt = JSON.parse(line);
      if (evt.type !== "user") continue;
      const t = extractText(evt.message);
      const ts = typeof evt.timestamp === "string" ? new Date(evt.timestamp).getTime() : Number(evt.timestamp ?? Date.now());
      await convex.mutation(api.conversations.addPrompt, { sessionId, prompt: t, timestamp: ts });
    } catch {}
  }
}

main();
