# Deployment

This repo ships three surfaces:

| Surface | Path | Hosted on |
|---|---|---|
| Server (Node/Express) | `bjj-coach/server/` | Railway |
| Web (Angular) | `bjj-coach/web/` | Vercel |
| Mobile (Expo/React Native) | `bjj-coach/mobile/` | Expo (EAS) |

## CI (smoke tests)

GitHub Actions workflow: `.github/workflows/ci.yml`. Triggers on every PR and push to `main`.

Three jobs run only when files in their surface change (path filtering via `dorny/paths-filter`):

- **server** — `npm ci` + `npm run typecheck` + `npm run build`
- **web** — `npm ci` + `npm run build` + Playwright smoke specs (`bjj-coach/web/e2e/smoke.spec.ts`)
- **mobile** — `npm ci` + `tsc --noEmit` + Jest smoke tests (`bjj-coach/mobile/__tests__/smoke.test.tsx`)

Smoke tests intentionally cover only "the build is not broken and the app boots." Add deeper integration tests as you go.

## Deploy gating (one-time setup in your dashboards)

CI passing does not by itself block a bad deploy — you have to tell each host to wait for GitHub Actions before shipping.

### Vercel (web)

1. Open the web project in Vercel → **Settings → Git**.
2. Scroll to **Ignored Build Step** OR set **Production branch protection: Required GitHub status checks** = `ci / web`.
3. Vercel will now refuse to deploy `main` until the `web` CI job passes.

### Railway (server)

1. Open the server service → **Settings → Deployments**.
2. Set **Wait for CI** = on, **Required check** = `ci / server`.
3. (Alternatively, disable auto-deploy and trigger manually from CI — but the dashboard toggle is simpler.)

### Expo (mobile)

OTA updates require an Expo account and a GitHub secret:

1. Sign up at [expo.dev](https://expo.dev) and run `npx eas-cli login` locally.
2. Generate an access token: [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).
3. In GitHub → repo → **Settings → Secrets and variables → Actions**, add `EXPO_TOKEN`.
4. Uncomment the `mobile-deploy` job at the bottom of `.github/workflows/ci.yml`.
5. Push to `main`. Mobile JS updates ship over-the-air (no app store review).

Native binary builds (when you change Expo SDK or native config) still need `eas build` run manually.

## Local commands cheat sheet

```bash
# Server
cd bjj-coach/server && npm run dev
cd bjj-coach/server && npm run build

# Web
cd bjj-coach/web && npm start              # dev server :4200
cd bjj-coach/web && npm run build
cd bjj-coach/web && npm run test:e2e       # Playwright smoke

# Mobile
cd bjj-coach/mobile && npm start           # Expo dev
cd bjj-coach/mobile && npm test            # Jest smoke
cd bjj-coach/mobile && npm run typecheck
```

## Adding tests

- **Web E2E**: drop new specs into `bjj-coach/web/e2e/*.spec.ts`. They auto-run in CI.
- **Mobile**: drop new tests into `bjj-coach/mobile/__tests__/*.test.tsx`.
- **Server**: when you're ready, extract an `createApp()` function from `src/index.ts` (split out the express setup from the scheduler/Telegram boot), then add `vitest` + `supertest` and write API integration tests against `createApp()`.
