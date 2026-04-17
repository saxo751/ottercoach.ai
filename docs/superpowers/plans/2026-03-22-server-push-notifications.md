# Server — Push Notifications & API Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add push notification support via Expo Push API, add REST chat endpoints for mobile fallback, and remove Telegram as a channel.

**Architecture:** New `PushService` wraps expo-server-sdk. The `ChannelManager` gets a `sendToUser()` method that checks WebSocket connectivity first, then falls back to push. New REST endpoints handle push token registration and chat message fallback. Telegram code is fully removed.

**Tech Stack:** Node.js, Express, expo-server-sdk, better-sqlite3, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-22-react-native-mobile-app-design.md`

---

## File Map

### New Files
- `src/push/push-service.ts` — Wraps expo-server-sdk, sends push notifications
- `src/api/routes/push.ts` — `POST /api/push/register`, `POST /api/push/unregister`
- `src/api/routes/chat.ts` — `GET /api/chat/history`, `POST /api/chat/messages`

### Modified Files
- `src/utils/constants.ts` — Add `'mobile'` to PLATFORMS, remove `'telegram'`
- `src/db/migrations.ts` — Migration v18: drop `telegram_bot_token`, add `push_token` to `user_channels`
- `src/db/types.ts` — Remove `telegram_bot_token` from `User`, add `push_token` to `UserChannel`
- `src/db/queries/users.ts` — Remove `telegram_bot_token` from createUser/updateUser
- `src/db/queries/channels.ts` — Add `getUserPushTokens()`, `registerPushToken()`, `removePushToken()`
- `src/db/queries/conversations.ts` — Add `getMessagesSince()`
- `src/channels/manager.ts` — Add `sendToUser()` method with WebSocket/push fallback
- `src/channels/web.ts` — Add `isClientConnected()` method
- `src/index.ts` — Remove Telegram, mount new routes
- `src/api/routes/auth.ts` — Remove Telegram imports and validation
- `src/api/routes/dashboard.ts` — Remove Telegram endpoints and imports
- `src/scheduler/scheduler.ts` — Replace `sendMessage` with `sendToUser` in delivery methods
- `package.json` — Add `expo-server-sdk`, remove `telegraf`

### Deleted Files
- `src/channels/telegram.ts`

---

## Task 1: Add `mobile` platform and database migration

**Files:**
- Modify: `src/utils/constants.ts:15`
- Modify: `src/db/migrations.ts` (append migration v18)
- Modify: `src/db/types.ts`
- Modify: `src/db/queries/users.ts`

- [ ] **Step 1: Update PLATFORMS constant**

In `src/utils/constants.ts`, replace line 15:
```typescript
export const PLATFORMS = ['whatsapp', 'web', 'mobile'] as const;
```

- [ ] **Step 2: Remove `telegram_bot_token` from User type and add `push_token` to UserChannel**

In `src/db/types.ts`:
- Delete the `telegram_bot_token: string | null;` line from the `User` interface
- Add `push_token: string | null;` to the `UserChannel` interface

- [ ] **Step 3: Remove `telegram_bot_token` from user queries**

In `src/db/queries/users.ts`:
- Remove `telegram_bot_token` from the default object in `createUser()`
- Remove `telegram_bot_token` from the INSERT column list and VALUES clause
- Remove `'telegram_bot_token'` from the `allowed` array in `updateUser()`

- [ ] **Step 4: Add migration v18**

SQLite added DROP COLUMN in 3.35.0 (2021). `better-sqlite3` bundles SQLite 3.43+, so this is safe. Append to the migrations array in `src/db/migrations.ts`:
```typescript
{
  version: 18,
  description: 'Drop telegram_bot_token, add push_token to user_channels',
  up: `
    ALTER TABLE users DROP COLUMN telegram_bot_token;
    ALTER TABLE user_channels ADD COLUMN push_token TEXT;
  `,
},
```

Verify the SQLite version at runtime if concerned:
```bash
cd bjj-coach/server && node -e "const db = require('better-sqlite3')(':memory:'); console.log(db.prepare('select sqlite_version()').get())"
```
Expected: 3.43.0 or higher (DROP COLUMN supported).

- [ ] **Step 5: Commit**

```bash
git add src/utils/constants.ts src/db/migrations.ts src/db/types.ts src/db/queries/users.ts
git commit -m "feat: add mobile platform, migration to drop telegram_bot_token and add push_token"
```

Note: Build will fail until Task 2 removes Telegram imports. That's expected.

---

## Task 2: Remove Telegram channel

**Files:**
- Delete: `src/channels/telegram.ts`
- Modify: `src/index.ts:12,49-50,52-53,66-67`
- Modify: `src/api/routes/auth.ts` (remove Telegraf import, validate-telegram endpoint, bot startup)
- Modify: `src/api/routes/dashboard.ts` (remove Telegraf import, telegram endpoints, token masking)
- Modify: `package.json` (remove telegraf dependency)

- [ ] **Step 1: Delete telegram adapter file**

Delete `src/channels/telegram.ts`.

- [ ] **Step 2: Clean up index.ts**

In `src/index.ts`:
- Remove line 12: `import { TelegramBotManager } from './channels/telegram.js';`
- Remove lines 49-50: comment + `const telegramManager = new TelegramBotManager(db);`
- Change line 52 to: `app.use('/api/auth', createAuthRouter(db));`
- Change line 53 to: `app.use('/api/dashboard', createDashboardRouter(db, ai));`
- Remove lines 66-67: comment + `channelManager.registerAdapter('telegram', telegramManager);`

- [ ] **Step 3: Clean up auth.ts**

In `src/api/routes/auth.ts`:
- Remove line 3: `import { Telegraf } from 'telegraf';`
- Remove line 11: `import type { TelegramBotManager } from '../../channels/telegram.js';`
- Change line 16 signature to: `export function createAuthRouter(db: Database.Database): Router`
- In the signup handler (line 23): remove `telegram_bot_token` from destructuring
- Remove the Telegram token validation block (~lines 48-60)
- Remove `telegram_bot_token` from the `createUser()` call (~line 71)
- Remove the bot startup block (~lines 79-86)
- Delete the entire `POST /validate-telegram` endpoint (~lines 156-171)

- [ ] **Step 4: Clean up dashboard.ts**

In `src/api/routes/dashboard.ts`:
- Remove line 2: `import { Telegraf } from 'telegraf';`
- Remove line 13: `import type { TelegramBotManager } from '../../channels/telegram.js';`
- Change line 17 signature to: `export function createDashboardRouter(db: Database.Database, ai?: AIProvider): Router`
- In GET `/profile`: remove `telegram_bot_token` masking and `has_telegram_bot` assignment
- In PUT `/profile`: remove `has_telegram_bot` and token masking from response
- Delete the entire Telegram bot management section (`/telegram/validate`, `/telegram/token` endpoints, ~lines 447-498)

- [ ] **Step 5: Remove telegraf dependency**

Run: `cd bjj-coach/server && npm uninstall telegraf`

- [ ] **Step 6: Build and verify**

Run: `cd bjj-coach/server && npm run build`
Expected: Clean compilation with no Telegram references

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: remove Telegram channel adapter and all related code"
```

