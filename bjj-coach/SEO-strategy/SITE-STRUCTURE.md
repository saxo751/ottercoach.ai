# Site Structure — URL Hierarchy & Internal Linking

**Prepared:** 2026-04-13

---

## 1. Top-Level URL Hierarchy

```
/
├── /app                            (product/landing, app store CTAs)
├── /pricing
├── /download
│
├── /technique                      (pillar 1 — hub)
│   ├── /technique/{slug}           (submission/sweep/escape canonical page)
│   └── /technique/{slug}/from-{position-slug}   (variation by position)
│
├── /position                       (pillar 2 — hub)
│   └── /position/{slug}            (closed-guard, half-guard, mount, etc.)
│
├── /concept                        (pillar 2b — subset)
│   └── /concept/{slug}             (frames, base, posture, grip-fighting)
│
├── /belts                          (pillar 3 — hub)
│   ├── /belts/{belt}               (white, blue, purple, brown, black)
│   └── /belts/{belt}/requirements
│
├── /curriculum
│   └── /curriculum/{belt}/{module}
│
├── /gyms                           (pillar 4 — directory)
│   ├── /gyms                       (USA hub)
│   ├── /gyms/{state}               (state page)
│   ├── /gyms/{state}/{city}        (city page — lists gyms)
│   └── /gyms/{state}/{city}/{gym-slug}
│
├── /athletes                       (pillar 5 — database)
│   ├── /athletes                   (hub — browse by lineage, academy, division)
│   └── /athletes/{slug}
│
├── /events                         (pillar 6 — database)
│   ├── /events/series/{series}     (adcc, ibjjf-worlds, naga, etc.)
│   ├── /events/{year}/{event-slug} (specific event)
│   └── /events/{year}/{event-slug}/results
│
├── /flow                           (pillar 7 — transitions)
│   └── /flow/{from-slug}-to-{to-slug}
│
├── /drills                         (pillar 8 — database)
│   ├── /drills                     (hub)
│   ├── /drills/level/{beginner|intermediate|advanced}
│   ├── /drills/position/{slug}
│   └── /drills/{slug}
│
├── /glossary                       (pillar 9 — reference)
│   ├── /glossary                   (A–Z index)
│   ├── /glossary/{letter}
│   └── /glossary/{term-slug}
│
├── /gear                           (pillar 10 — commercial)
│   ├── /gear/gi                    (best-of / buyer guide)
│   ├── /gear/gi/{brand}-{model}
│   ├── /gear/rash-guard
│   └── /gear/belts
│
├── /blog                           (editorial)
│   ├── /blog
│   ├── /blog/category/{slug}
│   └── /blog/{year}/{month}/{slug}
│
├── /team                           (E-E-A-T)
│   └── /team/{slug}                (coach/reviewer profile)
│
├── /about
├── /contact
├── /editorial-policy               (AI disclosure, review process)
└── /privacy, /terms
```

---

## 2. URL Design Rules

- All lowercase, hyphenated slugs. No underscores, no camelCase.
- No trailing slashes. Use 301 to enforce.
- No query parameters in canonical URLs. Filters/sorts use client-side state or `noindex`.
- Max one query-parameter variant per filter combination; all others `noindex` + `canonical` to unfiltered page.
- Max URL depth: 4 segments for indexable pages (e.g., `/gyms/ca/los-angeles/gracie-barra-la` = 4, OK).
- Slugs localize later via `/pt/` prefix for Portuguese, not as suffix/query.

---

## 3. Canonicalization Matrix

| Scenario | Canonical |
|---|---|
| `/technique/triangle-choke/from-closed-guard` (variation) | Self-canonical (unique content) |
| `/technique/triangle-choke?ref=xyz` | `/technique/triangle-choke` |
| `/gyms/ca/los-angeles?lat=34...&lng=-118...` | `/gyms/ca/los-angeles` |
| `/blog/tag/triangle` (tag archive) | `noindex, follow` |
| Pagination `/gyms/ca/los-angeles/page/2` | Self-canonical + prev/next semantic links |
| Print/amp variants | Primary page canonical (if AMP exists at all — recommend skip AMP in 2026) |

---

## 4. Internal Linking Architecture

