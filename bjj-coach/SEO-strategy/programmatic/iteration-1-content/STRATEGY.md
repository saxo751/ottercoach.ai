# Iteration 1 Strategy — Content & Knowledge

**Scope:** knowledge pages only. Techniques, positions, belts, curriculum, flows, drills, glossary, athletes, events, reviewer profiles. No geo.
**Operator model:** solo, no humans in generation pipeline.
**Prepared:** 2026-04-13

---

## 1. Why this iteration first

- **It's the authority layer.** Techniques, positions, belts, and athletes are how Google understands we're a serious BJJ site. Rank for these first and everything else gets easier later (including Iteration 2 geo pages, which benefit from internal links coming from the content layer).
- **No external data dependency.** Every record can be authored from publicly available BJJ knowledge. You don't need to verify real-world addresses, schedules, or phone numbers. Your only dependency is your own time and LLM quality.
- **Best keyword opportunity.** The head terms (triangle choke 7.4k, rear naked choke 5.6k, bjj belts 4.7k, heel hook 3.2k, armbar 3.1k) all sit inside this iteration with KD 0–6.
- **Easy to cut if needed.** If iteration 2 never ships, Iteration 1 is still a complete, useful BJJ reference site. Geo is additive, not structural.

---

## 2. The nine page types, in publish order

### Wave A — Foundation (first 100 pages; weeks 1–4)

Pages you hand-craft or very tightly edit after LLM drafting. These set the editorial standard and absorb the earliest inbound links.

1. **Homepage + pillar hubs** (`/technique`, `/position`, `/belts`, `/glossary`, `/drills`, `/athletes`, `/events`)
2. **Belt pages** — white, blue, purple, brown, black (5 pages). These rank for "bjj belts" (4.7k vol, KD 0) and are the top internal-linking hub for technique pages.
3. **Position pages** — 10 foundational positions (closed guard, half guard, mount, side control, back, knee-on-belly, turtle, open guard, butterfly, de-la-Riva).
4. **Technique pages** — the first 50 techniques, prioritized by keyword volume: triangle choke, rear naked choke, armbar, heel hook, kimura, guillotine, omoplata, americana, scissor sweep, hip bump, etc.
5. **Reviewer profile** — at minimum one named human reviewer with real lineage (see §5 below).

### Wave B — Knowledge breadth (weeks 5–16)

The bulk of the content volume. Enter LLM-assisted drafting with automated gates.

- **Technique canonicals** — remaining ~150 techniques
- **Technique variations** — ~200 position-specific variations (only where the variation is genuinely different from the canonical)
- **Remaining positions** — scale to 40–60 (including sub-positions like 50/50, saddle, lockdown)
- **Curriculum modules** — 15–25 modules across the five belts
- **Glossary** — 150–250 terms
- **Drills** — 80–150

### Wave C — Characters and events (weeks 17–28)

These pages carry rich factual data and are the most vulnerable to hallucination. Ship them after the drafting pipeline has proven itself.

- **Athletes** — 100–200 profiles, prioritized by lineage relevance and competitive history
- **Events** — 40–80 event pages (ADCC, IBJJF Worlds/Pans/Euros for the last 10 years)
- **Flows / transitions** — 50–100 hand-curated transitions (editorial quality, programmatic URL)

---

## 3. Keyword-to-page mapping

High-priority keywords with the pages that should capture them:

| Keyword | Volume | KD | Target page |
|---|---|---|---|
| triangle choke | 7,400 | 1 | `/technique/triangle-choke` + variations |
| kimura | 6,800 | 36 | `/technique/kimura` + variations (tier-1 effort, harder KD) |
| rear naked choke | 5,600 | 2 | `/technique/rear-naked-choke` |
| bjj belts | 4,700 | 0 | `/belts` (hub) + individual belt pages |
| heel hook | 3,200 | 0 | `/technique/heel-hook` + legality article |
| armbar | 3,100 | 2 | `/technique/armbar` + variations |
| leg lock | 2,500 | 0 | `/technique/leg-lock` (hub-like) |
| bjj submissions | 600 | 0 | `/technique` (hub) filtered view |
| bjj guard | 300 | 0 | `/position/closed-guard` + `/position` hub |
| bjj sweeps | 150 | 0 | `/technique` hub filtered |
| jiu jitsu techniques | 150 | 1 | `/technique` (hub) |

---

## 4. Volume targets (realistic for solo)

| Month | Pages newly published | Running live total |
|---|---|---|
| M1 | ~40 (Wave A) | 40 |
| M2 | ~80 (mostly techniques) | 120 |
| M3 | ~100 | 220 |
| M4 | ~120 | 340 |
| M5 | ~140 | 480 |
| M6 | ~160 | 640 |
| M7 | ~170 | 810 |
| M8 | ~180 | 990 |
| M9 | ~200 | 1,190 |