---

## Task 3: Create PushService

**Files:**
- Create: `src/push/push-service.ts`

- [ ] **Step 1: Install expo-server-sdk**

Run: `cd bjj-coach/server && npm install expo-server-sdk`

- [ ] **Step 2: Create PushService**

Create `src/push/push-service.ts`:
```typescript
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(
  pushToken: string,
  payload: PushPayload
): Promise<void> {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.warn(`[push] Invalid Expo push token: ${pushToken}`);
    return;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data,
  };

  try {
    const [ticket] = await expo.sendPushNotificationsAsync([message]);
    if ((ticket as any).status === 'error') {
      console.error(`[push] Error sending to ${pushToken}:`, (ticket as any).message);
    }
  } catch (err) {
    console.error(`[push] Failed to send push:`, err);
  }
}

export async function sendPushToMultiple(
  tokens: string[],
  payload: PushPayload
): Promise<string[]> {
  const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
  if (validTokens.length === 0) return [];

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title: payload.title,
    body: payload.body,
    data: payload.data,
  }));

  const staleTokens: string[] = [];

  try {
    const tickets = await expo.sendPushNotificationsAsync(messages);
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i] as any;
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        staleTokens.push(validTokens[i]);
      }
    }
  } catch (err) {
    console.error(`[push] Failed to send batch push:`, err);
  }

  return staleTokens;
}
```

