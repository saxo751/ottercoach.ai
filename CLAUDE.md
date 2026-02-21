# BJJ Coach Bot — System Description

## What This Is

A conversational jiu-jitsu coach that lives wherever the user already is — Telegram, WhatsApp, or a web interface. Not an app — a relationship. The user texts their coach, the coach texts back. Behind the conversation, the system maintains a profile of skills, training history, goals, and technique knowledge. The coach uses this data to give smart, timely, personalized guidance.

**The core insight:** The interface IS the accountability mechanism. Nobody stops responding to their coach. The database and tracking are just what makes the conversation intelligent.

**What makes this different from everything else:** Every BJJ app on the market (BJJ Notes, BJJ Buddy, Grappling AI, Kesa, BetterBJJ, Kimura, etc.) is a passive tool the user has to remember to open. None of them text you before training with a plan. None of them follow up after. None of them feel like a person. We are the first proactive, conversational BJJ coach.

---

## Architecture Overview

The system has three abstraction layers that keep the core coaching engine independent of any specific platform or AI provider:

```
+---------------------------------------------+
|              Channel Adapters               |
|  Telegram | WhatsApp | Web (Angular)        |
+--------------------+------------------------+
                     | ChannelAdapter interface
+--------------------v------------------------+
|            Core Coaching Engine             |
|  Onboarding | Check-in | Briefing | Debrief |
|  Free Chat | Scheduler | Recommendations    |
+--------------------+------------------------+
                     | AIProvider interface
+--------------------v------------------------+
|              AI Providers                   |
|       Anthropic | OpenAI | (future)         |
+---------------------------------------------+
```

The coaching engine never knows which messaging platform or which LLM it's talking to. It sends and receives messages through generic interfaces.

---

## Tech Stack

### Backend (Node.js / TypeScript)
- **Runtime:** Node.js / TypeScript
- **API Server:** Express or Fastify — REST API consumed by the Angular frontend and used internally by channel adapters
- **Database:** SQLite via `better-sqlite3` (v1 — swap for Postgres later if needed)
- **Scheduler:** `node-cron` for timed messages (morning check-ins, pre-session briefings, post-session debriefs)
- **Config:** `.env` for secrets and settings

### AI Layer (Model-Agnostic)
All coaching logic talks to a generic `AIProvider` interface — never directly to a specific SDK.

```typescript
interface AIProvider {
  sendMessage(
    systemPrompt: string,
    messages: ConversationMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string>;
}
```

- **Supported providers:**
  - `AnthropicProvider` — uses `@anthropic-ai/sdk`, e.g. `claude-sonnet-4-20250514`
  - `OpenAIProvider` — uses `openai`, e.g. `gpt-4o`
  - Extendable: implement the interface for any provider that supports chat completions
- **Config:** Set `AI_PROVIDER=anthropic` or `AI_PROVIDER=openai` in `.env`, plus the corresponding API key and model name. Swap models via config, not code changes.

### Messaging Layer (Platform-Agnostic)
The core engine sends and receives through a generic `ChannelAdapter` interface.

```typescript
interface ChannelAdapter {
  sendMessage(userId: string, text: string): Promise<void>;
  sendButtons(userId: string, text: string, buttons: Button[]): Promise<void>;
  onMessage(callback: (userId: string, text: string, platform: string) => void): void;
  onButtonPress(callback: (userId: string, data: string, platform: string) => void): void;
  start(): Promise<void>;
}
```

- **Adapters:**
  - `TelegramAdapter` — uses `telegraf`. First messaging implementation.
  - `WhatsAppAdapter` — future. WhatsApp Business API or Twilio.
  - `WebAdapter` — connects to the Angular frontend via WebSocket (real-time chat) and REST (dashboard data).
- Platform-specific features (Telegram inline keyboards, WhatsApp rich cards, web UI components) are handled inside each adapter, not in core logic.

### Web Frontend (Angular)
- **Framework:** Angular (latest stable)
- **Communication:** WebSocket for real-time chat, REST for dashboard data
- **Key views:**
  - **Chat view** — Primary experience. Same conversational flow as messaging apps but in a browser.
  - **Dashboard** — Training stats, skill snapshot, session history, current focus period. Read-only visualization of what the coach already tracks.
  - **Technique library** — Browse known techniques, confidence levels, last trained dates. (May defer to later phase.)
- **Auth:** Simple auth for v1 (email/password or magic link).
- **Styling:** Clean, minimal. This is a coaching tool, not a social app.

### User Identity

