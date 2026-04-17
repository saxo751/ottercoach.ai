# Implementation Roadmap

**Prepared:** 2026-04-13
**Horizon:** 12 months, 4 phases

This is the engineering + editorial execution plan. Hand sections 1–4 to the dev team; hand section 5 (content calendar pointer) + editorial standards to the SEO/content lead.

---

## Phase 1 — Foundation (Weeks 1–4)

**Goal:** Ship a technically sound site with the first ~50 hero pages live, fully indexed, and ranking for at least 5 head terms.

### Week 1 — Audit & planning

**Engineering:**
- Audit current site (theottercoach.com) — rendering, Core Web Vitals, indexation status
- Decide rendering stack: **Recommendation:** Next.js App Router + ISR, deployed on Vercel, content from a headless CMS (Sanity/Payload/Contentful) or a typed JSON content layer. Alternative: Astro + content collections for lower complexity.
- Set up staging environment
- Install GSC, Bing Webmaster Tools, GA4, and a rank tracker (Ahrefs or SE Ranking)

**Content/SEO:**
- Finalize taxonomy: list of positions, technique families, belts, curriculum modules
- Draft editorial style guide (tone, voice, technique-description format, bilingual term handling)
- Set up review roster (2–3 named black belts)

### Week 2 — Core build

**Engineering:**
- Build page templates: homepage, technique, position, belt, glossary
- Implement schema helpers for: HowTo, VideoObject, Article, BreadcrumbList, FAQPage, Person, DefinedTerm
- Wire up sitemap generator (split per content type)
- Ship robots.txt, llms.txt, 301 rules, canonical rules
- CI check: every new page must pass Lighthouse ≥90 and have valid schema (use `schema-dts` or JSON-LD validator in CI)

**Content:**
- Write first 10 hero technique pages: **triangle choke, rear naked choke, armbar, kimura, guillotine, omoplata, americana, mount escape, closed guard, half guard** (chosen for volume + foundational importance)

### Week 3 — Expand & polish

**Engineering:**
- Build internal linking logic (related-techniques block, position breadcrumbs, counter-links)
- Image pipeline (AVIF/WebP, responsive srcset)
- Video facade component
- Analytics event taxonomy wiring

**Content:**
- 15 more technique pages
- 10 position pages (closed guard, half guard, mount, side control, back, knee on belly, turtle, open guard, butterfly guard, de la Riva)
- 5 belt pages + requirements

### Week 4 — Launch prep

- Full QA of 40–50 hero pages
- Submit sitemaps to GSC and Bing
- Request indexing on top 20 pages
- Start press/outreach to 10 BJJ newsletters/podcasts announcing the launch (seeds first referring domains)
- Internal smoke test: can a user find their way from home → any technique → app CTA in ≤3 clicks?

**Phase 1 exit criteria:**
- 40–50 pages published, all passing quality gate
- 100% schema validation
- Core Web Vitals passing on 75th percentile (lab and field)
- At least 20 pages indexed within 10 days of submission
- First rankings (likely position 20–50) visible for hero terms

---

## Phase 2 — Expansion (Weeks 5–12)

**Goal:** Scale to ~600 indexed pages. Establish topical authority. Launch gym directory MVP.

### Weeks 5–6: Technique encyclopedia build-out

- Ship technique writer/editor workflow in CMS: prompt-assisted first draft → human edit → coach review → publish
- Target: 30 technique pages/week
- Each page tagged with: position, submission-type, belt-level, counter-techniques
- Wire up automated internal linking for related-technique blocks

### Weeks 7–8: Position, concept, and glossary

- Finish all 40+ position pages
- Ship glossary template + A–Z index; write first 100 glossary entries
- Shoot or source video for the top 30 techniques (pairs with VideoObject schema)

### Weeks 9–10: Belt curriculum & drill database

- Belt pages with IBJJF and Gracie curriculum variants
- Drill database template — level × position × duration
- Publish first 60 drills

### Weeks 11–12: Gym directory MVP + first commercial pages

- Build gym directory templates (country → state → city → gym)
- Manually seed 50 US cities with verified gym data (prioritize: LA, NYC, SF, Chicago, Miami, Dallas, Houston, Seattle, Denver, Atlanta + top 40 by BJJ density)
- Launch "best gi under $X" and "best BJJ gi for beginners" buyer-guide pages (low-effort commercial wins)
- Start guest-post outreach for backlinks (target: goldbjj, evolve-mma blog, grapplearts, BJJ-related Substacks)

**Phase 2 exit criteria:**
- ~600 indexed pages
- 150+ keywords ranking in top 10
- First 3k organic sessions/mo
- 40+ referring domains
- Gym directory live in 50 cities

---

## Phase 3 — Scale (Weeks 13–24, Months 4–6)

**Goal:** Scale to ~2,500 indexed pages. Rank in top-3 for 100+ keywords. Start AI-search optimization in earnest. Launch Portuguese locale.

### Months 4–5: Volume build

- Scale content machine to 40–60 new pages/week (technique variations, gym cities, athlete profiles)
- Launch athlete database — seed 300+ athlete profiles with core data
- Expand gym directory to 250 US cities + Canada + UK
- Launch flow/transition pages (300+) — this is the unique programmatic angle

### Month 5: AI-search push

