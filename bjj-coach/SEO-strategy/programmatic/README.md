# Programmatic SEO — Playbook

The deep "how to actually build it" companion to `../SEO-STRATEGY.md`, adapted for solo / hobby-project constraints.

## Two iterations

The programmatic build is split into two independent phases. Ship Iteration 1 first, validate it has real traction (rankings, traffic, indexation rate), then decide whether Iteration 2 is worth the extra data-sourcing work.

### [Iteration 1 — Content & Knowledge](./iteration-1-content/)
Ship first. Everything that lives in the domain of BJJ *knowledge*, not locations:
- Technique pages (submissions, sweeps, escapes, passes, takedowns) + position variations
- Position & concept hubs
- Belt & curriculum pages
- Flow / transition pages
- Drills
- Glossary
- Athletes & events
- Reviewer / author profiles

Target: ~1,000–1,500 indexable pages over 6–9 months as a solo operator.

### [Iteration 2 — Geo (Gyms & Cities)](./iteration-2-geo/)
Ship only after Iteration 1 proves traction. The geo pillar has the highest commercial value (`$1.20` CPC for "bjj gyms near me") but needs real gym data — the single biggest bottleneck for a solo operator. Starts small:
- State hubs
- City pages (25–50 seeded cities initially)
- Gym detail pages (only for verified gyms)

Target: 25–50 cities and ~500 verified gyms within the first 3 months of Iteration 2.

---

## Two operating constraints that shape everything

### 1. Solo / hobby-project scope
- No full-time team. No paid writers or coach-editors at scale.
- Weekly throughput is constrained by solo operator + automation.
- Budget for tools: modest (LLM API credits, CMS, hosting, Ahrefs/similar).
- Can tolerate longer timelines (12–18 months) — cannot tolerate SEO penalty risk, because there's no team to dig out.

### 2. No humans in the loop for generation
Content is AI-drafted and automatically gated. **You sample randomly on your own schedule**, but there is no paid human sitting in the production pipeline. This means:
- Uniqueness floors are bumped up vs. a team-operated build.
- LLM-as-judge replaces the human sample-review gate.
- Batch sizes are smaller and cadence slower — if something breaks, you'll notice it yourself rather than a reviewer catching it in the same week.
- A "spot-sample log" surfaces 1–2 random pages per batch for you to eyeball when you have 5 minutes. Acting on it is not a blocker.

Every doc in both iteration folders is written against these two constraints.

## Documents in each iteration

Each iteration folder contains the same four docs (self-contained for that iteration):

| Doc | Purpose |
|---|---|
| `README.md` | Overview and reading order for this iteration |
| `STRATEGY.md` | Page types, volume targets, rationale |
| `DATA-SCHEMAS.md` | Concrete data models for every record type |
| `TEMPLATES.md` | Page template specs with worked examples |
| `QUALITY-GATES.md` | Automated gates + your random-sampling workflow |

Iteration 2 also has:
| Doc | Purpose |
|---|---|
| `DATA-SOURCING.md` | How to get gym data without a team |

## Reading order

1. Read this README
2. `iteration-1-content/README.md` → `STRATEGY.md` → `DATA-SCHEMAS.md` → `TEMPLATES.md` → `QUALITY-GATES.md`
3. Build Iteration 1
4. Only when Iteration 1 is indexing ≥85% and pulling ≥3k monthly sessions: read Iteration 2 docs