- [ ] **Step 3: Build and verify**

Run: `cd bjj-coach/server && npm run build`
Expected: Compiles successfully

- [ ] **Step 4: Commit**

```bash
git add src/push/push-service.ts package.json package-lock.json
git commit -m "feat: add PushService wrapping expo-server-sdk"
```

---

## Task 4: Add push token DB queries

**Files:**
- Modify: `src/db/queries/channels.ts`

- [ ] **Step 1: Add push token query functions**

Append to `src/db/queries/channels.ts`:
```typescript
export function getUserPushTokens(db: Database.Database, userId: string): string[] {
  const rows = db.prepare(`
    SELECT push_token FROM user_channels
    WHERE user_id = ? AND platform = 'mobile' AND push_token IS NOT NULL
  `).all(userId) as { push_token: string }[];
  return rows.map((r) => r.push_token);
}

export function registerPushToken(
  db: Database.Database,
  userId: string,
  pushToken: string
): void {
  const existing = db.prepare(`
    SELECT id FROM user_channels
    WHERE user_id = ? AND platform = 'mobile' AND push_token = ?
  `).get(userId, pushToken);

  if (existing) return;

  const now = nowISO();
  db.prepare(`
    INSERT INTO user_channels (user_id, platform, platform_user_id, push_token, is_primary, created_at)
    VALUES (?, 'mobile', ?, ?, 0, ?)
  `).run(userId, pushToken, pushToken, now);
}

export function removePushToken(
  db: Database.Database,
  userId: string,
  pushToken: string
): void {
  db.prepare(`
    DELETE FROM user_channels
    WHERE user_id = ? AND platform = 'mobile' AND push_token = ?
  `).run(userId, pushToken);
}

export function removeStaleTokens(
  db: Database.Database,
  tokens: string[]
): void {
  if (tokens.length === 0) return;
  const placeholders = tokens.map(() => '?').join(',');
  db.prepare(`
    DELETE FROM user_channels
    WHERE platform = 'mobile' AND push_token IN (${placeholders})
  `).run(...tokens);
}
```

- [ ] **Step 2: Build and verify**

Run: `cd bjj-coach/server && npm run build`
Expected: Compiles successfully

- [ ] **Step 3: Commit**

```bash
git add src/db/queries/channels.ts
git commit -m "feat: add push token DB query functions"
```

---

## Task 5: Add `getMessagesSince` conversation query

**Files:**
- Modify: `src/db/queries/conversations.ts`

- [ ] **Step 1: Add getMessagesSince function**

Append to `src/db/queries/conversations.ts`:
```typescript
export function getMessagesSince(
  db: Database.Database,
  userId: string,
  since: string,
  limit = 100
): ConversationEntry[] {
  return db.prepare(`
    SELECT * FROM conversation_history
    WHERE user_id = ? AND created_at > ?
    ORDER BY created_at ASC
    LIMIT ?
  `).all(userId, since, limit) as ConversationEntry[];
}
```

- [ ] **Step 2: Build and verify**

Run: `cd bjj-coach/server && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/db/queries/conversations.ts
git commit -m "feat: add getMessagesSince for chat history reconnection"
```

---

## Task 6: Add `isClientConnected` to WebAdapter and `sendToUser` to ChannelManager

**Files:**
- Modify: `src/channels/web.ts`
- Modify: `src/channels/manager.ts`

- [ ] **Step 1: Add isClientConnected to WebAdapter**

