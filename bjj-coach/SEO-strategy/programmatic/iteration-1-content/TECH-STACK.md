# Iteration 1 — Tech Stack & Implementation Design

**Scope:** the technical stack and system design that executes everything specified in `STRATEGY.md`, `DATA-SCHEMAS.md`, `TEMPLATES.md`, and `QUALITY-GATES.md`.
**Operator model:** solo, no humans in generation pipeline.
**Prepared:** 2026-04-13

---

## 1. Design goals

The stack must, in priority order:

1. **Enforce the quality gates as CI checks**, not as config-overridable policy. QUALITY-GATES.md explicitly requires this.
2. **Keep the pipeline deterministic and auditable.** Every published page must be traceable to a prompt version, a draft run, and a git commit.
3. **Hit Core Web Vitals floors** from the spec (Lighthouse ≥85, LCP <2.5s, CLS <0.1) without per-page tuning.
4. **Minimize moving parts** so a solo operator can run the pipeline for 9 months without infra drift.
5. **Make rollback a one-line action** (`git revert` or a flag edit in a log file).

Non-goals:
- A CMS UI (no humans will author content by hand; LLM pipeline writes content).
- Incremental Static Regeneration or server rendering (everything is static).
- Multi-writer collaboration (solo op).

---

## 2. Headline decisions