- Add standardized "Quick answer" blocks to top 500 pages
- Publish topic-cluster essays that AI crawlers love (definitive guides, comparative pieces)
- Track citation rates in ChatGPT, Perplexity, Google AI Overviews weekly
- Add `FAQPage` schema to all technique pages

### Month 6: Internationalization

- Launch Portuguese locale (`/pt/`) with hreflang
- Translate top 200 pages (techniques, positions, belts) first
- Portuguese BJJ search demand is enormous and even less competitive — this is a high-leverage move

### Link building push (Months 4–6)

- Digital PR: publish 2 original-data studies ("State of BJJ 2026", "Most common techniques at ADCC 2026 analyzed")
- HARO / Qwoted responses as "BJJ expert source"
- Guest posts on fitness/martial-arts sites (target 8–12 backlinks)
- Partnerships with BJJ podcasts (sponsor/exchange links)

**Phase 3 exit criteria:**
- ~2,500 indexed pages
- 1,200+ keywords ranking in top 10
- 25k organic sessions/mo
- 120+ referring domains
- Portuguese site live, indexing
- Regular AI-search citations (tracked)

---

## Phase 4 — Authority (Months 7–12)

**Goal:** Dominate the niche. 120k+ monthly organic sessions. Diversify revenue via gym listings.

### Months 7–9: Depth and authority

- Fill remaining technique variation pages (target 1,200 technique pages total)
- Expand athlete database to 500
- Publish thought-leadership: original video interviews with prominent coaches, written up as cornerstone articles
- Launch tournament results database — programmatically generate result pages for ADCC, IBJJF Worlds, Pans, Europeans, No-Gi Worlds (~100 events)
- Build the lineage tree feature — heavy internal linking win

### Months 10–12: Monetization and refinement

- Launch paid "Featured Gym" listings (monetization #2 alongside app installs)
- Refresh: rewrite the 100 top-traffic pages with updated info, fresh video, additional FAQs
- Ship content decay monitoring (auto-flag pages that lose >20% traffic QoQ)
- Second locale (Spanish) if Portuguese performs

### Continuous throughout Phase 4

- 2 blog posts/week (topical, evergreen)
- 5 new technique pages/week
- 100 new gym listings/week
- Monthly content audit: consolidate, redirect, or refresh low performers

**Phase 4 exit criteria (Month 12):**
- 6,000+ indexed pages
- 120k+ monthly organic sessions
- 800+ keywords ranking #1
- 300+ referring domains
- Paid gym listings generating second revenue line
- Recognized as the leading open-web BJJ reference

---

## 5. Cadence & Ownership

| Cadence | Owner | What |
|---|---|---|
| Daily | Eng on-call | Monitor GSC errors, Core Web Vitals regressions |
| Weekly | SEO lead | GSC review, ranking deltas, AI-citation check, content-velocity report |
| Bi-weekly | SEO lead + product | Review new page templates, plan next 2-week content sprint |
| Monthly | All | Full SEO report: traffic, rankings, installs, top & bottom pages, next priorities |
| Quarterly | Leadership | Strategic review: are we on trajectory? budget adjustments? next pillar? |

---

## 6. Critical Dependencies

- **Rendering stack decision** (Week 1) blocks everything. If the current site is a React SPA without SSR, this is the most important technical decision — it must be SSR/SSG.
- **CMS choice** (Week 1) blocks content workflow. Prefer a system that supports typed schemas (Payload, Sanity, Contentful), strong preview, and API-driven rendering.
- **Coach reviewer roster** (Week 1) blocks technique page publishing — do not publish techniques without a named reviewer.
- **Gym data source** (Week 11) — manual seed for MVP; partnership or scraping strategy for scale in Phase 4.

---

## 7. Handoff: First engineering brief

Paste the following into the first engineering ticket:

> **Goal:** Build a programmatic SEO site for BJJ content on theottercoach.com.
>
> **Must-haves:**
> - Server-rendered or statically generated pages (SSR/SSG). Pages must be fully crawlable without JS execution.
> - Content driven by a typed schema (positions, techniques, athletes, gyms, belts, drills, events).
> - Auto-generated XML sitemap, split per content type, linked from a root sitemap index. Max 50k URLs per file.
> - JSON-LD schema on every page: HowTo/VideoObject for techniques, Article for positions, Person for athletes, LocalBusiness for gyms, Course for belts.
> - Canonical URLs enforced (no trailing slashes, lowercase, query-params stripped).
> - Core Web Vitals targets: LCP < 2.5s, INP < 200ms, CLS < 0.1 at p75.
> - Image pipeline: AVIF/WebP, responsive srcset, explicit dimensions, lazy below fold.
> - YouTube embeds via facade (don't load iframe until click).
> - llms.txt at root; robots.txt allowing GPTBot, ClaudeBot, PerplexityBot, Google-Extended.
> - Internal linking: every technique page must automatically render related-content blocks driven by taxonomy tags.
> - Quality gate: pages without required fields render as `noindex` until fields are complete.
>
> **Nice-to-haves:**
> - IndexNow integration for Bing
> - Content decay dashboard
> - Static map renderer for gym pages
>
> **Tech preference:** Next.js 15 App Router + ISR + Vercel, content via headless CMS. Astro is acceptable if team is small.
