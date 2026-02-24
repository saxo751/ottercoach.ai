# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Server (bjj-coach/server/)
```bash
npm run dev              # Hot-reload dev server (tsx watch) on :3000
npm run build            # TypeScript compile to dist/
npm start                # Run compiled output (node dist/index.js)
npm run enrich-videos    # Enrich technique library with YouTube URLs
npm run generate-descriptions  # Generate technique descriptions via AI
```

### Web Frontend (bjj-coach/web/)
```bash
npm start                # Angular dev server on :4200 (proxies API to :3000)
npm run build            # Production build
npm run watch            # Dev build with watch mode
npm test                 # Karma/Jasmine (infrastructure exists, no tests written yet)
```

### Running Both Together
Start the server first (`npm run dev` in `bjj-coach/server/`), then the Angular app (`npm start` in `bjj-coach/web/`). The Angular dev server proxies `/api` and `/ws` to localhost:3000.

### Environment Setup
Copy `bjj-coach/server/.env.example` to `bjj-coach/server/.env` and fill in API keys. Required: `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN` (if Telegram enabled), `JWT_SECRET`.

## Architecture

Three-layer architecture where the core coaching engine is isolated from both messaging platforms and AI providers:

```
Channel Adapters (Telegram, WebSocket, WhatsApp)
        ↕ ChannelAdapter interface
Core Coaching Engine (mode-based message routing)
        ↕ AIProvider interface
AI Providers (Anthropic Claude — only one implemented)
```

### Server Boot Sequence (src/index.ts)
1. `initDatabase()` — SQLite with WAL mode, runs migrations, seeds 352-technique library
2. `createAIProvider()` — Factory picks provider from `AI_PROVIDER` env var
3. Express app with CORS + routes (`/api/auth`, `/api/dashboard`, `/api/ideas`, `/api/admin`)
4. `ChannelManager` registers Telegram and/or Web adapters
5. `CoachingEngine.start()` — wires adapter message callbacks to mode-based handlers
6. `Scheduler.start()` — cron job every 10 minutes for pre/post-session triggers
7. HTTP server listens on port 3000 (shared with WebSocket)

### Message Flow
User message → ChannelAdapter → ChannelManager → CoachingEngine → mode-based handler → AIProvider → response back through chain

### Conversation Mode State Machine
The `users.conversation_mode` field determines which handler processes messages:
- `onboarding` → multi-turn profile building, AI extracts structured fields
- `idle` → transitions to `free_chat` on user message
- `free_chat` → full-context conversational coaching
- `briefing` → pre-session focus message (scheduler-triggered or user response)
- `debrief` → post-session data extraction via `---DATA---` delimiter
- `check_in` → not fully implemented, falls through to free_chat

### AI Response Parsing (---DATA--- Delimiter)
Handlers can instruct the AI to return structured data after a `---DATA---` delimiter. `parseAIResponse()` in `src/ai/parser.ts` splits the response: text goes to the user, JSON goes to the database. Used in onboarding (profile extraction) and debrief (session data extraction).

### System Prompt Construction
Each handler builds mode-specific system prompts (`src/ai/prompts.ts`) that inject: coach persona, full user profile, positions, techniques, recent sessions, active focus period, goals, and mode-specific instructions.

### Database
SQLite via `better-sqlite3`. Migrations in `src/db/migrations.ts` (8 migrations, sequential versioning). Schema auto-migrates on startup. Key tables: `users`, `user_channels`, `positions`, `techniques`, `training_sessions`, `focus_periods`, `goals`, `conversation_history`, `technique_library` (352 seeded BJJ techniques).

### User Identity
Platform-agnostic UUID in `users.id`. The `user_channels` table maps to platform-specific IDs (Telegram user ID, web auth ID). `findOrCreateUser()` auto-creates on first message.

### Web Frontend (Angular 18)
Standalone components with lazy-loaded routes. `ChatService` manages WebSocket connection for real-time messaging. `ApiService` handles REST calls for dashboard data. Auth via JWT stored in localStorage. Auth guard on `/chat`, `/dashboard`, `/profile`.

### Scheduler
`node-cron` runs every 10 minutes, checks each user's `typical_training_time` to trigger briefings (30-60 min before) and debriefs (60+ min after). Tracks `last_scheduled_action` and `last_scheduled_date` on the user record to avoid duplicates.

## Key Patterns

- **Adapter pattern everywhere**: Both `ChannelAdapter` and `AIProvider` are interfaces. Engine never imports platform/provider specifics.
- **Factory for AI providers**: `src/ai/factory.ts` — swap via `AI_PROVIDER` env var. Currently only Anthropic is implemented.
- **Express JSON limit**: Set to 2MB (`express.json({ limit: '2mb' })`) for large admin payloads.
- **WebSocket auth**: JWT token sent as first message after connection. Web adapter validates before accepting messages.
- **Conversation history**: Stored per-user in `conversation_history` table, last 50 messages sent to AI for context.

## Implementation Status

**Working**: Telegram bot, WebSocket chat, onboarding flow, free chat, pre-session briefing, post-session debrief, JWT auth (signup/login), dashboard API, technique library (352 techniques with YouTube URLs), admin interface, scheduler.

**Not yet implemented**: Morning check-in mode, spaced repetition recommendation engine (DB fields exist but no logic), OpenAI provider (interface exists), WhatsApp adapter (stubbed), email magic links (table exists).

## Product Context

This is a conversational BJJ coach — not an app, a relationship. The user texts their coach, the coach texts back. The interface IS the accountability mechanism.

### The Daily Loop
1. **Morning check-in** (~8am) — "Training today?" Quick yes/no.
2. **Pre-session briefing** (60-90 min before training) — 2-4 sentences on what to focus on. This is the highest-leverage moment in the product.
3. **Post-session debrief** (after training) — Conversational extraction of what happened. Data captured invisibly.

### Coaching Philosophy (Shapes All AI Prompts)
- **Systems over techniques (Danaher)**: Connect moves into chains, don't teach in isolation
- **Depth over breadth**: Stay with few techniques until solid, resist suggesting new things constantly
- **Focused blocks (Keenan)**: Commit to specific techniques per training phase
- **The pre-session briefing is the product** — everything else exists to make that moment smart
- **Conversation first, data second**: User never feels like they're feeding a database
- **Short messages**: 1-4 sentences. This is texting, not a wall of text.

### Reference Files
- `bjj-technique-library.md` — 352 techniques organized by category and position
- `bjj-learning-philosophy-research.md` — Coaching methodology research
- `bjj-competitive-landscape.md` — Competitive analysis

## Environment Variables

```
AI_PROVIDER=anthropic              # "anthropic" or "openai"
AI_MODEL=claude-sonnet-4-20250514
ANTHROPIC_API_KEY=xxx
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=xxx
WEB_ENABLED=true
WEB_PORT=3000
JWT_SECRET=xxx
DATABASE_PATH=./data/bjj-coach.db
DEFAULT_TIMEZONE=America/New_York
```
