# React Native Mobile App — Design Spec

**Date:** 2026-03-22
**Status:** Approved
**Approach:** Push-First Chat (Approach B)

## Goal

Build a React Native mobile app for the BJJ coaching project. The primary motivation is **push notifications** — enabling proactive coaching (morning check-ins, pre-session briefings, post-session debriefs) to reach users without relying on Telegram or an open browser tab. Targets both iOS and Android from day one.

## Key Decisions

- **Expo managed workflow** with Expo Router (file-based navigation)
- **Push-First Chat** — push notifications are the primary message delivery mechanism, WebSocket for real-time when app is foregrounded, REST fallback when WebSocket is down
- **Remove Telegram** — the mobile app replaces Telegram as the proactive channel
- **Full feature parity** with the web app (Chat, Dashboard, Focus, Techniques, Ideas, Profile)
- **Retro desktop OS aesthetic** carried over from web — window chrome, parchment backgrounds, otter mascots, monospace titles
- **Bottom tab bar** navigation with Chat as the center/primary tab

## Architecture

### Navigation Structure

```
Tab Bar (5 tabs)
  |-- Home Tab (retro icon grid + otter mascot)
  |-- Dashboard Tab
  |     |-- Dashboard Screen (profile card, stats, sessions, focus)
  |     |-- [push] Session Detail
  |     |-- [push] Focus Timeline
  |-- Coach Tab (center, primary)
  |     |-- Chat Screen (WebSocket + push + REST fallback)
  |-- Techniques Tab
  |     |-- Library Screen (352 techniques, search/filter)
  |     |-- [push] Technique Detail (video, description)
  |-- Profile Tab
        |-- Profile Screen (edit profile, settings)
        |-- [push] Ideas Board
        |-- [push] Idea Detail (comments, voting)
```

### Data Sources

| Screen | Source | State Management |
|--------|--------|-----------------|
| Chat | WebSocket (real-time) + `POST /api/chat/messages` (fallback) | Zustand |
| Dashboard | `GET /api/dashboard/profile, sessions, stats, focus` | TanStack Query |
| Focus Timeline | `GET /api/dashboard/focus/history` | TanStack Query |
| Techniques | `GET /api/dashboard/library` | TanStack Query |
| Profile | `GET /api/dashboard/profile` | TanStack Query |
| Ideas | `GET /api/ideas` | TanStack Query |
| Auth | `POST /api/auth/login, signup` | Zustand (token in SecureStore) |

### Tech Stack

- **Framework:** Expo (managed workflow) + Expo Router
- **State:** TanStack Query (server state) + Zustand (auth, chat)
- **Notifications:** expo-notifications (Expo Push API)
- **Auth storage:** expo-secure-store (encrypted, not AsyncStorage)
- **SVG:** react-native-svg (otter mascots)
- **Video:** expo-av (technique library playback)

## Project Structure

```
bjj-coach/mobile/
  app/                          # Expo Router (file-based routing)
    (auth)/                     # Auth group (no tab bar)
      login.tsx
      signup.tsx
    (tabs)/                     # Tab bar group
      _layout.tsx               # Tab bar config
      index.tsx                 # Home (retro grid)
      dashboard/
        index.tsx               # Dashboard
        session/[id].tsx        # Session detail
        focus.tsx               # Focus timeline
      chat.tsx                  # Coach chat
      techniques/
        index.tsx               # Library with search
        [id].tsx                # Technique detail
      profile/
        index.tsx               # Profile
        ideas.tsx               # Ideas board
        idea/[id].tsx           # Idea detail
  src/
    stores/                     # Zustand stores
      auth.ts                   # Token, user, login/logout
      chat.ts                   # Messages, connection, typing
    hooks/                      # TanStack Query hooks
      use-profile.ts
      use-sessions.ts
      use-focus.ts
      use-techniques.ts
      use-ideas.ts
      use-stats.ts
    services/
      api.ts                    # Axios instance with auth interceptor
      websocket.ts              # WebSocket connection manager
      push.ts                   # Push notification registration
    components/
      retro-window.tsx          # Reusable window chrome wrapper
      message-bubble.tsx        # Chat bubble
      quick-buttons.tsx         # Interactive button row
      otter.tsx                 # Otter mascot component
      tab-bar.tsx               # Custom retro tab bar
    theme/
      colors.ts                 # Color tokens
      fonts.ts                  # Monospace + body fonts
  assets/
    otters/                     # Otter SVGs (copied from web)
```

## Server Changes

### New Endpoints

- **`POST /api/push/register`** — Store Expo push token. Body: `{ token: "ExponentPushToken[xxx]" }`. Stores in `user_channels` with platform `mobile`.
- **`POST /api/push/unregister`** — Remove push token on logout.
- **`GET /api/chat/history?since=timestamp`** — Fetch messages since a given timestamp for reconnection after push notification.
- **`POST /api/chat/messages`** — REST fallback for sending messages when WebSocket is down. Body: `{ text: "..." }`. Returns the coach response.

### New: PushService

Wraps Expo Push API via `expo-server-sdk` npm package:

- `sendPush(pushToken, title, body, data)` — sends a single notification
- `data` field carries `{ type: 'briefing' | 'debrief' | 'message', messageId }` for navigation
- Handles token expiration — Expo returns `DeviceNotRegistered`, auto-removes stale tokens

### Modified Components

- **ChannelManager** — When sending a message, if user has no active WebSocket but has a push token, send via Expo Push API.
- **Scheduler** — Same fallback logic for briefings/debriefs.
- **Remove TelegramBotManager** and all Telegram-related code (adapter, token validation, bot management).

