# App Domain Migration — Prerequisite for Iteration 1

**Goal:** free the `theottercoach.com` apex for the Astro content site by moving the existing Angular web app to `app.theottercoach.com`, with zero changes to application source code.
**Status:** prerequisite to `TECH-STACK.md`. This is **Step 1** of the Iteration 1 rollout — the content site cannot go live at the apex until this is done.
**Prepared:** 2026-04-13

---

## 1. Why this is safe to do quickly

An audit of the existing app revealed the migration is a deployment/DNS exercise, not a code change:

- **No hardcoded `theottercoach.com` anywhere in application source.** The only hits are SEO strategy markdown docs. The custom domain is attached to the Vercel project via dashboard config.
- **Web app API calls** use relative `apiUrl: '/api'` with Vercel rewrites proxying to Railway. Moving which domain Vercel serves does not change anything in code.
- **WebSocket** points directly to `wss://ottercoachai-production.up.railway.app/ws` — Railway-owned, domain-independent. Keeps working across the move.
- **Mobile app** reads `API_URL` / `WS_URL` from env (EAS build config), both pointing to Railway directly. No mobile code change, no rebuild.
- **CORS** on the server is currently `Access-Control-Allow-Origin: *`. No origin tightening is needed to preserve function.
- **Auth** uses JWTs in localStorage (per `CLAUDE.md`). No cookies scoped to the apex, so no `Domain=.theottercoach.com` gymnastics required.

The one user-visible consequence: **existing users logged in on `theottercoach.com` will be logged out** after the cutover, because localStorage is per-origin. This is acceptable at the current user scale.

---

## 2. What changes

| Surface | Before | After |
|---|---|---|
| DNS for `theottercoach.com` (apex) | Vercel (Angular app) | Cloudflare Pages (Astro content site) |
| DNS for `app.theottercoach.com` | not configured | Vercel (Angular app) |
| Angular app source code | — | unchanged |
| Mobile app config / builds | — | unchanged |
| Server CORS / auth config | — | unchanged |
| Users' login state | logged in | logged out (one-time) |

---

## 3. Order of operations

Engineer brief. Estimated ~2 hours end-to-end including verification time. Can be done before the Astro site is ready — the Angular app will simply be reachable at both the apex and the new subdomain during the overlap window.

### Step 1 — DNS prep
- In the DNS provider (Cloudflare DNS), add a CNAME record: `app.theottercoach.com` → the Vercel target CNAME.
- Leave the apex `theottercoach.com` A/CNAME pointing at Vercel for now. Do not remove it.

### Step 2 — Add subdomain to the Vercel project
- In the Vercel dashboard for the existing Angular project, add `app.theottercoach.com` as an additional custom domain.
- Wait for SSL provisioning to complete.
- Verify: opening `https://app.theottercoach.com` loads the app identically to `https://theottercoach.com`.

### Step 3 — Smoke-test on the new subdomain
- Log in with a test account. (Expect to see the login page because localStorage is per-origin.)
- Exercise the core loop: signup → login → chat (WebSocket) → techniques view → dashboard.
- Confirm `/api/*` requests still route through to Railway.

### Step 4 — Mobile app verification
- Open the mobile app on a physical device connected to production.
- Run through: chat, techniques list, sessions.
- No action needed if working — mobile points directly at Railway and does not go through the web domain at all.

### Step 5 — OAuth / magic-link redirect URIs
- Search provider configs (Telegram bot webhook URL, any OAuth client redirect URIs) for anything pointing to `theottercoach.com/...`.
- Current state per `CLAUDE.md`: Telegram bot is webhook-based (pointing at Railway, not the web domain), email magic links are "table exists, not implemented." So this is likely a no-op today.
- **Document:** when email magic links ship in the future, their redirect URL must use `app.theottercoach.com`, not the apex.

### Step 6 — Communicate the logout
- Post a one-line note in whatever channel you use for user comms (Discord, app banner, release notes): "We're restructuring the site. You may be logged out once — just log back in."
- Optional and likely overkill at this scale: a one-time JWT-handover redirect page served at the apex (reads token from localStorage, redirects to `app.theottercoach.com/auth?token=...`, the app re-stores it). Skip unless user count warrants the complexity.

### Step 7 — Cutover (only when Astro site is ready to deploy)
This step happens **once**, at the same moment the Astro site goes live. Coordinate with the content-site deploy.

- In Vercel, remove `theottercoach.com` from the Angular project (leave `app.theottercoach.com`).
- In Cloudflare DNS, point the apex A/AAAA/CNAME at Cloudflare Pages (the Astro site target).
- Verify Cloudflare Pages serves the content site at `https://theottercoach.com`.
- On the Cloudflare Pages side, add **301 redirects** for legacy app paths to preserve any stale links:
  - `/` — **do not** redirect. This is the new content site home.
  - `/dashboard` → `https://app.theottercoach.com/dashboard` (301)
  - `/chat` → `https://app.theottercoach.com/chat` (301)
  - `/profile` → `https://app.theottercoach.com/profile` (301)
  - `/signup` → `https://app.theottercoach.com/signup` (301)
  - `/login` → `https://app.theottercoach.com/login` (301)
  - `/ideas`, `/focus-timeline`, `/techniques` (if any were publicly linked) → same pattern
- Spot-check each redirect resolves correctly.

### Step 8 — Rollback path (if the cutover goes wrong)
- Re-add `theottercoach.com` as a custom domain on the Vercel Angular project.
- Revert the apex DNS to the Vercel target.
- Total revert time: under 30 minutes. SSL re-provisioning is the slowest step.

---

## 4. Audit checklist before cutover (Step 7)

Spend ~10 minutes before Step 7 confirming no external surfaces point at `theottercoach.com` expecting the app:

- [ ] App Store / Play Store listing descriptions and support URLs
- [ ] Telegram bot description, `/start` message, and any outbound links it sends
- [ ] Email templates (transactional emails, if any) for login/reset/receipts
- [ ] Printed marketing, business cards, gym flyers (if any exist)
- [ ] Social media bios and pinned posts
- [ ] Any "Sign in with Google / Apple" OAuth consent screens (redirect URIs configured in the provider console)
- [ ] Service account or API key registrations that reference the domain

For each finding: update the URL to `app.theottercoach.com` **before** Step 7, or configure the 301 redirect in Step 7 to cover it.

---

## 5. Success criteria

- [ ] `https://app.theottercoach.com` serves the Angular app
- [ ] `https://theottercoach.com` serves the Astro content site
- [ ] Legacy app paths on the apex redirect (301) to the subdomain
- [ ] Mobile app works unchanged
- [ ] Users can log in on `app.theottercoach.com`
- [ ] No user-reported breakage for 72 hours post-cutover

---

## 6. Open items

- **Printed/external references audit** (§4) — requires a quick walk-through of non-code assets that only you can complete.
- **JWT handover redirect** (§Step 6, optional) — implement only if user count grows large enough that a one-time re-login becomes a support burden.
