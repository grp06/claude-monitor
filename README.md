# Claude Code N8N Webhooks

Modular webhook system that sends Claude Code events to n8n for processing and storage.

## ✅ Current Status

- [x] Claude Code setup working
- [x] User prompt submit hook sends to n8n
- [x] N8n calls LLM to rewrite prompts
- [x] Webhook system functional

## 🎯 Next Steps Roadmap

### Phase 1: Data Storage Foundation
- [x] **Set up Next.js app with Convex**
  - Initialize Next.js project in `convex-frontend/`
  - Install and configure Convex
  - Set up basic project structure

- [x] **Design Convex schema (Single-player MVP)**
  - conversations: `sessionId`
  - prompts: `conversationId`, `prompt`, `timestamp`
  - ai_prompts: `conversationId`, `ai_prompt`, `timestamp`

## Seed Data
- Run `npx convex dev` in another terminal.
- Seed prompts from `sampleData.jsonl`:
  - `node scripts/seed.mjs --file=sampleData.jsonl --session-id=seed-session-1`

- [ ] **Implement stop hook for transcript storage**
  - Modify `stop_n8n.py` to store full conversation transcripts
  - Add Convex mutation for conversation data
  - Handle large transcripts with LLM summarization

### Phase 2: Prompt Processing Pipeline
- [ ] **Create prompt cleaning AI agent**
  - Add n8n workflow for prompt processing after user submit
  - LLM extracts main prompt from context-heavy submissions
  - Store both raw and cleaned prompts in Convex

- [ ] **Async processing architecture**
  - User submit webhook returns immediately
  - Background processing cleans and stores prompts
  - Error handling for failed processing

### Phase 3: UI Development
- [ ] **Build conversation browser**
  - Toggleable UI with conversation names as headings
  - Display prompts within each conversation
  - Recent conversations view

- [ ] **Add "Suggest Improvements" feature**
  - Button to analyze prompts with LLM
  - Generate prompting tips and suggestions
  - Show improvement recommendations per prompt

## 🏗️ Architecture of the hooks part of the app

```
~/.claude/hooks/n8n/
├── shared_hook_utils.py    # Common utilities & webhook logic
├── stop_n8n.py            # Stop event hook → Convex storage
├── user_prompt_submit_n8n.py # User prompt hook → n8n → LLM rewrite
├── toggle_hook.py         # Enable/disable hooks
├── toggle_hook.sh         # Shell wrapper for toggle
├── convex-frontend/       # Next.js app with Convex
├── logs/                  # Execution logs
└── venv/                  # Python environment
```

## 🔧 Quick Setup

1. **Install dependencies**: `pip install -r requirements.txt`
2. **Enable hooks**: `./toggle_hook.sh toggle UserPromptSubmit`
3. **Monitor logs**: Check `logs/` directory

## 📊 Payload Structure
POST `/api/update-convex`

Body (JSON):
```json
{
  "session_id": "uuid",
  "prompt": "user input (optional)",
  "ai_prompt": "rewritten prompt (optional)",
  "transcript_summary": "optional"
}
```

Rules:
- `session_id` is required
- At least one of `prompt` or `ai_prompt` is required
Behavior:
- Creates/updates a conversation by `session_id`
- Writes `prompt` to `prompts`
- Writes `ai_prompt` to `ai_prompts`