In `src/channels/web.ts`, add a public method to check if a user has an active WebSocket:
```typescript
/** Check if a user has an active, open WebSocket connection. */
isClientConnected(sessionId: string): boolean {
  const client = this.clients.get(sessionId);
  return !!client && client.ws.readyState === WebSocket.OPEN;
}
```

Add this after the `sendButtons` method (~line 57).

- [ ] **Step 2: Add sendToUser to ChannelManager**

Add imports at top of `src/channels/manager.ts`:
```typescript
import type Database from 'better-sqlite3';
import { getUserPushTokens, removeStaleTokens } from '../db/queries/channels.js';
import { sendPushToMultiple, type PushPayload } from '../push/push-service.js';
import type { WebAdapter } from './web.js';
```

Add a `db` property and setter:
```typescript
export class ChannelManager {
  private adapters = new Map<Platform, ChannelAdapter>();
  private db: Database.Database | null = null;

  setDatabase(db: Database.Database): void {
    this.db = db;
  }
```

Add `sendToUser` method after `sendButtons`:
```typescript
  /**
   * Send a message to a user, auto-resolving delivery channel.
   * Checks WebSocket connectivity first — only sends push if not connected.
   */
  async sendToUser(
    userId: string,
    text: string,
    pushPayload?: PushPayload
  ): Promise<void> {
    // Check if user has an active WebSocket connection
    const webAdapter = this.adapters.get('web') as WebAdapter | undefined;
    const isConnected = webAdapter?.isClientConnected(userId) ?? false;

    if (isConnected && webAdapter) {
      // User is connected via WebSocket — send there, no push needed
      await webAdapter.sendMessage(userId, text);
      return;
    }

    // User not connected — send push notification
    if (this.db && pushPayload) {
      const tokens = getUserPushTokens(this.db, userId);
      if (tokens.length > 0) {
        const stale = await sendPushToMultiple(tokens, pushPayload);
        if (stale.length > 0) {
          removeStaleTokens(this.db, stale);
        }
      }
    }
  }
```

- [ ] **Step 3: Build and verify**

Run: `cd bjj-coach/server && npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/channels/web.ts src/channels/manager.ts
git commit -m "feat: add sendToUser with WebSocket-first/push-fallback to ChannelManager"
```

---

## Task 7: Create push routes

**Files:**
- Create: `src/api/routes/push.ts`

- [ ] **Step 1: Create push router**

Create `src/api/routes/push.ts`. Use `createAuthMiddleware(db)` from `../middleware/auth.js` — the same pattern used by `auth.ts` (line 18) and `ideas.ts` (line 17):

```typescript
import { Router } from 'express';
import type Database from 'better-sqlite3';
import { registerPushToken, removePushToken } from '../../db/queries/channels.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function createPushRouter(db: Database.Database): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(db);

  // POST /api/push/register
  router.post('/register', requireAuth, (req, res) => {
    const userId = (req as any).userId as string;
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Push token is required' });
      return;
    }

    registerPushToken(db, userId, token);
    res.json({ success: true });
  });

  // POST /api/push/unregister
  router.post('/unregister', requireAuth, (req, res) => {
    const userId = (req as any).userId as string;
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Push token is required' });
      return;
    }

    removePushToken(db, userId, token);
    res.json({ success: true });
  });

  return router;
}
```

- [ ] **Step 2: Build and verify**

Run: `cd bjj-coach/server && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/api/routes/push.ts
git commit -m "feat: add push token register/unregister endpoints"
```

---

## Task 8: Create chat REST routes

**Files:**
- Create: `src/api/routes/chat.ts`

- [ ] **Step 1: Create chat router**

Create `src/api/routes/chat.ts`. Uses `createAuthMiddleware(db)` for auth (same pattern as all other routes). The `POST /messages` endpoint reuses `CoachingEngine`'s handler routing logic — this duplication is intentional for the REST fallback path since the engine is coupled to the `ChannelManager` callback pattern. Keep the switch statement in sync with `src/core/engine.ts:57-86`.

