# Iteration 1 — Quality Gates (Automated, Solo Operator)

**Purpose:** replace human-in-the-loop review with automated gates + your own ad-hoc sampling. This is the doc that blocks the deploy button.

**Key constraint:** zero humans in the production pipeline. Gates that depended on human review have been replaced with deterministic checks + LLM-as-judge + a sampling dashboard you review at your own cadence.

---

## 1. The two-layer gate model (solo version)

Every programmatic page passes two automated layers before it's publicly indexable. Layer 3 (your ad-hoc sampling) is an after-the-fact audit that can trigger fixes — but it doesn't block publishing.

### Layer 1 — Build-time hard gates (blocks publish)
Deterministic CI checks. Fail one → page is not published or is `noindex`.

### Layer 2 — Publish-time intelligent gates (blocks publish)
LLM-as-judge and semantic checks. Slower, probabilistic, run per page before promotion.

### Layer 3 — Your random sampling (post-publish, non-blocking)
An auto-generated log surfaces 1–2 random pages per batch for you to eyeball. You look at it when you have time. If you spot issues, you trigger a rollback or fix.

---

## 2. Layer 1 — Build-time hard gates

A page **cannot publish with `index, follow`** unless ALL of the following pass. CI enforced.

### 2.1 Required fields
Per `DATA-SCHEMAS.md` — any required field missing blocks publish. Pages missing required fields render with `noindex, follow` until the field is added.

### 2.2 Word count floor
Per page type — see `TEMPLATES.md`. Measured on rendered body text (excluding nav, header, footer, JSON-LD).

### 2.3 Shingle-based uniqueness floor (vs. all same-type pages)
5-gram shingle Jaccard similarity against every other page in the same type. Solo-operator floors:

| Type | Floor |
|---|---|
| Technique | 70% |
| Technique variation | 50% |
| Position | 75% |
| Belt | 60% |
| Curriculum module | 60% |
| Flow | 65% |
| Glossary | 80% |
| Drill | 60% |
| Athlete | 60% |
| Event | 55% |
| Event series | 55% |
| Reviewer profile | 75% |

**Hard stop:** any page <30% uniqueness blocks publish with no override. Any page between 30% and its type floor → `noindex` until enriched.

### 2.4 Embedding-based near-duplicate check
Beyond shingles, every page's rendered body text is embedded (any standard sentence-embedding model) and cosine-compared to the 5 nearest neighbors in the same page type. If cosine ≥0.92 against any neighbor, the page is flagged as a semantic near-duplicate and goes `noindex`. Catches paraphrased content that shingles miss.

### 2.5 Schema validation
Every page has JSON-LD matching its template spec. Validated at build with `schema-dts` types, and against Google's Rich Results Test in a nightly cron. Invalid schema blocks publish.

### 2.6 Internal linking count
Rendered page has ≥5 internal outbound links. Also checked: no page has >40 outbound links (spam signal).

### 2.7 Asset readiness
- ≥1 image OR embedded video
- Every `<img>` has width, height, alt
- Alt text ≥4 words, not keyword-stuffed
- Videos use facade loading (no unthrottled iframe)

### 2.8 Named reviewer
`reviewedById` resolves to a valid `Reviewer` record with complete bio, current belt ≥blue, and lineage. No placeholder reviewers ("BJJ Team"). At solo-op start, at minimum one named Reviewer covers all pages.

### 2.9 Citations required
Every record type lists `citationSources` with ≥1 (≥2 for Athletes, Belts, Events). Citations must include either a URL or a print source with author/title/year. No citations → `noindex`.

### 2.10 Date integrity
- `datePublished` and `dateModified` ISO-formatted
- `dateModified ≥ datePublished`
- Not future-dated

### 2.11 URL & slug sanity
- Slug passes `^[a-z0-9]+(-[a-z0-9]+)*$`
- URL depth ≤4 segments
- No duplicate slugs within page type (enforced at generation)

### 2.12 Lab Core Web Vitals
Lighthouse CI on one representative page per template, weekly:
- Performance ≥85
- LCP <2.5s lab
- CLS <0.1 lab

Template failures block further page generation from that template until fixed.

---

## 3. Layer 2 — Publish-time intelligent gates

These run once per page just before it's promoted from `noindex` staging to `index`. Slower and API-priced; still fully automated.

### 3.1 LLM-as-judge — standalone value test
A separate LLM call (different provider or model from the drafter, to reduce self-bias) scores the page on a 5-point rubric:

**Prompt:**
```
You are evaluating a Brazilian Jiu-Jitsu reference page. Score it on the
following rubric, 1 (poor) to 5 (excellent), and return JSON.

1. Standalone value: would a BJJ practitioner find this page genuinely
   useful if it were the only page on the site about this topic?
2. Factual plausibility: do the claims match what you know about BJJ?
   Flag anything that sounds wrong or made up.
3. Specificity: does it talk about this specific technique/athlete/term,
   or could it be swapped for another with minor word changes?
4. Trust signals: does it cite sources, name a reviewer, and link to
   related content appropriately?
5. Reader experience: is it well-structured and readable at the right
   level for someone earning their blue belt?

Return: { "scores": {1-5}×5, "flags": [string], "overall": 1-5 }
```

