# The Otter Coach — Programmatic SEO Strategy (BJJ Niche)

**Site:** https://www.theottercoach.com/
**Product:** BJJ Coach — a consumer mobile/web app for Brazilian Jiu-Jitsu training
**Prepared:** 2026-04-13
**Strategic stance:** Aggressive programmatic SEO build on a blank-slate domain in an under-optimized niche.

---

## 1. Executive Summary

### The Opportunity
The BJJ content vertical is dramatically underdeveloped relative to its search demand. Keyword research shows high-volume queries with near-zero competition:

| Keyword | Volume | Difficulty | CPC |
|---|---|---|---|
| triangle choke | 7,400 | 1 | $0.40 |
| kimura | 6,800 | 36 | $0.15 |
| bjj gi | 6,300 | 6 | $0.80 |
| rear naked choke | 5,600 | 2 | $0.35 |
| bjj belts | 4,700 | 0 | $0.20 |
| heel hook | 3,200 | 0 | $0.20 |
| armbar | 3,100 | 2 | $0.25 |
| leg lock | 2,500 | 0 | $0.06 |
| bjj gyms near me | 1,200 | 30 | $1.20 |

**Interpretation:** Five-figure monthly organic traffic is realistic within 6–9 months because competing BJJ content is largely behind paywalls (BJJ Fanatics, BJJ Library, Submitsu) or locked inside YouTube videos — leaving the "snippet-ready" SERP real estate open for a structured, text-first knowledge base.

### The Play
Turn The Otter Coach into the most comprehensive, structured BJJ knowledge base on the open web. Use the existing app content (techniques, positions, drills, curriculum) as the programmatic source-of-truth that powers thousands of indexable web pages. Each page has a dual purpose:
1. Rank for a long-tail BJJ query
2. Funnel the searcher into the app (install/signup/free trial)

### Programmatic Page Inventory (Target)
Approximate published-page counts by Month 12:

| Page type | Count | Priority |
|---|---|---|
| Technique pages (position × move) | 800–1,200 | P0 |
| Position pages | 40–60 | P0 |
| Submission hub pages | ~100 | P0 |
| Gym directory (US city pages) | 2,000–5,000 | P1 |
| Athlete / champion profiles | 300–500 | P2 |
| Tournament / event pages | 100–200 | P2 |
| Belt curriculum pages (5 belts × variants) | 20–30 | P0 |
| Flow / transition pages (A → B) | 300–500 | P2 |
| Glossary / terminology | 200–300 | P1 |
| Drill database (by level × position) | 200–400 | P1 |
| Gi & gear comparison pages | 100–200 | P3 |
| **Total indexable pages** | **4,000–8,000+** | |

---

## 2. Business & Audience

**Target audience (ranked by commercial value to app):**
1. **White/blue belts (0–3 yrs training)** — largest segment, highest "how do I..." query volume, most likely to install a training app
2. **Returning / hobbyist adults** — high LTV, search for drills and curriculum
3. **Coaches / gym owners** — lower volume, high-intent for curriculum/content tools
4. **Parents (kids BJJ)** — local gym search, "bjj for kids" parent topic

**Primary user job-to-be-done for SEO content:**
"I just learned [technique] in class and want to remember/understand it." → This is a repeatable, scalable content template that fits perfectly with a programmatic approach AND with the app's core value prop.

---

## 3. Core Strategic Principles

1. **Database-first, not blog-first.** Every page is generated from a structured record (technique, position, athlete, gym, etc.) so new content adds no editorial overhead once the templates are built.
2. **Video plus text, not video or text.** Every technique page has original text (steps, mistakes, counters, related moves) plus an embedded video. Google can't rank a raw YouTube video for "how to do triangle from closed guard" — we win by pairing structured text with video.
3. **Deep internal linking as the moat.** Every technique links to: parent position, counter technique, related submission, belt curriculum, athletes who use it, tournaments where it appeared. This creates a dense knowledge graph that scales crawlability and topical authority.
4. **Free text-web content, paid app content.** The open web content is the funnel; the app is the product. Never hide a ranking page behind a paywall — that's the entire unlock.
5. **Schema saturation.** HowTo, VideoObject, ExerciseAction, Person, Event, LocalBusiness, FAQPage everywhere that applies. BJJ competitors barely use structured data — this is a free moat.
6. **E-E-A-T via real coaches.** Every technique page is "reviewed by" a named black belt (with bio, lineage, credentials). Lineage is verifiable in BJJ — use it as an authority signal competitors can't fake at scale.