```typescript
import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { AIProvider } from '../../ai/provider.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { getMessagesSince, getRecentMessages, addMessage } from '../../db/queries/conversations.js';
import { getUserById, setConversationMode } from '../../db/queries/users.js';
import { CONVERSATION_MODES } from '../../utils/constants.js';
import { handleFreeChat } from '../../core/handlers/freeChat.js';
import { handleOnboarding } from '../../core/handlers/onboarding.js';
import { handleBriefing } from '../../core/handlers/briefing.js';
import { handleDebrief } from '../../core/handlers/debrief.js';
import { handleCheckIn } from '../../core/handlers/checkin.js';

export function createChatRouter(db: Database.Database, ai: AIProvider): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(db);
  router.use(requireAuth);

  // GET /api/chat/history?since=ISO8601&limit=100
  router.get('/history', (req, res) => {
    const userId = (req as any).userId as string;
    const since = req.query.since as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;

    let messages;
    if (since) {
      messages = getMessagesSince(db, userId, since, limit);
    } else {
      messages = getRecentMessages(db, userId, limit);
    }

    res.json({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      })),
    });
  });

  // POST /api/chat/messages — REST fallback for sending messages when WebSocket is down
  router.post('/messages', async (req, res) => {
    const userId = (req as any).userId as string;
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const user = getUserById(db, userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Store user message
    addMessage(db, userId, 'user', text, 'mobile');

    // Route by conversation mode (mirrors CoachingEngine.handleIncoming in src/core/engine.ts)
    let result;
    const currentUser = getUserById(db, userId)!;

    if (text === '/start' && !currentUser.onboarding_complete) {
      setConversationMode(db, userId, CONVERSATION_MODES.ONBOARDING);
      const freshUser = getUserById(db, userId)!;
      result = await handleOnboarding(db, ai, freshUser, text);
    } else {
      switch (currentUser.conversation_mode) {
        case CONVERSATION_MODES.ONBOARDING:
          result = await handleOnboarding(db, ai, currentUser, text);
          break;
        case CONVERSATION_MODES.IDLE:
          setConversationMode(db, userId, CONVERSATION_MODES.FREE_CHAT);
          result = await handleFreeChat(db, ai, getUserById(db, userId)!, text);
          break;
        case CONVERSATION_MODES.FREE_CHAT:
          result = await handleFreeChat(db, ai, currentUser, text);
          break;
        case CONVERSATION_MODES.CHECK_IN:
          result = await handleCheckIn(db, ai, currentUser, text);
          break;
        case CONVERSATION_MODES.BRIEFING:
          result = await handleBriefing(db, ai, currentUser, text);
          break;
        case CONVERSATION_MODES.DEBRIEF:
          result = await handleDebrief(db, ai, currentUser, text);
          break;
        default:
          result = await handleFreeChat(db, ai, currentUser, text);
      }
    }

    // Store AI response
    addMessage(db, userId, 'assistant', result.text, 'mobile');

    // Store system messages
    if (result.systemMessages?.length) {
      for (const sysMsg of result.systemMessages) {
        addMessage(db, userId, 'system', sysMsg.text, 'mobile');
      }
    }

    res.json({
      text: result.text,
      systemMessages: result.systemMessages || [],
    });
  });

  return router;
}
```

- [ ] **Step 2: Build and verify**

Run: `cd bjj-coach/server && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/api/routes/chat.ts
git commit -m "feat: add REST chat endpoints for mobile fallback"
```

---

## Task 9: Wire everything into index.ts

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add imports and mount routes**

In `src/index.ts`, add imports:
```typescript
import { createPushRouter } from './api/routes/push.js';
import { createChatRouter } from './api/routes/chat.js';
```

After the existing route mounts (after `app.use('/api/ideas', ...)`), add:
```typescript
app.use('/api/push', createPushRouter(db));
app.use('/api/chat', createChatRouter(db, ai));
```

After creating `channelManager` (after `const channelManager = new ChannelManager();`), add:
```typescript
channelManager.setDatabase(db);
```