**Gate logic:**
- `overall ≥4` and no `factual plausibility <3` → pass, promote to `index`
- `overall 3` or any individual score `≤2` → `noindex`, log for review
- `overall ≤2` → `noindex`, flag for rewrite

LLM-as-judge is imperfect but catches the most obvious failures. Use a model different from the drafter (e.g., draft with Claude, judge with GPT, or vice versa — reduces self-preference).

### 3.2 Factual-consistency check (Athletes, Events, Belts only)
For fact-dense record types, run a check that extracts each factual claim from the rendered page (LLM call) and compares against the record's `citationSources`. Claims not traceable to a source are flagged.

Gate: if ≥2 unsupported factual claims, `noindex` until enriched.

### 3.3 N-gram frequency audit across the corpus
Runs nightly. Computes the most frequent 5–7 word phrases across all pages of a given type. If any phrase appears on ≥30% of pages (and isn't a natural template element like "Step 1:" or "Related Techniques"), flag the template — it's generating boilerplate that looks like scaled content to Google.

Action: investigate template, rewrite the offending section, regenerate affected pages in the next batch.

### 3.4 Anchor-text diversity audit
For every linked target page, count unique anchor texts used by inbound internal links. If <3 unique anchor texts across ≥10 inbound links, flag and rotate from the anchor pool.

---

## 4. Layer 3 — Your random sampling (non-blocking)

Automated log surfaces pages for you to eyeball. You look when you want. Acting on it is up to you.

### 4.1 The sampling log

Every batch promoted to production triggers an entry in a log (Google Sheet, Notion DB, or markdown file in the repo):

```
Batch 2026-05-06-technique-v-4
  42 pages promoted: technique variations
  Ship report: 2026-05-06 18:20 UTC
  Pass rate: Layer 1 = 39/42, Layer 2 = 36/39 passed to index.
    3 pages held as noindex for Layer 1 failures (uniqueness)
    3 pages held as noindex for Layer 2 factuality flags

  >>> RANDOM SAMPLE FOR REVIEW <<<
  - /technique/kimura/from-side-control    [link]
  - /technique/scissor-sweep/from-open-guard [link]

  (Eyeball these two at your convenience. If either fails your
   standalone-value test, reply 'rollback' in this doc and the
   CI will move that page to noindex and flag the batch for audit.)
```

### 4.2 Your sampling cadence target

No fixed requirement. Suggested cadence:
- **Weekly (5–10 min):** open the latest 1–2 sampling entries, eyeball the 2–4 surfaced pages
- **Monthly (30–60 min):** random-click 10 pages across the site (Ahrefs + GSC top-20 pages + 5 random from the sitemap), full read

### 4.3 Rollback flow

If a sampled page fails your gut check:
1. Add `"rollback": true` to the sampling log entry (or run a script)
2. CI (next run) moves that page to `noindex`
3. The batch is flagged for audit — automation re-runs Layer 2 gates on the whole batch with stricter thresholds
4. Any pages newly failing get `noindex` too
5. You investigate whether it's a one-off (page-level fix) or template-level (regenerate batch)

---

## 5. Batch plan (solo operator)

### 5.1 Batch size & cadence

| Page type | Batch size | Spacing |
|---|---|---|
| Technique (hero, first 50) | 10/batch | 1 week |
| Technique (bulk) | 30/batch | 2 weeks |
| Technique variation | 30/batch | 2 weeks |
| Position | 5/batch | 2 weeks |
| Belt | all 5 in 1 batch | — |
| Curriculum module | 10/batch | 2 weeks |
| Flow | 15/batch | 2 weeks |
| Glossary | 40/batch | 2 weeks |
| Drill | 20/batch | 2 weeks |
| Athlete | 20/batch | 2 weeks |
| Event | 10/batch | 2 weeks |

**Hard daily cap:** 40 pages promoted to `index` per calendar day, all types combined.

### 5.2 Monitoring window between batches

After a batch is promoted:
- **Wait at least 7 days** before the next batch of the same type
- Watch: indexation rate via GSC, any quality warnings, top ranking changes

**Stop publishing (same type)** if:
- Indexation rate for the previous batch <60% after 3 weeks
- Any GSC manual action or quality warning
- Aggregate organic traffic drops >15% week-over-week without external cause

Restart only after root-cause analysis.

---

## 6. Rollout schedule — first 9 months (Iteration 1)

### Phase 1 — Foundation (M1)
- M1 W1: build templates, gates, sampling pipeline
- M1 W2: belts (5), positions (10) — first real pages live, fully hand-reviewed by you
- M1 W3: techniques hero (10)
- M1 W4: techniques (15)
- **End M1: ~40 pages live**

### Phase 2 — Breadth (M2–M4)
- M2: techniques +40, glossary +40, drill +20 = ~100 new → ~140 total
- M3: techniques +30, variations +30, positions +20, glossary +40 = ~120 → ~260
- M4: variations +40, glossary +40, drills +40 = ~120 → ~380

### Phase 3 — Characters (M5–M9)
- M5: athletes +20, events +10, flows +15, variations +30 → ~455
- M6: athletes +30, events +15, flows +20, variations +30 → ~550
- M7: athletes +30, events +20, drills +30 → ~630
- M8: continue filling gaps across types → ~750
- M9: final push on glossary + athletes → ~900–1,000

**Monthly cap:** 150 new pages promoted to `index`. Adjust down if any gate signals turn red.

---

## 7. Automated monitoring — the daily/weekly/monthly setup

These run without your attention. Each sends you a summary you can ignore until it flags something.

### 7.1 Daily (automated email/Slack summary)
- GSC Coverage report diff vs. yesterday
- CrUX field data for any page template regression
- 404/500 error rate
- New "Discovered — not indexed" URLs

### 7.2 Weekly (automated summary)
- GSC performance: top gainers, losers, new top-100 keywords
- Indexation ratio (sitemap vs. indexed) — alert if <85%
- Uniqueness audit on 20 random pages
- AI citation tracker for 10 sample queries (ChatGPT, Perplexity, Google AI Overviews) — optional/paid if used

### 7.3 Monthly (automated + your ~1hr audit)
- Content decay report: pages with >20% QoQ traffic drop
- Zero-impression report: pages with 0 impressions after 90 days of indexing
- Near-duplicate re-scan: full-set shingle comparison
- Your 10-page random-read audit

---

## 8. Incident playbook

### 8.1 Thin-content signal from GSC
**Trigger:** GSC flags "Crawled — currently not indexed" across >10% of a batch, OR sudden traffic drop with no external cause.

**Solo response:**
1. Within 72h: identify affected pages (scripted query)
2. Bulk `noindex` the affected pages
3. Open the sampling log: are flagged pages concentrated in one type or template?
4. Root cause — template issue, LLM drift, uniqueness bug?
5. Fix template, regenerate batch, resubmit via GSC indexing API
6. Do not publish new batches of that type until issue is closed

### 8.2 Manual action (Google penalty)
**Solo response:**
1. Stop all publishing immediately
2. `noindex` the entire affected pillar
3. Read GSC's specific notice — it tells you what they saw
4. Audit every page in the affected set against the specific policy
5. Remediate (often requires consolidation, enrichment, or deletion)
6. Submit reconsideration request. Expect 2–6 weeks.

### 8.3 LLM drift detected via sampling
**Trigger:** your random sampling turns up multiple low-quality pages in recent batches.

**Response:**
1. Pause the drafting pipeline
2. Re-run Layer 2 gates with stricter thresholds on all pages from the last 4 weeks
3. Investigate: did the underlying LLM update? Did a template change?
4. Fix prompts or swap model
5. Resume at 50% volume for 2 weeks before restoring normal cadence

### 8.4 Zero-impression clusters
**Trigger:** monthly zero-impression report shows >10% of a page type with no search impressions after 90 days.

**Response:**
1. Spot-check 10 — are they genuinely weak, or just on obscure keywords?
2. For genuinely weak: consolidate into a richer parent page (e.g., three thin variation pages fold back into the canonical), 301 old URLs
3. For obscure-but-valid: add internal links from higher-traffic pages, boost in sitemap priority

---

## 9. Tooling summary

Your full toolchain for Iteration 1 gates:

| Purpose | Tool/service (suggested) |
|---|---|
| LLM drafting | Claude / GPT (paid API, estimate $50–200/mo at solo scale) |
| LLM-as-judge | Different provider/model from drafter |
| Shingle dedup | Custom script or `datasketch` Python lib |
| Embedding dedup | OpenAI/Voyage embeddings + cosine similarity |
| Schema validation | `schema-dts` at build; Rich Results Test cron |
| CI / build gates | GitHub Actions or similar |
| GSC / analytics | Google Search Console + GA4 |
| Rank tracking | Ahrefs / SE Ranking (paid, ~$30–100/mo) |
| Log / sampling dashboard | Notion DB or Google Sheet |
| Monitoring email | Simple cron → transactional email (Postmark/Resend free tier) |

Total monthly spend for the toolchain: $100–400 depending on LLM usage.

---

## 10. The one-paragraph summary

> "Iteration 1 ships BJJ knowledge content (techniques, belts, positions, flows, drills, glossary, athletes, events) using LLM-drafted pages gated by automated CI checks (required fields, word count, shingle and embedding uniqueness, schema, citations) plus an LLM-as-judge standalone-value test on every page pre-promotion. No humans review pages in the pipeline; an auto-generated log surfaces 2–4 random pages per batch for me to spot-check at my own cadence, with a one-line rollback path. Batches cap at 40 pages/day promoted, spaced 1–2 weeks apart. This lets a solo operator ship ~1,000 indexable pages over 9 months without triggering scaled-content-abuse risk."