Each user has a platform-agnostic internal UUID. A mapping table (`user_channels`) links internal IDs to platform-specific IDs (Telegram user ID, WhatsApp phone number, web auth ID). A single user could be reached on multiple channels — message goes to whichever is marked primary.

---

## The Daily Loop

Three scheduled touchpoints per training day:

**1. Morning Check-in (~8am user timezone)**
Short: "Training today?" If yes -> "What time?" If no -> that's fine, maybe a quick tip. If no response -> one gentle nudge max. Never nag. Learn their schedule over time and stop asking on consistent rest days.

**2. Pre-Session Briefing (60-90 min before stated training time)**
This is the highest-leverage moment in the product. A focused 2-4 sentence message on what to work on today, drawn from: current focus area, recent struggles, skill gaps, spaced repetition queue. Example: "Tonight, focus on retaining half guard when they try to flatten you. Fight for the underhook early before they settle their weight." Optional video link if one is saved.

**3. Post-Session Debrief (2hrs after training, or next morning for late sessions)**
Conversational, multi-turn. Starts with "How did training go?" then follows up based on the briefing: "Did you get to work on the half guard?" "Hit any sweeps?" "Anything new from class?" The coach extracts structured data invisibly from the conversation — positions worked, techniques attempted, what worked, what didn't, new things learned. Updates the database without the user ever feeling like they're logging.

---

## Onboarding

The first conversation feels like meeting a new coach, not filling out a form. Gather through natural dialogue (one or two questions at a time, acknowledge answers, build rapport):

- Name / what to be called
- Experience (how long training)
- Belt rank
- Favorite positions (top game, guard, etc.)
- Perceived weaknesses
- Game style preference (pressure, speed, guard, wrestling)
- Training frequency and typical days/times
- Injuries or limitations
- Short-term goals

Progressive profiling: don't learn everything day one. Fill gaps organically through debriefs over weeks.

---

## Free Conversation

The user can message the coach anytime outside the daily loop:
- Ask technique questions
- Report on open mat or competition
- Change focus areas or goals
- Ask what they've been working on
- Get help with competition prep
- Share video links to save

The bot handles all of this naturally, updating profile/goals/focus as needed.

---

## Database Schema

```sql
-- Core user profile (platform-agnostic)
users (
  id TEXT PRIMARY KEY,           -- Internal UUID
  name TEXT,
  belt_rank TEXT,                -- white/blue/purple/brown/black
  experience_months INTEGER,
  preferred_game_style TEXT,
  training_days TEXT,            -- JSON array: ["monday","wednesday","friday"]
  typical_training_time TEXT,    -- "19:00"
  injuries_limitations TEXT,
  current_focus_area TEXT,
  goals TEXT,
  timezone TEXT,                 -- "America/New_York"
  conversation_mode TEXT,        -- onboarding/idle/check_in/briefing/debrief/free_chat
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at DATETIME,
  updated_at DATETIME
)

-- Maps internal user IDs to platform-specific identities
user_channels (
  id INTEGER PRIMARY KEY,
  user_id TEXT,                  -- FK users
  platform TEXT,                 -- "telegram" / "whatsapp" / "web"
  platform_user_id TEXT,         -- Telegram ID, phone number, web auth ID
  is_primary BOOLEAN DEFAULT TRUE,
  created_at DATETIME,
  UNIQUE(platform, platform_user_id)
)

-- Positions the user knows/is learning
positions (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  name TEXT,                     -- "closed guard", "mount top", "half guard bottom"
  category TEXT,                 -- guard/top_control/bottom/transition
  confidence_level INTEGER,      -- 1-5
  last_trained_at DATETIME,
  notes TEXT,
  created_at DATETIME,
  updated_at DATETIME
)

-- Techniques: edges connecting positions
techniques (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  name TEXT,                     -- "scissor sweep", "cross collar choke"
  position_from INTEGER,         -- FK positions
  position_to INTEGER,           -- FK positions (nullable for subs)
  technique_type TEXT,           -- sweep/pass/submission/escape/transition/takedown
  confidence_level INTEGER,      -- 1-5
  times_drilled INTEGER DEFAULT 0,
  times_hit_in_rolling INTEGER DEFAULT 0,
  last_trained_at DATETIME,
  video_url TEXT,
  notes TEXT,
  created_at DATETIME,
  updated_at DATETIME
)

-- Training session log
training_sessions (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  date DATE,
  duration_minutes INTEGER,
  session_type TEXT,             -- gi/nogi/open_mat/competition/private
  positions_worked TEXT,         -- JSON array of position IDs
  techniques_worked TEXT,        -- JSON array of technique IDs
  rolling_notes TEXT,
  wins TEXT,                     -- what went well
  struggles TEXT,                -- what was hard
  new_techniques_learned TEXT,
  energy_level INTEGER,          -- 1-5
  raw_conversation TEXT,         -- full debrief chat for context
  created_at DATETIME
)

-- Multi-week training focus blocks
focus_periods (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  name TEXT,                     -- "Guard Retention Block"
  description TEXT,
  focus_positions TEXT,          -- JSON array
  focus_techniques TEXT,         -- JSON array
  start_date DATE,
  end_date DATE,                -- nullable = ongoing
  status TEXT,                  -- active/completed/paused
  created_at DATETIME
)

-- Conversation history for context (per user, recent messages)
conversation_history (
  id INTEGER PRIMARY KEY,
  user_id TEXT,
  role TEXT,                     -- "user" / "assistant"
  content TEXT,
  platform TEXT,                 -- which channel this came from
  created_at DATETIME
)
```