- [ ] **Step 2: Build and verify**

Run: `cd bjj-coach/server && npm run build`
Expected: Clean compilation, no errors

- [ ] **Step 3: Start server and smoke test**

Run: `cd bjj-coach/server && npm run dev`
Expected: Server starts, logs show WebSocket adapter started, no Telegram references in boot logs.

Test endpoints manually:
```bash
# Login to get a token
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"your@email.com","password":"yourpass"}'

# Use the token to test chat history
curl http://localhost:3000/api/chat/history \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Test push register
curl -X POST http://localhost:3000/api/push/register \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"token":"ExponentPushToken[test]"}'
```

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: wire push and chat routes into server boot"
```

---

## Task 10: Update Scheduler to use sendToUser

**Files:**
- Modify: `src/scheduler/scheduler.ts`

- [ ] **Step 1: Update scheduler delivery methods**

The scheduler currently calls `this.channels.sendMessage(channel.platform, channel.platform_user_id, text)`. **Replace** these calls with `sendToUser` in `sendCheckIn`, `sendBriefing`, `sendDebrief`, and `timeoutStaleConversation`. `sendToUser` handles both WebSocket and push delivery — it checks if the user is connected via WebSocket first, sends there if so, otherwise falls back to push. No need to call both.

**`sendCheckIn` (~line 200):** Replace:
```typescript
await this.channels.sendMessage(channel.platform as Platform, channel.platform_user_id, result.text);
```
With:
```typescript
await this.channels.sendToUser(user.id, result.text, {
  title: 'Check-in',
  body: result.text.substring(0, 100),
  data: { type: 'checkin' },
});
```

**`sendBriefing` (~line 223):** Replace `sendMessage` with:
```typescript
await this.channels.sendToUser(user.id, result.text, {
  title: 'Pre-session',
  body: result.text.substring(0, 100),
  data: { type: 'briefing' },
});
```

**`sendDebrief` (~line 246):** Replace `sendMessage` with:
```typescript
await this.channels.sendToUser(user.id, result.text, {
  title: "How'd it go?",
  body: result.text.substring(0, 100),
  data: { type: 'debrief' },
});
```

**`timeoutStaleConversation` (~line 112):** Replace `sendMessage` with:
```typescript
await this.channels.sendToUser(user.id, result.text, {
  title: 'Coach',
  body: result.text.substring(0, 100),
  data: { type: 'message' },
});
```

Also update the `sendSystemMessage` calls in `timeoutStaleConversation` similarly — replace:
```typescript
await this.channels.sendSystemMessage(channel.platform as Platform, channel.platform_user_id, sysMsg.text, sysMsg.link);
```
With:
```typescript
await this.channels.sendToUser(user.id, sysMsg.text);
```

Note: The `getPrimaryChannel` call at the top of each method is still needed for the `addMessage` calls (which require a platform). But message delivery now goes through `sendToUser` which resolves the delivery channel automatically.

- [ ] **Step 2: Build and verify**

Run: `cd bjj-coach/server && npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/scheduler/scheduler.ts
git commit -m "feat: scheduler sends push notifications alongside WebSocket"
```

---

## Task 11: Verify end-to-end and clean up

- [ ] **Step 1: Full build**

Run: `cd bjj-coach/server && npm run build`
Expected: No errors, no warnings about Telegram

- [ ] **Step 2: Start server**

Run: `cd bjj-coach/server && npm run dev`
Expected: Clean boot with no Telegram references in logs

- [ ] **Step 3: Test web app still works**

Start the Angular app (`cd bjj-coach/web && npm start`), verify:
- Login/signup works
- WebSocket chat works
- Dashboard loads

- [ ] **Step 4: Grep for leftover Telegram references**

Run: `grep -r "telegram" bjj-coach/server/src/ --include="*.ts" -i`
Expected: No results

- [ ] **Step 5: Commit final state**

```bash
git add -A
git commit -m "chore: verify clean build after Telegram removal and push notification support"
```
