"use client";

import { useMemo, useState, Fragment, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

function formatTs(ts?: number) {
  if (!ts) return "";
  const date = new Date(ts);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.478a18.093 18.093 0 0 1-3.75 0M12 12.75h.008v.008H12v-.008Z"
      />
    </svg>
  );
}

function ConversationCard({
  conversationId,
  sessionId,
  onIgnore,
}: {
  conversationId: Id<"conversations">;
  sessionId: string;
  onIgnore: (sessionId: string) => void;
}) {
  const prompts = useQuery(api.prompts.listForConversation, { conversationId });
  const aiPrompts = useQuery(api.ai_prompts.listForConversation, { conversationId });
  const usage = useQuery(api.usage.getUsageForConversation, { conversationId });
  const [adviceTips, setAdviceTips] = useState<string[] | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  const loadingMessages = [
    "Analyzing user prompts",
    "Extracting context from the conversation",
    "Identifying goals and constraints",
    "Applying prompt engineering patterns",
    "Refining instructions and guardrails",
    "Generating personalized recommendations",
    "Validating advice quality",
    "Preparing actionable advice"
  ];

  useEffect(() => {
    if (!adviceLoading) {
      setMessageIndex(0);
      return;
    }
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 1400);
    return () => clearInterval(id);
  }, [adviceLoading]);

  const promptPairs = useMemo(() => {
    if (!prompts || !aiPrompts) return [];
    const pSorted = [...prompts].sort((a, b) => a.timestamp - b.timestamp);
    const aSorted = [...aiPrompts].sort((a, b) => a.timestamp - b.timestamp);
    const n = Math.min(pSorted.length, aSorted.length);
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({
        prompt: pSorted[i].prompt,
        ai_prompt: aSorted[i].ai_prompt,
        timestamp: pSorted[i].timestamp
      });
    }
    return out;
  }, [prompts, aiPrompts]);

  const handleAdvice = async () => {
    setAdviceError(null);
    setAdviceLoading(true);
    setAdviceTips(null);
    try {
      const payload = { session_id: sessionId, promptPairs };
      const res = await fetch("https://gpickett00.app.n8n.cloud/webhook/ffa5d5e2-b46b-446c-a9a3-50389256984d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (Array.isArray(data)) setAdviceTips(data as string[]);
      else setAdviceError("No advice returned");
    } catch (e) {
      setAdviceError("Failed to fetch advice");
    } finally {
      setAdviceLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!prompts && !aiPrompts) return {
      count: 0,
      created: undefined as number | undefined,
      updated: undefined as number | undefined
    };
    const allTs: number[] = [];
    if (prompts) for (const p of prompts) allTs.push(p.timestamp);
    if (aiPrompts) for (const a of aiPrompts) allTs.push(a.timestamp);
    const created = allTs.length ? Math.min(...allTs) : undefined;
    const updated = allTs.length ? Math.max(...allTs) : undefined;
    const count = prompts?.length ?? 0;
    return { count, created, updated };
  }, [prompts, aiPrompts]);

  const pairs = useMemo(() => {
    if (!prompts || !aiPrompts) return [] as { p: any; a: any }[];
    const pSorted = [...prompts].sort((a, b) => a.timestamp - b.timestamp);
    const aSorted = [...aiPrompts].sort((a, b) => a.timestamp - b.timestamp);
    const n = Math.min(pSorted.length, aSorted.length);
    const out = [] as { p: any; a: any }[];
    for (let i = 0; i < n; i++) out.push({ p: pSorted[i], a: aSorted[i] });
    return out;
  }, [prompts, aiPrompts]);


  return (
    <details className="group bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 ease-out overflow-hidden backdrop-blur-sm">
      <summary className="cursor-pointer list-none p-6 hover:bg-gradient-to-r hover:from-primary-muted/30 hover:to-accent-muted/20 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-subtle flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-semibold tracking-wide">
                {sessionId.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground tracking-tight">
                Session {sessionId.slice(-4)}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted font-medium">
                  {stats.count} {stats.count === 1 ? "prompt" : "prompts"}
                </span>
                {stats.created && (
                  <span className="text-xs text-muted-subtle bg-border-subtle px-2 py-1 rounded-full">
                    {formatTs(stats.created)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              title="Ignore session"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onIgnore(sessionId);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
              </svg>
            </button>
            <svg
              className="w-5 h-5 text-muted-subtle transition-all duration-300 group-open:rotate-180 group-open:text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </summary>

      <div className="px-6 pb-6">
        {usage && (
          <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-background-subtle/30 to-card/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <h4 className="text-sm font-semibold text-foreground-subtle uppercase tracking-wider">Token Usage</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded-lg bg-background/50">
                  <span className="text-muted">Output Tokens:</span>
                  <span className="font-mono font-semibold text-foreground">{usage.output_tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-background/50">
                  <span className="text-muted">Cache Creation Input:</span>
                  <span className="font-mono font-semibold text-foreground">{usage.cache_creation_input_tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-background/50">
                  <span className="text-muted">Cache Read Input:</span>
                  <span className="font-mono font-semibold text-foreground">{usage.cache_read_input_tokens.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded-lg bg-background/50">
                  <span className="text-muted">Ephemeral 1h Input:</span>
                  <span className="font-mono font-semibold text-foreground">{usage.ephemeral_1h_input_tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-background/50">
                  <span className="text-muted">Cache Creation 5m:</span>
                  <span className="font-mono font-semibold text-foreground">{usage.cache_creation_ephemeral_5m_input_tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-background/50">
                  <span className="text-muted">Cache Creation 1h:</span>
                  <span className="font-mono font-semibold text-foreground">{usage.cache_creation_ephemeral_1h_input_tokens.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {adviceLoading && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div className="w-full max-w-md mx-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="flex-1">
                  <div className="text-sm text-muted-subtle">Getting prompting advice</div>
                  <div key={messageIndex} className="fade-slide text-foreground font-medium">
                    {loadingMessages[messageIndex]}...
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {adviceTips && adviceTips.length > 0 && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-muted/30 to-accent-muted/20 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <LightbulbIcon className="w-5 h-5 text-primary" />
              <h4 className="text-sm font-semibold text-foreground-subtle uppercase tracking-wider">Prompting Advice</h4>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-sm text-foreground">
              {adviceTips.map((tip, i) => (
                <li key={i} className="leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>
        )}
        {adviceError && (
          <div className="mb-6 rounded-xl border border-error bg-error-muted/40 text-error px-4 py-3 text-sm">
            {adviceError}
          </div>
        )}
        <div className="grid grid-cols-2 gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted-subtle"></div>
            <h4 className="text-sm font-semibold text-foreground-subtle uppercase tracking-wider">Original Prompt</h4>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent"></div>
            <h4 className="text-sm font-semibold text-foreground-subtle uppercase tracking-wider">AI Rewritten</h4>
          </div>
          {pairs.length === 0 ? (
            <>
              <div className="text-muted italic flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                No prompts yet
              </div>
              <div className="text-muted italic flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                No rewritten prompts yet
              </div>
            </>
          ) : (
            pairs.map((row) => (
              <Fragment key={`row-${row.p._id}-${row.a._id}`}>
                <div className="rounded-xl border border-border bg-background-subtle/50 p-5 font-mono text-sm leading-relaxed shadow-sm">
                  <div className="text-foreground whitespace-pre-wrap">{row.p.prompt}</div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary-muted/20 to-accent-muted/10 p-5 font-mono text-sm leading-relaxed shadow-sm">
                  <div className="text-foreground whitespace-pre-wrap">{row.a.ai_prompt}</div>
                </div>
              </Fragment>
            ))
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t border-border-subtle">
          <button onClick={handleAdvice} disabled={adviceLoading} className={`inline-flex items-center gap-3 px-6 py-3 text-white border-0 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg ${adviceLoading ? "bg-muted" : "bg-gradient-to-r from-primary to-accent hover:from-primary-subtle hover:to-accent-subtle"}`}>
            <LightbulbIcon className="w-5 h-5" />
            <span>{adviceLoading ? "Getting Advice..." : "Get Prompting Advice"}</span>
          </button>
          
        </div>
      </div>
    </details>
  );
}

export default function Home() {
  const conversations = useQuery(api.conversations.list);
  const [ignored, setIgnored] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ignoredSessions");
      if (raw) setIgnored(JSON.parse(raw));
    } catch {}
  }, []);

  const handleIgnore = (sid: string) => {
    setIgnored((prev) => {
      const next = prev.includes(sid) ? prev : [...prev, sid];
      try {
        localStorage.setItem("ignoredSessions", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  if (conversations === undefined) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background-subtle to-primary-muted/5 flex items-center justify-center p-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <div className="text-muted-subtle text-lg">Loading your conversations</div>
        </div>
      </main>
    );
  }

  if (conversations.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background-subtle to-primary-muted/5 flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-lg">
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to Prompt Studio
            </h1>
            <p className="text-muted-subtle text-lg leading-relaxed">
              Simply start using Claude Code, and your conversation history and AI improvements will appear here automatically.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background-subtle to-primary-muted/5 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Conversation History
            </h1>
          </div>
          <p className="text-muted-subtle text-lg pl-11">
            View and analyze your prompt conversations with AI improvements
          </p>
        </div>

        <div className="space-y-8">
          {conversations
            .filter((c) => !ignored.includes(c.sessionId))
            .map((c) => (
              <ConversationCard
                key={c._id}
                conversationId={c._id}
                sessionId={c.sessionId}
                onIgnore={handleIgnore}
              />
            ))}
        </div>
      </div>
    </main>
  );
}