### Database Changes

- Push tokens stored in `user_channels` table (platform: `mobile`, platform_user_id: expo push token)
- Remove `telegram_bot_token` from `users` table (migration)
- Remove Telegram-related endpoints from dashboard routes

## Push Notification Lifecycle

### Registration

1. App launches → `expo-notifications.getExpoPushTokenAsync()` gets token
2. App sends `POST /api/push/register` with token
3. Server stores in `user_channels` (platform: `mobile`)
4. On logout: `POST /api/push/unregister` removes token

### Notification Types

| Type | Title | Body Example | Tap Action |
|------|-------|-------------|------------|
| `briefing` | "Pre-session" | "Training in an hour. Focus on the underhook..." | Open Chat tab |
| `debrief` | "How'd it go?" | "How was training? Let's log what happened." | Open Chat tab |
| `message` | "Coach" | "Good question — here's what I'd try..." | Open Chat tab |
| `system` | "Profile updated" | "Belt rank, goals updated from conversation" | Open Profile tab |

### Delivery Logic (Server-Side)

1. Engine/Scheduler wants to send a message to user
2. `ChannelManager.sendMessage(userId, text)` checks:
   - Active WebSocket? → Send via WebSocket
   - No WebSocket but has push token? → Send via PushService AND store in `conversation_history`
   - Both? → Send via WebSocket + silent push (badge count update)
3. When user opens from push: Chat screen calls `GET /api/chat/history?since=lastTimestamp` to hydrate missed messages

### Background Handling (Mobile)

- `expo-notifications` background handler receives push while app is closed
- Updates badge count on app icon
- User taps → Expo Router deep links to Chat tab
- Chat screen reconnects WebSocket + fetches history gap

### Edge Cases

- Token expires → `DeviceNotRegistered` → server auto-removes stale token
- Multiple devices → multiple push tokens per user, server sends to all
- App foregrounded → push received silently, chat state updated via WebSocket (no banner)

## Authentication Flow

### Signup (4-step wizard)

1. Name, Email, Password
2. Belt rank, Experience level
3. Training days, Typical training time
4. Goals, Game style, Injuries

On submit: `POST /api/auth/signup` → JWT → `SecureStore` → register push token → navigate to Chat (onboarding starts)

### Login

`POST /api/auth/login` → JWT → `SecureStore` → register push token → navigate to tabs

### App Launch

1. Check `SecureStore` for existing JWT
2. If found: `GET /api/auth/me` to validate
3. Valid → show tabs, reconnect WebSocket, register/refresh push token
4. Invalid/expired → clear token, show login screen

### Logout

1. `POST /api/push/unregister`
2. Disconnect WebSocket
3. Clear `SecureStore`
4. Clear TanStack Query cache + Zustand stores
5. Navigate to login

No server-side auth changes needed — JWT flow works as-is.

## Retro Styling System

### RetroWindow Component

Every screen is wrapped in a `RetroWindow` component:
- Title bar with macOS-style dots (red/yellow/green) + monospace title
- Content area with parchment background
- Status bar at bottom with contextual metadata

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| parchment | `#f5f0e8` | Content backgrounds |
| dark | `#1a1a2e` | Chrome, status bars |
| surface | `#2a2a4a` | Title bars, cards on dark |
| accent | `#e8a87c` | Interactive elements, Coach tab, buttons |
| close | `#ff5f57` | Window dot |
| minimize | `#febc2e` | Window dot |
| maximize | `#28c840` | Window dot, online status |

### Typography

- **Monospace** (titles, labels, status bars): JetBrains Mono or system monospace
- **Body** (chat, descriptions): System default (San Francisco on iOS, Roboto on Android)

### Chat Screen Specifics

- Window chrome title bar: `coach.chat`
- Parchment background for message area
- Coach messages: dark bubbles (`#2a2a4a`) with light text, left-aligned
- User messages: accent bubbles (`#e8a87c`) with dark text, right-aligned
- Quick reply buttons: pill-shaped, accent border
- Input bar: dark background with rounded input field + accent send button
- Status bar: conversation mode + message count

## Testing Strategy

### Unit Tests (Jest + React Native Testing Library)

- Zustand stores: auth state transitions, chat message handling
- WebSocket reconnection logic
- Push notification token registration/deregistration
- Message deduplication (WebSocket + push overlap)

### Integration Tests

- Auth flow: signup → token stored → API calls authenticated
- Chat flow: connect WebSocket → send message → receive response → history persists
- Push flow: register token → receive notification → app navigates to chat

### Deferred (Not v1)

- E2E tests (Detox)
- Snapshot tests
- Performance benchmarks

## Build & Deployment

### EAS Build Profiles

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": {}
  }
}
```

### Environment Configuration

| Profile | API_URL |
|---------|---------|
| development | `http://192.168.x.x:3000` |
| preview | `https://staging.yourserver.com` |
| production | `https://api.yourserver.com` |

### Deployment Flow

1. `eas build --platform all --profile production` — build binaries
2. `eas submit --platform ios` → App Store Connect
3. `eas submit --platform android` → Google Play Console
4. JS-only changes: `eas update --branch production` (OTA, no store review)

### App Store Requirements

- App icons: 1024x1024 (iOS), 512x512 (Android) — otter mascot
- Screenshots for both platforms
- Privacy policy URL (required for push notifications)
- Push notification entitlement (iOS)
