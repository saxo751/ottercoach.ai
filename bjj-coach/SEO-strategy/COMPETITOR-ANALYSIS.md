# BJJ SEO Competitive Analysis

**Prepared:** 2026-04-13
**Methodology:** Ahrefs organic competitor data anchored on bjjfanatics.com (the most visible instructional BJJ brand), supplemented with manual SERP review for programmatic patterns.

---

## Competitor Map

| Domain | DR | Monthly Traffic | Pages | Positioning | Programmatic SEO? |
|---|---|---|---|---|---|
| youtube.com | 99 | 528M | 47.7M | Video-dominant, can't be out-SEO'd on video queries | N/A |
| ufc.com | 81 | 2.6M | 11.6k | MMA/UFC brand — adjacent not direct | No |
| tapology.com | 73 | 938k | 28k | Fight database (MMA-focused, some BJJ) | Yes — fighter/event pages |
| sherdog.com | 74 | 521k | 16k | Fight database | Yes — fighter profiles |
| **bjjheroes.com** | **72** | **25k** | **868** | **BJJ athlete profiles — direct programmatic competitor** | **Yes — athlete pages** |
| goldbjj.com | 54 | 29k | 277 | Gi retailer + blog content | Partial — blog posts |
| nagafighter.com | 52 | 21k | 235 | Tournament series | Event pages |
| flograppling.com | 62 | 14k | 1.2k | Subscription BJJ media | Event/athlete pages (partial) |
| gracieuniversity.com | 65 | 13k | 187 | Gracie Jiu-Jitsu curriculum | No |
| ibjjf.com | 75 | 12k | 185 | Federation — rules, events | Event pages only |
| elitesports.com | 74 | 12k | 745 | Gear retailer + blog | Product-led |
| evolve-mma.com | 63 | 12k | 953 | Singapore gym + blog | Blog-heavy |
| hayabusafight.com | 54 | 67k | 540 | Gear brand + SEO blog | Blog-heavy |

**Key read:** The strongest *open-web* direct BJJ-content competitors (bjjheroes, goldbjj, gracieuniversity, evolve-mma) have DRs in the 54–72 range with only a few hundred pages. None of them have built a real programmatic SEO machine. The space is wide open.

---

## Detailed Competitor Teardowns

### BJJ Heroes — bjjheroes.com (most direct programmatic competitor)
- **What they do well:** Athlete profile database — the de facto online BJJ Wikipedia for competitors. High topical authority around athlete names and lineage.
- **Weaknesses:**
  - Visual design dated (early-2010s WordPress)
  - Minimal schema markup
  - Athlete pages not interlinked to techniques or positions
  - Slow mobile performance
  - Thin internal linking; largely orphaned pages
  - No video integration
- **How we beat them:** Build athlete profiles as one node in a dense knowledge graph (athlete ↔ technique ↔ position ↔ event). Modern design, full schema, video highlights, fresher data.

### BJJ Fanatics — bjjfanatics.com
- **What they do well:** Massive brand presence. Blog posts rank for some technique terms. Product pages rank for instructor names.
- **Weaknesses:** Content is promotional for paywalled instructionals. Technique depth is shallow on the open web. The valuable content is behind purchases.
- **How we beat them:** Open, structured, free content for the specific "how do I do X" query. They can't open their content without damaging their business model.

### Grapplearts — grapplearts.com
- **What they do well:** Long-form technique blog posts with decent rankings on mid-volume terms. Strong domain age.
- **Weaknesses:** Unstructured blog format, not programmatic, limited coverage breadth.
- **How we beat them:** Breadth + structure. 10× the pages, all schema-marked.

### Evolve MMA — evolve-mma.com
- **What they do well:** High-volume blog, ranks for many "best of" and listicle terms.
- **Weaknesses:** Blog-only. No database architecture.
- **How we beat them:** Same argument — blog-vs-database is a structural mismatch.

### Gracie University — gracieuniversity.com
- **What they do well:** Strong brand authority via the Gracie name.
- **Weaknesses:** Only 187 pages. Content is promotional for their paid program.
- **How we beat them:** Open breadth.

