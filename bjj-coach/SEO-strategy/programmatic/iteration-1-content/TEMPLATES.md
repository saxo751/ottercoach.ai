# Iteration 1 — Page Templates

**Scope:** all non-geo templates. One section per page type with structure, required schema, uniqueness floor, word count floor, and a worked example.

Every template has three content types:
- **STATIC** — same on every page of this type (nav, footer)
- **TEMPLATED** — structure shared, content per-record (breadcrumbs, cards)
- **UNIQUE** — per-record long-form text (steps, narrative, FAQ answers)

Uniqueness math lives in TEMPLATED + UNIQUE.

> **Solo-operator adjustment:** uniqueness floors are bumped +5–10% vs. the team-operated spec. This is conservative on purpose — without human review, structural uniqueness is the main defense against thin-content penalties.

---

## 1. Technique page

- **URL:** `/technique/{slug}`
- **Schema:** `HowTo`, `VideoObject`, `BreadcrumbList`, `FAQPage`
- **Uniqueness floor:** 70% (solo: bumped from 60%)
- **Word count floor:** 500 body words (solo: bumped from 450)

### Structure
1. BreadcrumbList (templated) — Home › Techniques › {category} › {name}
2. H1 (templated) — `"{name} — Step-by-Step BJJ Technique"`
3. Quick answer block (unique) — `Technique.shortDescription`, ≤40 words, distinct card for AI citation
4. Video embed (templated, facade-loaded) + `VideoObject` schema
5. Overview (unique) — `Technique.longDescription`, ≥150 words
6. Step-by-step (unique) — renders `Technique.steps[]` with HowTo schema
7. Common mistakes (unique) — renders `Technique.commonMistakes[]`
8. Legal & belt context (templated from `legalByRuleset` + `targetBeltId`)
9. Counters (templated — cards for `counterTechniqueIds[]`)
10. Follow-ups (templated — cards)
11. Who uses it (templated — athlete cards)
12. Related techniques (templated)
13. FAQ (unique, 3–5 Q&A; generated against template prompts that use record data)
14. Sources (templated — renders `citationSources[]` with inline links)
15. Reviewed by (templated — Reviewer card + lineage + dateModified)
16. App CTA (static)

### Required JSON-LD
`HowTo` + `VideoObject` (if video) + `BreadcrumbList` + `FAQPage` + `citation` array pointing to `citationSources[].url`.

### Worked example — Triangle Choke

Record: slug `triangle-choke`, parent position `closed-guard`, 6 steps, 4 mistakes, 2 counters, 3 practitioners, 2 citation sources (Marcelo Garcia book + a Roger Gracie instructional).

Rendered body (approximate word budget):
- Overview 170w · Steps 180w · Mistakes 160w · FAQ 140w · Intro/sources/boilerplate 80w · ≈ 730w
- Shared template boilerplate: ~120w (headings, "Reviewed by," card labels)
- Unique ≈ 610/730 ≈ 84%. Passes the 70% floor comfortably.

---

## 2. Technique Variation page

- **URL:** `/technique/{technique-slug}/from-{position-slug}`
- **Schema:** same as Technique
- **Uniqueness floor:** 50% (solo: bumped from 40%)
- **Word count floor:** 400

Same structure as §1 but:
- H1: `"{name} from {position-name}"`
- Quick answer is variation-specific
- Prominent link back to canonical
- Skip creating this if rewritten steps would share >50% text with canonical — fold into canonical instead

---

## 3. Position page

- **URL:** `/position/{slug}`
- **Schema:** `Article`, `BreadcrumbList`, `ItemList` (of techniques)
- **Uniqueness floor:** 75% (solo: bumped from 70%)
- **Word count floor:** 750

### Structure
1. Breadcrumbs
2. H1: `"{name} — Complete Guide"`
3. Quick answer (unique)
4. What it is / when you're in it (unique, `whenYoureInIt`)
5. Hero image + optional video
6. Long description (unique, ≥300 words, `description`)
7. Sub-positions (templated ItemList)
8. Primary attacks (templated cards)
9. Primary escapes (templated)
10. Counter positions (templated)
11. Drills for this position (templated)
12. Top practitioners (templated athlete cards)
13. Belt curriculum connection
14. FAQ (unique, 3–5 Q&A)
15. Sources
16. Reviewed by
17. App CTA

---

## 4. Belt page

- **URL:** `/belts/{belt}`
- **Schema:** `Course`, `BreadcrumbList`, `ItemList`
- **Uniqueness floor:** 60% (solo: bumped from 50%)
- **Word count floor:** 650

### Structure
1. Breadcrumbs
2. H1: `"{name} — BJJ Belt Guide"`
3. Quick answer
4. What the belt means (unique, ≥200 words)
5. Time at belt table (typical / min / max)
6. Federation variants (comparison table — IBJJF / Gracie Humaita / Gracie Barra) — unique per belt
7. Core techniques checklist (templated → technique pages)
8. Core positions (templated)
9. Curriculum modules (templated → `/curriculum/{belt}/{module}`)
10. Stripes & promotion criteria
11. FAQ
12. Sources
13. Reviewed by

---

## 5. Curriculum module page

- **URL:** `/curriculum/{belt}/{module}`
- **Schema:** `Course`, `ItemList`
- **Uniqueness floor:** 60%
- **Word count floor:** 400

Structure: breadcrumbs → H1 → quick answer → description (unique, ≥200 words) → technique checklist → drill checklist → estimated weeks → federation variant notes → sources → reviewed by.

---

## 6. Flow page