---

## 4. Content Pillars

### Pillar 1 — Technique Encyclopedia (P0 — launch first)
The core programmatic asset. Template: position × technique family × variation.
- **URL pattern:** `/technique/{technique-slug}` and `/technique/{technique-slug}/from-{position-slug}`
- **Examples:** `/technique/triangle-choke`, `/technique/triangle-choke/from-closed-guard`, `/technique/kimura/from-side-control`
- **Estimated pages:** 800–1,200
- **Content template:** Name + aliases (incl. Portuguese), position of origin, step-by-step (HowTo schema), common mistakes, counters (linking to counter technique pages), who uses it in competition (linking to athlete pages), belt level, video embed, related techniques, FAQ block

### Pillar 2 — Position & Concept Hubs (P0)
Hub pages for each position, grip, and core concept. These absorb internal link equity and rank for high-volume head terms.
- **URL pattern:** `/position/{slug}`, `/concept/{slug}`
- **Examples:** `/position/closed-guard`, `/position/half-guard`, `/concept/frames`
- **Estimated pages:** 40–60
- **Content template:** Overview, key sub-positions, attacks from here (linked), escapes (linked), counters, top practitioners, drill list, curriculum level

### Pillar 3 — Belt & Curriculum (P0)
Ranks for "bjj belts" (4.7k vol, KD 0) and absorbs huge "what do I need for blue belt" long-tail.
- **URL pattern:** `/belts/{belt}`, `/curriculum/{belt}/{module}`
- **Examples:** `/belts/white`, `/belts/blue/requirements`, `/curriculum/white/fundamental-techniques`
- **Content template:** What this belt means, requirements by federation (IBJJF, Gracie, etc.), technique checklist (linking to technique pages), average time at belt, common milestones