**Hard cap:** 100 pages promoted to `index` per calendar week, regardless of how many are drafted. This protects against Google's scaled-content triggers and gives your sampling time to surface problems.

---

## 5. E-E-A-T without a team

Google needs to believe a real human with relevant expertise stands behind the content. With no paid team:

**Option A — You are the named reviewer.** If you train BJJ yourself, even at a lower belt, put your name, photo, current belt, academy, and lineage on the site as the editor. Limitations disclosed honestly beat fake expertise.

**Option B — Recruit 1–2 real coaches for a credit-only arrangement.** Offer: promotion of their academy, free app tier for their students, links back to them. In exchange: their name, bio, lineage, and signed-off review on a subset of pages. A solo-built content site with one black belt lending authority beats any number of anonymous pages.

**Option C — Cite rather than claim.** For techniques you can't get a named reviewer for, explicitly cite sources (published books, federation documents, known instructor videos) rather than implying first-hand expertise.

**Non-negotiable:** every technique, position, belt, curriculum, flow, and drill page must have `reviewedById` populated. No anonymous content. No "BJJ Team." If a record doesn't have a real reviewer, it publishes as `noindex` until one exists.

Over time, target 2–3 named reviewers covering different areas (gi, no-gi, leglocks) — this is realistic for a solo op once you have some traffic to offer in exchange.

---

## 6. Internal linking as the moat (same rules as before)

Every page has auto-generated outbound links to related pages, per the link rules in `TEMPLATES.md`. Without a marketing/content team, the internal link graph is our main SEO asset. Ship this infrastructure early — the first 40 pages should already have automated related-content blocks populating correctly.

Bidirectional enforcement: if technique A links to technique B as a counter, technique B must list A in its "countered by" section. Enforced by a nightly consistency job.

---

## 7. What changes without humans-in-the-loop

Compared to a team-operated build, these are the specific tradeoffs:

| Area | Team build | Solo build |
|---|---|---|
| Batch size | 50–100 per type | 25–50 per type |
| Pages/day promoted | 100 | 40 |
| Sample review | 10% human review per batch | LLM-as-judge on 100% of pages + your ad-hoc sampling |
| Uniqueness floor (technique) | 60% | 70% |
| Uniqueness floor (glossary) | 70% | 80% |
| Factual checks | Reviewer | LLM factual-consistency check + cited-source requirement |
| Ship cadence | 1 week between batches | 2 weeks between batches |
| Rollback tolerance | 1 week to notice & react | 3 weeks (you're not watching daily) |

The tradeoffs compound: smaller batches + stricter uniqueness + longer spacing = slower absolute volume, but **lower risk of a site-wide penalty you can't dig out of**.

---

## 8. Exit criteria (before considering Iteration 2)

Do not start Iteration 2 (geo) until Iteration 1 has hit **all** of these:

- [ ] ≥600 pages live and indexed
- [ ] Indexation rate ≥85% of sitemap
- [ ] ≥100 keywords ranking in top 10 (per Ahrefs or equivalent)
- [ ] ≥3,000 monthly organic sessions (GSC)
- [ ] Zero manual actions in GSC
- [ ] Your own random-sample audit (§`QUALITY-GATES.md`) has been run at least monthly for 3 consecutive months with no systemic issues found

These gates exist because Iteration 2 (gym data) requires significant per-record work, and you'd rather validate the technical approach on no-data-dependency content first.

---

## 9. Risks specific to solo / no-humans operation

| Risk | Mitigation |
|---|---|
| LLM hallucination on athlete / event / technique facts | Cite-source-or-noindex rule; LLM factual-check gate; conservative uniqueness |
| You can't catch systemic template bugs early | Weekly automated audit emailing you a spot-sample; monthly self-audit cadence |
| Volume pressure leading to relaxing gates | Hard cap on pages/day; uniqueness floors encoded in CI, not config-overridable |
| Burnout / project stall | Content pipeline runs without you. Even at zero weekly input, already-published content keeps working. Volume targets are ceilings, not commitments. |
| Single-reviewer credibility (E-E-A-T) | Build toward 2–3 named reviewers over time; cite sources aggressively until then |
| LLM-generated content looking "AI-generated" to Google | Strong template + real reviewer + FAQ specificity + schema saturation. Patterns Google punishes are mad-libs, not LLM-authored-then-edited. |

---

## 10. Iteration 1 success metric

The iteration is a success if, at the end of Month 9, you can read any 20 random pages across the site and each one passes your own test: "Would a BJJ practitioner find this genuinely useful?" If yes, Iteration 2 is worth the work. If not, fix Iteration 1 before adding geo complexity.