### NAGA / IBJJF / FloGrappling — event publishers
- **Positioning:** They own event-centric queries (results, brackets, live streams).
- **Our play:** Don't try to beat IBJJF for "IBJJF Worlds 2026 brackets." Do beat them for "who won ADCC 2025 77kg" and athlete-cross-event content.

---

## Keyword Gap Analysis (high opportunity)

The low-difficulty, high-volume keywords below have no strong programmatic player. These are the first pages we should ship.

### Technique head terms — low competition, high volume

| Keyword | Volume | KD | Notes |
|---|---|---|---|
| triangle choke | 7,400 | 1 | Hub + variations |
| kimura | 6,800 | 36 | Higher KD but high volume — tier-1 effort |
| rear naked choke | 5,600 | 2 | Hub + variations |
| heel hook | 3,200 | 0 | Hub + legality/rules content |
| armbar | 3,100 | 2 | Hub + variations |
| leg lock | 2,500 | 0 | Hub + legality/meta content |

### Structural terms — zero-competition pillars

| Keyword | Volume | KD | Page type |
|---|---|---|---|
| bjj belts | 4,700 | 0 | Belt pillar |
| bjj submissions | 600 | 0 | Submission hub |
| bjj guard | 300 | 0 | Position hub |
| bjj sweeps | 150 | 0 | Technique hub |

### Commercial terms — monetization adjacency

| Keyword | Volume | KD | CPC | Page type |
|---|---|---|---|---|
| bjj gi | 6,300 | 6 | $0.80 | Review / comparison pages |
| bjj gyms near me | 1,200 | 30 | $1.20 | Gym directory |
| kimura | 6,800 | 36 | $0.15 | (Already above) |

### Gym directory opportunity
"bjj near me" / "bjj gyms near me" is 1.2k/mo head term. The long-tail (bjj + city) aggregates to likely 10k+ monthly volume across the top 500 US cities. Current SERPs are dominated by Yelp, Google Maps, and individual gym sites — **no directory has built a schema-marked, mobile-friendly, aggregated BJJ-specific directory**. Strong programmatic play.

---

## E-E-A-T Competitive Picture

| Signal | BJJ Heroes | BJJ Fanatics | Grapplearts | Gracie University | **Us (target)** |
|---|---|---|---|---|---|
| Named author / coach | Weak | Strong (instructors) | Strong | Strong | **Strong** |
| Coach lineage on page | No | Partial | Partial | Partial | **Yes — on every page** |
| Video evidence | No | Yes (paywalled) | Partial | Partial | **Yes (embed + own)** |
| Federation citations | Rare | Rare | Rare | Rare | **Yes (IBJJF, CBJJ)** |
| "Last reviewed" dates | No | No | No | No | **Yes** |
| Person schema | No | No | No | No | **Yes** |

The entire niche has weak structured E-E-A-T. Operationalizing this well is a real moat.

---

## Competitive Response Forecast

- **BJJ Fanatics:** Unlikely to respond. Their business is paywalled instructionals; opening content cannibalizes sales. They may improve blog cadence but cannot match structured breadth.
- **BJJ Heroes:** Low velocity historically. May add athletes but unlikely to rebuild architecture.
- **YouTube creators (individuals):** Cannot compete on structured text ranking. We may end up being their linked reference.
- **New entrants (other apps):** Possible within 12–18 months. Our speed-to-volume and authority-building in Year 1 is the defensibility.

---

## Opportunities We Should NOT Pursue (at least initially)

- **Competing with UFC/Sherdog/Tapology on MMA fighters** — wrong audience, different query intent.
- **Competing with IBJJF on live event results** — they have the primary data source; we'd be derivative.
- **News/reactions to BJJ events** — requires dedicated editorial team; higher cost-per-page than database content.
- **Deep product reviews of instructional videos** — BJJ Fanatics owns this intent; we'd be fighting uphill for little reward.