### Pillar 4 — Gym Directory (P1)
Highest commercial-intent pages. "bjj gyms near me" has $1.20 CPC and 1.2k volume; aggregate city-level long-tail is 10×+ that.
- **URL pattern:** `/gyms/{state}/{city}`, `/gyms/{state}/{city}/{gym-slug}`
- **Estimated pages:** 2,000–5,000 (top ~500 US cities + gym records)
- **Content template:** City-level page lists all gyms with map, filter by style (gi, no-gi, kids, women's). Gym-level pages: address, schedule, head instructor (linked to athlete profile), reviews, pricing if public.
- **Data source strategy:** Start with manual seeding of 50 major cities. Enrich via user submissions once app has traction. Partner with gyms for listing upgrades (monetization path).

### Pillar 5 — Athlete Database (P2)
BJJ Heroes dominates here but is stale. Opportunity to build a fresher, better-linked version.
- **URL pattern:** `/athletes/{slug}`
- **Estimated pages:** 300–500
- **Content template:** Name, lineage, academy, accomplishments, signature techniques (linked), highlight matches, weight class, active status

### Pillar 6 — Tournaments & Events (P2)
- **URL pattern:** `/events/{year}/{event-slug}`, `/events/series/{series}` (e.g., ADCC, IBJJF Worlds, NAGA)
- Good for news/freshness signals and absorbs "ADCC 2026 results" type queries

### Pillar 7 — Flows & Transitions (P2)
Unique programmatic angle BJJ competitors don't execute: technique-to-technique transitions.
- **URL pattern:** `/flow/{from-technique}-to-{to-technique}`
- **Examples:** `/flow/scissor-sweep-to-mount`, `/flow/triangle-to-armbar`
- **Estimated pages:** 300–500 (only publish for genuine, documented transitions — quality-gated)

### Pillar 8 — Glossary (P1)
- **URL pattern:** `/glossary/{term}`
- **Estimated pages:** 200–300
- **Absorbs:** "what is X" queries (kesa gatame, berimbolo, mundial, faixa, etc.)

### Pillar 9 — Blog / Editorial (P3, ongoing)
Supports topical authority and captures conversational queries. Publish 2/week after Phase 2.

---

## 5. Technical Foundation

### Stack requirements (for engineering brief)
- **Rendering:** Server-side rendered (SSR) or static-site generation (SSG). Rendering must not require JS for crawlers. Next.js ISR, Astro, or Nuxt are solid choices. Avoid pure CSR (React SPA without SSR).
- **Sitemap:** Auto-generated XML sitemap split into sub-sitemaps per pillar (technique-sitemap.xml, gym-sitemap.xml, athlete-sitemap.xml, etc.). Max 50k URLs per sitemap, max 50MB uncompressed.
- **URL structure:** Lowercase, hyphenated, no trailing slash, no query parameters for canonical paths. All UTM and filter params must have correct canonical tags.
- **Internal linking:** Build a link graph where every technique page links bidirectionally to: parent position, counter, related submissions, belt level, ≥3 athletes. Implement as templated related-content blocks.
- **Performance targets (Core Web Vitals field, 75th percentile):**
  - LCP < 2.5s
  - INP < 200ms
  - CLS < 0.1
- **Image handling:** Next-gen formats (AVIF/WebP), responsive srcset, lazy-load below fold, explicit width/height to prevent CLS.
- **Video handling:** Embed via facade (lite-youtube-embed pattern) so video players don't block LCP.
- **Hosting:** Edge/CDN (Vercel, Cloudflare, Netlify). Static pages should hit cache >99%.
- **International:** Launch English (US) first. Portuguese (BR) should be planned as a second locale by Month 6 — huge BJJ audience, low competition in Brazil.

### Schema markup plan

| Page type | Primary schema | Secondary |
|---|---|---|
| Homepage | Organization, WebSite, SoftwareApplication | SearchAction |
| Technique page | HowTo, VideoObject | BreadcrumbList, FAQPage |
| Position page | Article | BreadcrumbList, ItemList (of techniques) |
| Athlete profile | Person | ItemList (accomplishments) |
| Gym page | LocalBusiness (SportsActivityLocation), MartialArtsSchool | GeoCoordinates, Review |
| Gym city page | ItemList | BreadcrumbList |
| Event page | SportsEvent | BreadcrumbList |
| Belt curriculum | Course | ItemList, BreadcrumbList |
| Glossary term | DefinedTerm | BreadcrumbList |
| Blog post | Article | Author (Person), BreadcrumbList |

### Crawl-budget discipline
- Ship pages in **quality-gated waves**, not all at once. Publishing 5,000 thin pages on day 1 triggers a quality classifier downgrade.
- Quality gate per page: minimum 300 words of unique text, at least one image or video, at least 5 internal links in/out, valid schema, no placeholder text.
- `noindex` any auto-generated page that fails the gate. Only promote to `index` when it passes.

### Analytics & tracking
- Google Search Console (submit all sub-sitemaps)
- GA4 with event taxonomy: `technique_viewed`, `app_cta_clicked`, `gym_page_viewed`, etc.
- Server-side logs of bot traffic (Googlebot, GPTBot, ClaudeBot, Applebot) for AI-crawler visibility
- Rank tracking: Ahrefs / SE Ranking on a representative 200-keyword sample across pillars

### GEO (AI search) readiness
- Publish `/llms.txt` listing high-value pages
- Allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended in robots.txt (opt-in for citation traffic)
- Technique pages structured as quotable passages (one idea per paragraph, Q&A blocks, factual tables) — this is the AI-snippet format
- Add a standard "Quick answer" block at the top of each technique page that an AI can cite verbatim

---

## 6. E-E-A-T Plan

BJJ is YMYL-adjacent (injury risk). Authority signals are critical.

- **Every technique page lists a reviewing black belt** with: full name, belt lineage (e.g., "Rickson Gracie → Henry Akins → [reviewer]"), photo, competition credentials, link to their athlete profile.
- **Citations to federation sources** — IBJJF rules, CBJJ, UAEJJF where relevant.
- **"Last reviewed" dates** on every technique page, updated at least annually.
- **Author/editor pages** (`/team/{slug}`) with Person schema, sameAs links to social profiles.
- **Video-first proof of experience** — reviewing coaches should appear on camera in at least one technique page; builds first-person experience signal.
- **User-generated signals** — comments/notes on technique pages from app users (requires moderation).

---

## 7. KPI Targets

Baselines are current state (blank slate).

| Metric | Baseline (Apr 2026) | Month 3 | Month 6 | Month 12 |
|---|---|---|---|---|
| Organic sessions / mo | 0 | 3,000 | 25,000 | 120,000+ |
| Indexed pages | ~10 | 600 | 2,500 | 6,000+ |
| Keywords ranking (top 10) | 0 | 150 | 1,200 | 6,000+ |
| Keywords ranking #1 | 0 | 10 | 120 | 800+ |
| Referring domains | <10 | 40 | 120 | 300+ |
| Domain Rating (Ahrefs) | — | 15 | 25 | 40+ |
| App installs from organic / mo | 0 | 100 | 1,000 | 6,000+ |
| Core Web Vitals pass rate | — | >80% | >90% | >95% |
| AI-search citations tracked / mo | 0 | 20 | 150 | 600+ |

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Thin-content / "mass-generated" penalty | Quality gate per page, staged rollout, human coach review, at least 300 unique words per page |
| Duplicate content across technique variants | Strong canonicals, differentiation in each variant (position context changes the steps), hreflang when multilingual |
| Gym directory accuracy | Launch with 50 hand-verified cities. Only programmatically expand after manual seed proves accurate. Offer "claim this gym" flow. |
| YouTube dominance on video queries | Embed video + own the text-snippet layer; target "how to" and "why" queries that Google prefers text results for |
| AI-generated content detection | Use AI for first draft only. Every published page has a named reviewer and factual verification. Disclose AI assistance in editorial policy. |
| Slow indexation of 1000s of pages | Submit per-pillar sitemaps, use IndexNow for Bing, request indexing via GSC for hero pages, strong internal linking from the homepage |
| Competitor response (BJJ Fanatics publishes open content) | Unlikely — their model is paywalled video. Our structured-text moat is hard to copy without rebuilding their business. Build speed & authority buffer now. |

---

## 9. Budget & Resource Shape

This is a rough brief for engineers / stakeholders — exact numbers depend on team already in place.

**Team shape needed:**
- 1 SEO / content lead (full-time) — owns taxonomy, editorial standards, GSC
- 1 full-stack engineer (full-time, Phase 1) — builds templating, schema, sitemap, CMS
- 1 part-time BJJ coach / editor — reviews technique pages, adds experience signals
- 1 designer (part-time) — page templates, technique illustrations
- Freelance pool of 2–3 BJJ-knowledgeable writers — to write the first 200 technique pages; rest can be template-hybrid

**Monthly cost bands (rough):**
- Core team: existing engineering + ~$3–6k/mo for coach & writers
- Tools (Ahrefs/SEMrush, GSC, schema validator, CMS): $500–1,500/mo
- Link building / PR: $1–5k/mo from Phase 3 onward

---

## 10. Success Definition

By Month 12, The Otter Coach should be:
1. The open web's most linked-to BJJ technique reference
2. Driving >100k monthly organic sessions with >5k app installs from SEO
3. Cited by AI search assistants for BJJ how-to queries
4. Ranking top-3 for at least 30 head terms (triangle choke, rear naked choke, kimura, bjj belts, heel hook, armbar, etc.)
5. Positioned to monetize the gym directory through paid gym listings as a secondary revenue stream