| Decision | Choice | Why |
|---|---|---|
| Domain layout | **SEO site at `theottercoach.com` apex; app moves to `app.theottercoach.com`** (see `APP-MIGRATION.md` — Step 1 of rollout) | Static content site at the apex gets the SEO benefit of the app's signals; app is unaffected functionally. |
| Content storage | **Git-versioned content collections** (MDX + JSON files in the repo) | Version history is free; rollback = `git revert`; every ship = a PR = an audit trail. No CMS infra surface. |
| Site framework | **Astro** (SSG) | Content Collections with Zod schemas map 1:1 with `DATA-SCHEMAS.md`; islands architecture → near-zero JS → easiest path to CWV floors; fast full-site builds at 1.5k pages. |
| Pipeline pattern | **Code-first, GitHub-native** — TypeScript scripts invoked by scheduled GitHub Actions | Gates run as PR checks (matches spec's "CI enforced" language literally); no external workflow engine to audit. |
| Hosting | **Cloudflare Pages** *(assumed; confirm)* | Free bandwidth, edge-native, excellent CWV, simple custom-domain setup. Vercel is a drop-in alternative if preferred. |
| Drafting model | **Claude Sonnet 4** | Strong on technical BJJ content and structured output. |
| Judge model | **GPT-4o-mini** (different family) | Reduces self-preference bias per QUALITY-GATES §3.1. |
| Embeddings | **OpenAI `text-embedding-3-small`** | Cheap, good enough for cosine dedup; vector cache stored in repo as JSON. |

---

## 3. System architecture

```
                                                 ┌──────────────────────┐
                                                 │   theottercoach.com  │
                                                 │ (Astro SSG, CF Pages)│
                                                 └──────────▲───────────┘
                                                            │ deploy on merge
                                                            │
┌─────────────────┐   scheduled cron      ┌─────────────────┴─────────────────┐
│   Anthropic /   │◄──── draft call ──── │          GitHub Actions           │
│   OpenAI APIs   │                       │                                   │
└─────────────────┘                       │  - draft-batch.yml     (cron)     │
         ▲                                │  - gates.yml           (on PR)    │
         │ embed/judge                    │  - deploy.yml          (on merge) │
         │                                │  - promote.yml         (cron)     │
┌─────────────────┐                       │  - digest.yml          (cron)     │
│  OpenAI embeds  │                       └───────────────┬───────────────────┘
│  text-embed-3-s │                                       │ opens PR / commits
└─────────────────┘                                       ▼
                                                 ┌──────────────────┐
                                                 │  bjj-coach repo  │
                                                 │  Astro + content │
                                                 │  + pipeline code │
                                                 └────────┬─────────┘
                                                          │ reads
                                                          ▼
                                                 ┌──────────────────┐
                                                 │   External data  │
                                                 │  GSC, Ahrefs,    │
                                                 │  Resend (email)  │
                                                 └──────────────────┘

app.theottercoach.com  ←  existing Angular SPA (moved off apex)
```

Five moving parts:

1. **Astro site** (`web-seo/`) — statically built to Cloudflare Pages on every merge to `main`.
2. **Content collections** (`web-seo/src/content/`) — the record files; the single source of truth for published content.
3. **Pipeline code** (`pipeline/`) — TypeScript for drafting, gates, promotion, monitoring.
4. **GitHub Actions workflows** (`.github/workflows/`) — scheduled and PR-triggered glue.
5. **Sampling log** (`content-ops/sampling-log.md`) — the solo operator's rollback control surface.

---

## 4. Repository layout

```
bjj-coach/
├── web-seo/                              # NEW — the static site (Astro)
│   ├── astro.config.mjs
│   ├── src/
│   │   ├── content/
│   │   │   ├── config.ts                 # Zod schemas (source of truth)
│   │   │   ├── techniques/               # 400–600 MDX files
│   │   │   ├── variations/
│   │   │   ├── positions/
│   │   │   ├── belts/                    # 5 JSON files
│   │   │   ├── curriculum/
│   │   │   ├── flows/
│   │   │   ├── glossary/                 # 150–250 JSON files
│   │   │   ├── drills/
│   │   │   ├── athletes/
│   │   │   ├── events/
│   │   │   ├── event-series/
│   │   │   ├── reviewers/
│   │   │   └── citations/
│   │   ├── pages/                        # Astro route files per page type
│   │   ├── components/                   # cards, breadcrumbs, JSON-LD blocks
│   │   ├── lib/
│   │   │   ├── schema-ld.ts              # JSON-LD builders
│   │   │   ├── related.ts                # related-content + anchor-pool logic
│   │   │   └── sitemap.ts                # sitemap with noindex filtering
│   │   └── embeddings/
│   │       └── index.json                # vector cache (regenerated in CI)
│
├── pipeline/                             # NEW — all pipeline code
│   ├── src/
│   │   ├── draft/                        # one drafter per record type
│   │   ├── gates/
│   │   │   ├── required-fields.ts        # Zod (Layer 1)
│   │   │   ├── word-count.ts             # Layer 1
│   │   │   ├── shingle-uniqueness.ts     # Layer 1
│   │   │   ├── embedding-dedup.ts        # Layer 1
│   │   │   ├── schema-valid.ts           # Layer 1
│   │   │   ├── link-count.ts             # Layer 1
│   │   │   ├── citations.ts              # Layer 1
│   │   │   ├── judge.ts                  # Layer 2 LLM-as-judge
│   │   │   ├── factual-check.ts          # Layer 2 (Athletes/Events/Belts)
│   │   │   ├── ngram-audit.ts            # Layer 2, nightly
│   │   │   └── anchor-diversity.ts       # Layer 2, nightly
│   │   ├── prompts/                      # versioned prompt templates
│   │   ├── monitoring/
│   │   │   ├── gsc-digest.ts
│   │   │   └── ahrefs-digest.ts
│   │   └── cli/
│   │       ├── draft-batch.ts
│   │       ├── run-gates.ts
│   │       ├── promote.ts
│   │       └── digest.ts
│   └── package.json
│
├── content-ops/
│   ├── sampling-log.md                   # rollback trigger surface
│   ├── queue.json                        # publishing plan per STRATEGY.md §4
│   └── prompt-versions.md                # changelog of prompt versions
│
└── .github/workflows/
    ├── draft-batch.yml                   # cron (Mon/Thu 09:00 UTC)
    ├── gates.yml                         # on PR to main
    ├── deploy.yml                        # on push to main
    ├── promote.yml                       # cron (daily 14:00 UTC)
    └── digest.yml                        # cron (Mondays 08:00 UTC)
```

The existing `mobile/`, `server/`, `web/` directories (the BJJ coaching app) are untouched. `web-seo/`, `pipeline/`, and `content-ops/` are new top-level additions.

---

## 5. Content collections & schemas

Astro Content Collections use Zod schemas defined in `web-seo/src/content/config.ts`. Every type in `DATA-SCHEMAS.md` becomes a Zod schema with identical field names, optionality, and enums.

**Authoritative benefit:** the same Zod types are imported by:
- Astro at build time (validates every file, blocks build on failure)
- The drafting pipeline to validate LLM JSON output before writing to disk
- The `required-fields` gate in CI

This means the schemas never drift between spec, site build, and pipeline.

**Record file format:**

| Record type | Format | Reason |
|---|---|---|
| Technique, TechniqueVariation, Position, Athlete, Flow, Drill | MDX | Long-form body content benefits from inline component use (callouts, step cards, video embeds). |
| Belt, CurriculumModule, GlossaryTerm, Event, EventSeries, Reviewer, Citation | JSON | Tabular data with no long-form narrative; JSON keeps it purely structured. |

**File naming:** one record per file, slug-named (e.g., `techniques/triangle-choke.mdx`).

**Noindex flag:** every record carries a `noindex: boolean` frontmatter field. The site's sitemap generator and page-level `<meta>` tag respect it. Promotion from noindex to index is a flag flip (see §9).

---

## 6. Page templates & routing

One Astro route file per page type, fed by `getCollection()`:

| Route file | URL pattern | Schema types emitted |
|---|---|---|
| `pages/technique/[slug].astro` | `/technique/{slug}` | HowTo + VideoObject + BreadcrumbList + FAQPage |
| `pages/technique/[tech]/from-[pos].astro` | `/technique/{tech-slug}/from-{pos-slug}` | same as technique |
| `pages/position/[slug].astro` | `/position/{slug}` | Article + BreadcrumbList + ItemList |
| `pages/belts/[slug].astro` | `/belts/{belt}` | Course + BreadcrumbList + ItemList |
| `pages/curriculum/[belt]/[module].astro` | `/curriculum/{belt}/{module}` | Course + ItemList |
| `pages/flow/[slug].astro` | `/flow/{from-slug}-to-{to-slug}` | HowTo + VideoObject |
| `pages/glossary/[slug].astro` | `/glossary/{term-slug}` | DefinedTerm + BreadcrumbList |
| `pages/drills/[slug].astro` | `/drills/{slug}` | ExerciseAction + HowTo |
| `pages/athletes/[slug].astro` | `/athletes/{slug}` | Person + BreadcrumbList |
| `pages/events/[year]/[slug].astro` | `/events/{year}/{event-slug}` | SportsEvent + BreadcrumbList |
| `pages/events/series/[slug].astro` | `/events/series/{series}` | Article + BreadcrumbList + ItemList |
| `pages/team/[slug].astro` | `/team/{slug}` | Person |
| Hub pages | `/technique`, `/position`, `/belts`, etc. | Hand-authored MDX |

**Shared components** in `web-seo/src/components/`: `<Breadcrumb>`, `<RelatedCard>`, `<SourcesList>`, `<ReviewerByline>`, `<Faq>`, `<VideoFacade>` (lazy-loaded video embed for CLS), `<JsonLd>`.

**JSON-LD is rendered from structured fields by builders in `lib/schema-ld.ts`**, not hand-written per template. Schema-dts provides type safety; the `schema-valid` gate verifies output at build.

**Internal linking logic** lives in `lib/related.ts`: given a record, returns its counters, follow-ups, related, variations, and glossary links. Bidirectional enforcement and anchor-text rotation happen here. The build fails if any rendered page has <5 outbound internal links.

---

## 7. Drafting pipeline

Triggered by `.github/workflows/draft-batch.yml` on a schedule (Mon/Thu 09:00 UTC). Can also be invoked manually via workflow_dispatch.

**Per run:**

1. **Queue selection** (`cli/draft-batch.ts`)
   - Reads `content-ops/queue.json` (the publishing plan derived from STRATEGY.md §4 and QUALITY-GATES.md §5.1).
   - Picks up to the batch size for this type (e.g., 30 techniques, 40 glossary terms).
   - Respects the per-type spacing constraint — won't pick the same type twice within its cooldown.

2. **Draft** (`draft/<type>.ts`)
   - For each record, calls Claude Sonnet 4 with a type-specific prompt from `pipeline/src/prompts/`.
   - Prompt includes: the record's structured fields (name, position, category, citation sources), style guide excerpts, template-specific requirements (step count floor, word count floor, forbidden mad-lib patterns), and few-shot examples from already-published canonical pages.
   - LLM returns structured JSON matching the Zod schema for that record type.

3. **Validate & retry** (`draft/common.ts`)
   - Zod-validate the LLM output.
   - On schema failure, retry once with the error attached to the prompt.
   - On second failure, skip the record, log to the run report.

4. **Write** — commit MDX/JSON to disk with `noindex: true` frontmatter.

5. **Pre-gate locally** — run cheap gates (required-fields, word-count, link-count) in the same job to fail fast on structural issues before opening a PR.

6. **Open PR** — branch name `draft/batch-YYYY-MM-DD-<type>`, PR targets `main`. PR body contains: records drafted, prompt version used, tokens consumed, local pre-gate results.

**Determinism:** every draft run records its prompt version (`content-ops/prompt-versions.md`), model ID, and temperature in the PR description. A re-run with the same inputs → the same record set gets drafted (but content differs because LLMs aren't deterministic; that's fine — the audit trail is what matters).

---

## 8. Quality gates

Two workflows enforce the spec's Layer 1 and Layer 2 gates.

### 8.1 `gates.yml` — PR blocker (Layer 1 + Layer 2)

Runs on every PR to `main`. Each gate is a separate job/step; failures are non-overridable.

**Layer 1 (deterministic, fast):**
| Gate | Implementation |
|---|---|
| Required fields | Zod schema validation across all changed records |
| Word count floor | Count body words on rendered Astro output for each changed page |
| Shingle uniqueness (5-gram Jaccard) | Per-type, against all other records of the same type |
| Embedding near-duplicate | Cosine against top-5 neighbors in `web-seo/src/embeddings/index.json` |
| Schema-dts validation | Build-time TypeScript check + `schema-valid.ts` post-build |
| Internal link count | Each page parsed for `<a>` tags to internal URLs, count 5–40 |
| Asset readiness | Every `<img>` has width/height/alt (≥4 words) |
| Named reviewer | `reviewedById` resolves to a valid Reviewer record |
| Citations | ≥1 (≥2 for Athletes/Belts/Events); URL or print source with year |
| Date integrity | `datePublished` and `dateModified` ISO-valid, not future, dateModified ≥ datePublished |
| Slug sanity | Regex `^[a-z0-9]+(-[a-z0-9]+)*$`; URL depth ≤4; no duplicates |
| Lab CWV (weekly) | Lighthouse CI on one representative page per template; fails template if <85 / LCP >2.5s / CLS >0.1 |

**Layer 2 (LLM-based, slower):**
| Gate | Implementation |
|---|---|
| LLM-as-judge standalone value | GPT-4o-mini scores each changed page on the 5-point rubric; overall <4 or any score ≤2 → gate fails |
| Factual consistency | Athletes/Events/Belts only. LLM extracts factual claims, cross-references against record's `citationSources`. ≥2 unsupported → fail. |

**Merge policy:** auto-merge bot (GitHub Actions) merges green PRs to `main` after a 15-minute hold window. Holds allow you to intervene manually if a sampled page looks bad.

### 8.2 Nightly audit workflow

Separate cron (`.github/workflows/nightly.yml`, 03:00 UTC):
- **N-gram frequency audit** across the full corpus per page type. Flags any 5–7 gram appearing on ≥30% of pages (excluding natural template elements).
- **Anchor-text diversity audit**. Flags any target page with <3 unique anchors across ≥10 inbound links.
- **Rich Results Test ping** on a sample of 20 random pages.
- **Embedding index rebuild** when content changes.

Audit failures don't block publish — they open a GitHub Issue tagged `audit` for you to triage.

---

## 9. Promotion & sampling

### 9.1 Promotion — `promote.yml` (cron, daily 14:00 UTC)

Promotion is the noindex → index flip.

1. Load all records with `noindex: true`.
2. Exclude records whose batch is within its per-type spacing cooldown (QUALITY-GATES.md §5.1).
3. Select up to 40 (hard daily cap) to promote, oldest-batch-first.
4. Re-run Layer 2 gates on each one final time.
5. For those that still pass: flip `noindex: false`, commit to `main` with message `promote: batch <id> (N pages)`, triggering deploy.
6. Append a sampling log entry (§9.2).

### 9.2 Sampling log — `content-ops/sampling-log.md`

Markdown file, one entry appended per promote run:

```md
## Batch 2026-05-06-technique-v-4 — promoted 2026-05-06 14:00 UTC

- 42 pages promoted (technique variations)
- Layer 1: 39/42 passed; 3 held as noindex (uniqueness)
- Layer 2: 36/39 passed to index; 3 held (factuality flags)

### Random sample
- [ ] /technique/kimura/from-side-control
- [ ] /technique/scissor-sweep/from-open-guard

<!-- rollback: false -->
```

**Rollback mechanism:** edit the line to `<!-- rollback: true -->` and push. The next `promote.yml` run detects the flag, flips the sampled pages (and the whole batch they belong to) back to `noindex`, and opens an audit issue.

### 9.3 Incident playbook in code

The three incidents from QUALITY-GATES §8 are each implemented as a CLI command you can invoke manually:

- `npm run incident:thin-content <batch-id>` — bulk-noindex an affected batch, open audit issue.
- `npm run incident:manual-action <pillar>` — noindex an entire pillar, pause drafting workflows.
- `npm run incident:drift` — pause drafting, re-run Layer 2 with stricter thresholds on the last 4 weeks.

All three are also idempotent and scripted so you can respond in 5 minutes without reading the playbook top-to-bottom.

---

## 10. Monitoring & digests

### 10.1 `digest.yml` — weekly (Monday 08:00 UTC)

TypeScript in `pipeline/monitoring/` pulls:
- **GSC Search Analytics API** — top gainers, losers, new top-100 keywords
- **GSC URL Inspection / Coverage** — indexation ratio (sitemap vs. indexed)
- **Ahrefs API** — rank movements, new referring domains
- **Uniqueness audit** — sample 20 random pages, report their shingle + embedding scores

Renders a markdown report, emails via Resend free tier to you. Fails loud (email prefix `[ALERT]`) if any of:
- Indexation ratio <85%
- >10% WoW traffic drop without external cause
- Any manual action in GSC

### 10.2 Daily thin-content watch — `daily-watch.yml` (cron)

Minimal job: GSC coverage API diff vs. yesterday. If `Crawled — currently not indexed` count jumps by >10% of the most recent batch's size → email alert.

### 10.3 Monthly — `monthly-audit.yml` (first of month)

- Zero-impression report: pages with 0 impressions after 90 days indexing
- Content decay: pages with >20% QoQ traffic drop
- Full-set shingle re-scan (catches latent near-dupes)

Output: a markdown report committed to `content-ops/monthly-reports/YYYY-MM.md` and emailed.

---

## 11. Deployment & hosting details

- **Hosting platform:** Cloudflare Pages. Production branch `main`. Preview deploys on every PR (great for eyeballing the random sample before merge).
- **Domain:** `theottercoach.com` apex serves the Astro site. `www.theottercoach.com` 301s to apex.
- **App migration:** the existing Angular SPA must move to `app.theottercoach.com` **before the content site can go live at the apex**. This is **Step 1 of Iteration 1 rollout** — see `APP-MIGRATION.md` for the full migration plan. Audit of the existing code confirmed this is a DNS/Vercel-dashboard exercise, not a source change; estimated ~2 hours of engineer work plus an external-references audit.
- **Environment variables (GitHub Actions secrets):**
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `GSC_SERVICE_ACCOUNT_JSON`
  - `AHREFS_API_TOKEN`
  - `RESEND_API_KEY`
  - `GITHUB_TOKEN` (auto-provided)
- **Build time budget:** Astro full-site build at 1,500 pages should land in 1–3 minutes on a standard Pages runner. Incremental builds (rebuild only changed pages) are not used; full rebuilds are cheap enough and simpler.
- **Sitemap & robots:** Astro's `@astrojs/sitemap` integration, configured to filter `noindex: true`. IndexNow ping on deploy via a post-deploy Cloudflare Pages hook.

---

## 12. Tooling summary & estimated costs

| Purpose | Tool | Monthly cost (solo scale) |
|---|---|---|
| LLM drafting | Anthropic Claude Sonnet 4 | $50–120 |
| LLM-as-judge | OpenAI GPT-4o-mini | $10–30 |
| Embeddings | OpenAI `text-embedding-3-small` | <$5 |
| Site hosting | Cloudflare Pages | $0 |
| CI | GitHub Actions (public repo: free; private: likely within free tier) | $0–20 |
| Rank tracking | Ahrefs or SE Ranking | $30–100 |
| Analytics | GSC + GA4 | $0 |
| Transactional email | Resend free tier | $0 |
| Uptime / CWV alerting | CF Pages analytics + Lighthouse CI | $0 |
| **Total** | | **$90–275/mo** |

Well inside the $100–400 envelope in QUALITY-GATES.md §9.

---

## 13. Open decisions to confirm

1. **Hosting platform:** defaulted to Cloudflare Pages. Vercel is an equivalent alternative; decide before infra setup.
2. **App domain migration:** moving the Angular app to `app.theottercoach.com` is **Step 1 of this iteration** and must be complete before the content site takes over the apex. Full plan in `APP-MIGRATION.md`. Confirm green-light to execute.
3. **Repo topology:** this design assumes `web-seo/`, `pipeline/`, `content-ops/` live inside the existing `bjj-coach/` monorepo. A separate repo is an option if you want stricter isolation — at the cost of losing proximity to the app's existing components and design tokens.

---

## 14. What this design does NOT cover

- **Visual design system.** The Anthropic-brand visual language already defined for the app (`/design-skill` per CLAUDE.md) is assumed to apply to the content site as well, adapted for long-form reading.
- **Iteration 2 (geo).** The stack is designed so Iteration 2 can add `cities/`, `states/`, `gyms/` collections to the same Astro site without reshaping anything. Same gates, same pipeline pattern.
- **Non-English locales.** Per STRATEGY.md, Portuguese is deferred to Iteration 1.5. Iteration 1 ships English-only with **no i18n code**. The URL design below has been pre-decided so Iteration 1 URLs are forward-compatible:
  - **Pattern:** subdirectories on the apex (`theottercoach.com/{locale}/...`), not subdomains or ccTLDs.
  - **English stays at root** (no `/en/` prefix). Preserves URL continuity when locales are added — no 301 churn.
  - **Other locales nest under ISO 639-1 prefixes** (`/pt/...`, `/es/...`, `/ja/...`).
  - **Slugs localize per language** except universally-imported BJJ terms that stay verbatim across locales (*kimura*, *berimbolo*, *omoplata*, *jiu-jitsu*, etc. — the pipeline will maintain an allowlist).
  - **Path segments localize too** (e.g., `/technique/` → `/pt/tecnica/`, `/es/tecnica/`).
  - **Hreflang:** each translated page renders a full reciprocal set of `<link rel="alternate" hreflang>` tags plus `x-default` pointing at the English (root) version. A new CI gate (asymmetric-hreflang) will be added in Iteration 1.5.
  - **URL depth cap:** Iteration 1 keeps the ≤4 cap from `QUALITY-GATES.md` §2.11. Iteration 1.5 will need to bump to ≤5 to accommodate the locale prefix on Variation URLs.
  - **Content collection layout for locales:** nested-by-locale (`content/techniques/pt/estrangulamento-triangular.mdx`). Each record carries a `translationOf: <canonical-id>` field linking alternates; the hreflang gate walks this graph.
- **Editorial blog track.** STRATEGY.md puts blog/editorial outside the programmatic pipeline. Those posts would be hand-authored MDX in a separate collection, not covered here.

---

## 15. Success criteria for this stack

The stack has succeeded when, at the end of Iteration 1:

- 1,000+ pages are live and indexed on `theottercoach.com`
- Every published page has complete JSON-LD, a named reviewer, ≥1 citation, ≥5 internal links, Lighthouse ≥85
- No gate has needed to be overridden manually
- Rollback has been exercised at least once and worked in <10 minutes
- You can brief an engineer on any single component in one sitting by pointing at the relevant file and its tests