---

## AI Coach Architecture

Every LLM call (regardless of provider) constructs a system prompt with these layers:

**1. Coach Persona**
You are a friendly, knowledgeable jiu-jitsu coach communicating via text message. Concise, warm, conversational. Use BJJ terminology naturally. Push when appropriate, encourage always. You are NOT software — you are their coach. Think in systems and chains (Danaher-style), not isolated techniques. When recommending, connect to what they already know and what comes next. Depth beats breadth — encourage staying with a few techniques until solid rather than constantly introducing new ones. Principles matter: explain WHY things work, not just how.

**2. User Profile**
Full profile injection: belt, experience, goals, style, injuries, schedule, current focus.

**3. Current Focus Period**
What training block they're in, what positions/techniques are the priority.

**4. Recent Training History**
Last 5-10 sessions with summaries of what worked and didn't.

**5. Skill Snapshot**
Weakest and strongest positions. Techniques due for review (spaced repetition — not trained recently, confidence may have decayed). Techniques being actively developed.

**6. Conversation Mode**
What the current interaction is: onboarding, check_in, briefing, debrief, or free_chat. This shapes how the model responds and what data extraction is expected.

**7. Data Extraction Instructions (debrief mode)**
In debrief mode, the model should extract structured data from the conversation and return it as a JSON block after a delimiter (e.g. `---DATA---`) that the system strips before sending to the user. The JSON captures: positions worked, techniques attempted, outcomes, new techniques learned, struggles, confidence adjustments.

---

## Conversation Modes

Track per-user which mode the system is in:
- `onboarding` — gathering initial profile
- `idle` — no active conversation; user can message anytime
- `check_in` — morning check-in flow
- `briefing` — pre-session focus message sent
- `debrief` — post-session multi-turn conversation
- `free_chat` — user-initiated conversation outside daily loop

---

## Messaging UX (Cross-Platform)

These principles apply across all channels. Each adapter translates them into platform-native features:

- **Quick-reply buttons** for common responses ("Yes, training today" / "Rest day" / "Not sure"). Telegram: inline keyboards. Web: clickable buttons. WhatsApp: quick replies.
- **Confidence ratings** as buttons (1-5) when the coach asks "how confident do you feel with this technique?"
- **Short messages.** 1-4 sentences per message. Break longer advice into multiple messages with slight delays (feels like texting, not a wall of text).
- **Voice messages** — accept and process when the platform supports them (Telegram, WhatsApp natively; web via mic input). Use speech-to-text. Can defer to v2 if needed.
- **Video links** — accept YouTube/Instagram links and save to the relevant technique.

---

## Spaced Repetition Logic