### The Knowledge Graph
Each technique page links bidirectionally to:
- 1 parent **position** page (breadcrumb + contextual)
- 1–3 **counter** technique pages
- 1–3 **related/follow-up** technique pages
- 1 **belt level** where it's commonly taught
- 3+ **athletes** known for the technique
- 1+ **drill** pages that build the technique
- 0–3 **glossary** entries (inline link on first mention)

### Hub-and-spoke
- `/technique` (hub) links out to all technique pages.
- Each technique page links back to `/technique` + its position hub.
- Position hubs link to 10–30 technique pages each.

### Breadcrumbs
Every non-home page has BreadcrumbList schema and visible breadcrumbs:
`Home › Technique › Submissions › Triangle Choke › From Closed Guard`

### Navigation
- Header: App | Techniques | Positions | Belts | Gyms | Blog
- Footer: full column of pillar links + a "Start here" cluster pointing to /belts/white, /position/closed-guard, /technique/triangle-choke

---

## 5. Page Template Contracts

### Technique page template
Required components (in order):
1. H1: "{Technique Name} in Brazilian Jiu-Jitsu"
2. Quick answer block (1–2 sentences, ≤40 words, for AI citation)
3. Video embed (facade-loaded)
4. Step-by-step (HowTo schema)
5. Common mistakes (3–5, each with 1 sentence)
6. Counters (links to counter pages)
7. "Who uses it" (3+ athlete cards linking to athlete pages)
8. Belt level + curriculum link
9. Related techniques
10. FAQ block (3–5 Q&A, FAQPage schema)
11. Reviewed by {coach name, lineage, date}
12. App CTA
13. BreadcrumbList schema, VideoObject schema, HowTo schema

### Position page template
1. H1: "{Position Name} — Complete Guide"
2. Quick answer block
3. What it is / when you're in it
4. Key attacks (ItemList linking to techniques)
5. Key escapes (ItemList)
6. Key sub-positions (ItemList)
7. Top practitioners (athlete cards)
8. Drills for this position
9. Belt level taught
10. FAQ
11. App CTA
12. Schemas: Article, ItemList, BreadcrumbList

### Gym city page template
1. H1: "BJJ Gyms in {City}, {State}"
2. Map (static image above fold, interactive below)
3. Gym cards (name, address, primary instructor, star rating, gi/no-gi/kids flags)
4. Filter UI (client-side, non-indexable)
5. City context (short paragraph, BJJ history of the city if notable)
6. "Nearby cities" internal links
7. FAQ (typical class schedule, trial class pricing in city, etc.)
8. Schemas: ItemList of LocalBusiness, BreadcrumbList

### Athlete page template
1. H1: "{Athlete Name}"
2. Quick facts table (academy, lineage, weight class, born, active)
3. Career summary
4. Major accomplishments (year-by-year list)
5. Signature techniques (linked technique cards)
6. Notable matches (with YouTube embeds)
7. Lineage tree visualization (optional)
8. Schemas: Person, SportsOrganization (academy)

---

## 6. Sitemap Architecture

`/sitemap.xml` = sitemap index referencing:
- `/sitemap-core.xml` (homepage, /app, /pricing, pillar hubs)
- `/sitemap-techniques.xml`
- `/sitemap-positions.xml`
- `/sitemap-belts.xml`
- `/sitemap-athletes.xml`
- `/sitemap-gyms.xml` (may need multiple: `-gyms-ca.xml`, `-gyms-ny.xml`...)
- `/sitemap-events.xml`
- `/sitemap-drills.xml`
- `/sitemap-glossary.xml`
- `/sitemap-blog.xml`

Rules: max 50,000 URLs per file, max 50MB uncompressed. `lastmod` required. `priority` and `changefreq` optional (Google ignores but Bing uses).

---

## 7. Robots & Indexing Directives

**robots.txt (recommended):**
```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Disallow: /api/
Disallow: /*?filter=
Disallow: /search

Sitemap: https://www.theottercoach.com/sitemap.xml
```

**Per-page indexing rules:**
- Default: `index, follow`
- Pages failing quality gate: `noindex, follow` until gate passes
- Tag archives and filtered listings: `noindex, follow`
- User profile / settings / app-internal pages: `noindex, nofollow`
- Thank-you / post-signup pages: `noindex, nofollow`