- **URL:** `/flow/{from-slug}-to-{to-slug}`
- **Schema:** `HowTo`, `VideoObject`
- **Uniqueness floor:** 65% (solo: bumped from 60%)
- **Word count floor:** 450

### Structure
1. Breadcrumbs
2. H1: `"{From} → {To}: BJJ Transition Guide"`
3. Quick answer
4. Trigger conditions (unique, ≥80 words — when to use it)
5. Step-by-step transition (unique)
6. Common mistakes (unique)
7. Video embed
8. Related flows (templated — same "from", same "to", same position)
9. Sources
10. Reviewed by

Editorial-quality content at programmatic URL shape. Flows are only published when a real transition exists per `citationSources`.

---

## 7. Glossary page

- **URL:** `/glossary/{term-slug}`
- **Schema:** `DefinedTerm`, `BreadcrumbList`
- **Uniqueness floor:** 80% (solo: bumped from 70%)
- **Word count floor:** 150

### Structure
1. Breadcrumbs: Home › Glossary › {Letter} › {Term}
2. H1: term
3. Quick definition (unique, 1–2 sentences)
4. Longer definition (unique, ≥80 words)
5. Etymology (if any)
6. First-use context
7. Translations (if any)
8. Related terms (templated)
9. Related techniques/positions (templated)
10. Sources

Glossary entries should read like mini-encyclopedia articles, not dictionary stubs.

---

## 8. Drill page

- **URL:** `/drills/{slug}`
- **Schema:** `ExerciseAction` + `HowTo`
- **Uniqueness floor:** 60% (solo: bumped from 55%)
- **Word count floor:** 350

Structure: breadcrumbs → H1 → quick answer → level/duration/reps card → description → instructions (steps) → coaching points → progressions → common mistakes → related drills → sources → reviewed by.

---

## 9. Athlete page

- **URL:** `/athletes/{slug}`
- **Schema:** `Person`, `BreadcrumbList`
- **Uniqueness floor:** 60% (solo: bumped from 50%)
- **Word count floor:** 400

### Structure
1. Breadcrumbs
2. H1: athlete name (+ nickname)
3. Quick facts card (academy, lineage, weight class, belt, status, nationality)
4. Career summary (unique, ≥200 words)
5. Major accomplishments (templated year-by-year list, each with citation URL)
6. Signature techniques (templated cards)
7. Notable matches (templated with YouTube embeds where available)
8. Lineage chain
9. Related athletes (same academy, same weight class, same generation — templated)
10. Sources (prominent — every biographical claim backed)

Athlete pages are the highest hallucination risk. Citation requirements are strict; unfulfilled pages stay `noindex`.

---

## 10. Event page

- **URL:** `/events/{year}/{event-slug}`
- **Schema:** `SportsEvent`, `BreadcrumbList`
- **Uniqueness floor:** 55% (solo: bumped from 45%)
- **Word count floor:** 450

Structure: breadcrumbs → H1 → key facts (date, location as text, ruleset) → narrative (unique, ≥200 words) → division results → storylines → notable matches → previous/next edition → sources.

---

## 11. Event Series hub

- **URL:** `/events/series/{series}`
- **Schema:** `Article`, `BreadcrumbList`, `ItemList`

Structure: description (≥200 words) → list of events in series (year-by-year) → organization → notable records → related series.

---

## 12. Reviewer profile page

- **URL:** `/team/{slug}`
- **Schema:** `Person`
- **Uniqueness floor:** 75% (solo: bumped from 70%)
- **Word count floor:** 300

Full reviewer bio, lineage, credentials, academy, links to all pages they've reviewed. This is the human face of E-E-A-T.

---

## 13. Hub pages

Hand-crafted hubs for `/technique`, `/position`, `/belts`, `/glossary`, `/drills`, `/athletes`, `/events`. Not templated — these are home pages for each pillar. ≥800 words each, with faceted navigation into child pages and a "Start here" block for beginners.

---

## Template design rules (applies to every template)

### Forbidden patterns (enforced by automated gates — see `QUALITY-GATES.md`)
- **String-replace mad-libs:** e.g., `"The {technique} is a {type} from {position}."` repeated with swapped nouns across ≥3 pages. Detected by n-gram frequency across the corpus.
- **Identical intro/outro paragraphs.** CI fails if detected.
- **Generic FAQ.** Every FAQ entry must reference at least two record fields (technique name + position, or athlete name + academy, etc.).
- **Identical anchor text across ≥5 inbound links.** Rotate from a 3–5 anchor pool per target page.

### Required patterns
- **Schema first** — JSON-LD is in the template, not an afterthought. Missing or invalid schema blocks publish.
- **Named reviewer visible** on every page.
- **Sources visible** in a dedicated section on every page.
- **`dateModified` visible** AND in schema.
- **Build-time assertion:** every rendered page has ≥5 internal outbound links.
- **Image integrity:** every `<img>` has explicit width/height, alt ≥4 words.

### Template versioning
Every page stores a `templateVersion` string. Material template changes flag affected pages for re-generation in the next batch — never silently rewrite thousands of pages at once.

---

## Template uniqueness engineering

The specific techniques that push structural uniqueness well above the floor (so LLM drafting doesn't need to work hard to pass the gate):

- **Steps and mistakes are per-record.** Never shared across pages.
- **FAQ generation is record-grounded.** Prompt includes 5+ fields of the specific record; LLM asked to write answers referencing those fields.
- **Sources vary per page.** Citations are real and different.
- **Counters/follow-ups/related** link to different pages per record, creating different card-label text automatically.
- **Quick answer is hand-grounded** — written against the specific technique's distinguishing characteristic, not boilerplate.

Following these, a typical technique page runs 80–90% unique, comfortably above the 70% floor.