Techniques and positions track `confidence_level` (1-5) and `last_trained_at`. Confidence decays over time. The recommendation engine surfaces techniques for review when:
- Confidence was low and hasn't been revisited
- It's been a long time since training (longer gap for high-confidence, shorter for low)
- It connects to the current focus area (systems thinking — don't review in isolation)

The pre-session briefing draws from this queue. "You haven't worked your butterfly sweep in 3 weeks — might be good to revisit tonight." Feels like a coach who remembers everything, not a study tool.

---

## Coaching Philosophy (Baked into the AI)

These principles from top BJJ minds should shape every coaching interaction:

- **Systems over techniques (Danaher):** Connect moves into chains and families. "You've been working mount — add armbar and cross collar choke for a complete attack system."
- **Depth over breadth (Danaher):** Resist suggesting new things constantly. Stay with a small number of high-percentage techniques until solid.
- **Focused blocks (Keenan Cornelius):** Pick specific techniques per phase (takedowns, passing, guard) and commit to them for a set period. The pre-session briefing IS this.
- **Accessibility drives retention (Gracie University):** Never feel overwhelming or like homework. Missed sessions fine. One-word debriefs fine. Adapt to the user's energy.
- **Spaced repetition is the killer feature (BJJ Mental Models):** Surface techniques for review at the right intervals through natural conversation, not flashcards.
- **Pre-session intention is highest leverage:** The moment someone reads the briefing and walks onto the mat with a plan — that's where transformation happens. Everything else exists to make that moment smart.

---

## Project Structure

```
bjj-coach/
|-- server/                          # Backend (Node.js / TypeScript)
|   |-- src/
|   |   |-- index.ts                 # Entry point — server, adapters, scheduler
|   |   |-- api/
|   |   |   |-- router.ts            # Express/Fastify route definitions
|   |   |   |-- routes/
|   |   |   |   |-- auth.ts          # Web auth endpoints
|   |   |   |   |-- chat.ts          # Chat message endpoints (for web client)
|   |   |   |   |-- profile.ts       # User profile endpoints (dashboard)
|   |   |   |   |-- sessions.ts      # Training session endpoints (dashboard)
|   |   |   |   |-- techniques.ts    # Technique library endpoints (dashboard)
|   |   |   |-- middleware/
|   |   |       |-- auth.ts          # Auth middleware
|   |   |-- core/
|   |   |   |-- engine.ts            # Core coaching engine — orchestrates all flows
|   |   |   |-- handlers/
|   |   |   |   |-- onboarding.ts    # First-conversation flow
|   |   |   |   |-- checkin.ts       # Morning check-in logic
|   |   |   |   |-- briefing.ts      # Pre-session focus message logic
|   |   |   |   |-- debrief.ts       # Post-session debrief logic
|   |   |   |   |-- freeChat.ts      # Open-ended conversation logic
|   |   |   |-- recommendations.ts   # Spaced repetition + skill gap engine
|   |   |-- ai/
|   |   |   |-- provider.ts          # AIProvider interface definition
|   |   |   |-- anthropic.ts         # Anthropic Claude implementation
|   |   |   |-- openai.ts            # OpenAI implementation
|   |   |   |-- factory.ts           # Creates provider from config
|   |   |   |-- prompts.ts           # System prompt builders per mode
|   |   |   |-- parser.ts            # Extract structured data from AI responses
|   |   |-- channels/
|   |   |   |-- adapter.ts           # ChannelAdapter interface definition
|   |   |   |-- telegram.ts          # Telegram adapter (telegraf)
|   |   |   |-- whatsapp.ts          # WhatsApp adapter (stub/future)
|   |   |   |-- web.ts               # Web adapter (WebSocket + REST bridge)
|   |   |   |-- manager.ts           # Manages active adapters, routes messages
|   |   |-- db/
|   |   |   |-- database.ts          # SQLite setup and connection
|   |   |   |-- migrations.ts        # Schema creation / migrations
|   |   |   |-- queries/
|   |   |       |-- users.ts
|   |   |       |-- channels.ts      # user_channels mapping
|   |   |       |-- positions.ts
|   |   |       |-- techniques.ts
|   |   |       |-- sessions.ts
|   |   |       |-- focusPeriods.ts
|   |   |       |-- conversations.ts # Conversation history
|   |   |-- scheduler/
|   |   |   |-- scheduler.ts         # node-cron jobs for daily loop
|   |   |-- utils/
|   |       |-- time.ts              # Timezone handling
|   |       |-- constants.ts
|   |-- data/                        # SQLite database lives here
|   |-- .env.example
|   |-- package.json
|   |-- tsconfig.json
|
|-- web/                             # Frontend (Angular)
|   |-- src/
|   |   |-- app/
|   |   |   |-- app.component.ts
|   |   |   |-- app.routes.ts
|   |   |   |-- core/
|   |   |   |   |-- services/
|   |   |   |   |   |-- auth.service.ts
|   |   |   |   |   |-- chat.service.ts       # WebSocket chat connection
|   |   |   |   |   |-- profile.service.ts     # REST calls for dashboard
|   |   |   |   |   |-- api.service.ts         # Base HTTP client
|   |   |   |   |-- guards/
|   |   |   |   |-- interceptors/
|   |   |   |-- features/
|   |   |   |   |-- chat/                      # Chat view (primary experience)
|   |   |   |   |   |-- chat.component.ts
|   |   |   |   |   |-- message-bubble.component.ts
|   |   |   |   |-- dashboard/                 # Training stats + history
|   |   |   |   |   |-- dashboard.component.ts
|   |   |   |   |   |-- session-history.component.ts
|   |   |   |   |   |-- skill-snapshot.component.ts
|   |   |   |   |-- auth/                      # Login / register
|   |   |   |   |   |-- login.component.ts
|   |   |   |   |-- techniques/                # Technique library (later phase)
|   |   |   |       |-- technique-list.component.ts
|   |   |   |-- shared/
|   |   |       |-- components/
|   |   |-- assets/
|   |   |-- environments/
|   |   |-- styles.css
|   |-- angular.json
|   |-- package.json
|   |-- tsconfig.json
|
|-- README.md
```

---

## Build Order

Implement incrementally. Each step should be usable and testable before moving to the next:

1. **Backend scaffolding** — Monorepo setup, server package.json, tsconfig, .env, Express/Fastify server running
2. **Database** — All tables with migrations, connection helper, query modules
3. **AI provider abstraction** — `AIProvider` interface, Anthropic implementation, factory. Test with a simple prompt.
4. **Channel adapter abstraction** — `ChannelAdapter` interface, Telegram adapter. Bot responds to /start.
5. **Core engine + onboarding** — Engine wires adapters to handlers. Onboarding conversation builds user profile via Telegram.
6. **Free chat** — LLM-powered conversation with full profile context, through Telegram
7. **Morning check-in** — Scheduled cron job + handler, delivered via whichever channel
8. **Pre-session briefing** — Triggered based on stated training time
9. **Post-session debrief** — Multi-turn conversation with data extraction into DB
10. **Web adapter + Angular scaffolding** — WebSocket bridge, Angular project, chat view. Same conversations now work in browser.
11. **Angular dashboard** — Profile, session history, skill snapshot. Read-only views of existing data.
12. **OpenAI provider** — Second AI provider implementation. Verify everything works with both.
13. **Skill tracking** — Confidence levels, last-trained dates, decay logic
14. **Recommendation engine** — Focus suggestions based on gaps, history, spaced repetition
15. **Focus periods** — Multi-week training blocks with progress tracking
16. **WhatsApp adapter** — When ready to expand channels

---

## Design Principles

- **Conversation first, data second.** User never feels like they're feeding a database.
- **Short messages.** 1-4 sentences per message. This is texting.
- **Don't be annoying.** One nudge max. Respect rest days. Adapt to energy.
- **Progressive profiling.** Learn more about their game over weeks, not a giant intake form.
- **Spaced repetition through conversation.** The killer feature. "Haven't worked butterfly sweep in 3 weeks — revisit tonight?"
- **Systems thinking.** Never recommend techniques in isolation. Connect to what they know and what comes next.
- **The pre-session briefing is the product.** Everything else exists to make that moment smart.
- **Platform-agnostic core.** The coaching engine never knows which channel or AI model it's using. All platform/model specifics live in adapters and providers.

---

## Environment Variables

```
# AI Configuration
AI_PROVIDER=anthropic              # "anthropic" or "openai"
AI_MODEL=claude-sonnet-4-20250514  # Model name for the selected provider
ANTHROPIC_API_KEY=xxx              # Required if AI_PROVIDER=anthropic
OPENAI_API_KEY=xxx                 # Required if AI_PROVIDER=openai

# Messaging Channels (enable the ones you want)
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=xxx
WHATSAPP_ENABLED=false
WHATSAPP_API_TOKEN=xxx

# Web
WEB_ENABLED=true
WEB_PORT=3000
JWT_SECRET=xxx                     # For web auth

# Database
DATABASE_PATH=./data/bjj-coach.db

# Defaults
DEFAULT_TIMEZONE=America/New_York
```

---

## Reference Files

These files contain additional context and can be consulted as needed:
- `bjj-technique-library.md` — 352 BJJ techniques organized by category (submissions, back takes, passes, sweeps, takedowns, escapes) and starting position. Use as reference for the technique database and recommendation engine.
- `bjj-learning-philosophy-research.md` — Research on coaching methodologies from Danaher, Keenan Cornelius, Gracie University, and BJJ Mental Models. Informs the coaching persona and AI system prompt.
- `bjj-competitive-landscape.md` — Analysis of existing BJJ apps, what users like and dislike about them, and where our product fits. Useful context for design decisions.
