# Iteration 2 — Quality Gates (Geo, Solo Operator)

**Purpose:** same three-layer automated gate model as Iteration 1, adapted for gym/city/state pages. Emphasis on data verification and re-verification rather than uniqueness alone.

> **Critical constraint carry-over:** no humans in the content pipeline. You personally verify gyms during the seed phase (see `DATA-SOURCING.md`), but all page rendering, gating, and publishing is automated.

---

## 1. Layer 1 — Build-time hard gates (Geo)

### 1.1 Required fields (strict for this iteration)

Per `DATA-SCHEMAS.md`. Specifically for geo:

**City** publishes only if:
- `bjjContext ≥200 words`
- `faq.length ≥3`
- `verifiedGymCount ≥3`
- `citationSources.length ≥1`

**Gym** publishes only if:
- `address` fully populated with validated postal code
- `headInstructorName` present
- `classStyles.length ≥1`
- `description ≥120 words`
- `verifiedAt` within the last 18 months
- `verificationSource` ∈ `{federation-list, manual, gym-claimed}` (not `user-submitted` without further verification)
- `citationSources.length ≥2`
- `status === 'active'`

**State** publishes even with thin data, but requires `description ≥150 words`.

### 1.2 Address & geo validation

- `address.postalCode` matches the country's postal format (regex per country)
- `location.latitude ∈ [-90, 90]`, `location.longitude ∈ [-180, 180]`
- Geocoding consistency: `location` must resolve to the same city as `address.addressLocality`. Check against a geocoding API (one-time, at record creation). If mismatch, block publish and flag.

### 1.3 URL & slug sanity

- Gym slug: `^[a-z0-9]+(-[a-z0-9]+)*$`
- Max 4 URL segments (`/gyms/{state}/{city}/{gym-slug}`)
- No duplicate slugs within city

### 1.4 Shingle uniqueness (same as Iteration 1)

- City: ≥55%
- Gym: ≥45%
- State: ≥55%

### 1.5 Embedding near-duplicate check

Same as Iteration 1 §2.4. Cosine ≥0.92 against a same-type neighbor → `noindex`. Especially important for gym descriptions — LLM drafting tends to converge on similar phrasing for gyms in the same federation.

### 1.6 Schema validation

`LocalBusiness` with complete `address` and `geo` on every gym page. `ItemList` on city pages. `BreadcrumbList` everywhere. Invalid schema blocks publish.

### 1.7 Internal linking count

- Gym page: ≥4 internal outbound (city, state, ≥2 nearby gyms / instructor / same-federation cards)
- City page: ≥8 internal outbound (≥3 gyms + state + nearby cities + notable athletes)
- State page: ≥5 internal outbound (≥3 cities + USA hub + notable athletes)

### 1.8 Asset integrity

- Every map has explicit width/height
- Hero images have alt text describing actual image (not generic "gym photo")
- Fallback stock images clearly labeled in alt: "Stock photo of a BJJ academy — [gym name] — no user-submitted image available"

### 1.9 Verification freshness

Nightly job: any gym with `verifiedAt > 18 months ago` auto-flagged `noindex, follow` + added to the re-verification queue.

---

## 2. Layer 2 — Publish-time intelligent gates

### 2.1 LLM-as-judge for Gym pages

Different prompt from Iteration 1 — tuned for geo:

```
You are evaluating a BJJ gym directory listing. Score 1 (poor) to 5 (excellent).

1. Data plausibility: do the address, instructor, federation affiliation,
   and schedule look internally consistent?
2. Specificity: does the description reference distinctive traits of
   THIS gym, or could it describe any gym?
3. Trust signals: is the verification date visible? Are citations present
   and linkable?
4. User utility: would a prospective student find enough here to decide
   whether to visit?
5. Claim/report flows: are they present on the page?

Return: { "scores": {1-5}×5, "flags": [string], "overall": 1-5 }
```

- `overall ≥4` AND `data plausibility ≥4` → pass, promote to `index`
- `overall 3` OR any score `≤2` → `noindex`, log for review
- `overall ≤2` → `noindex`, flag for data enrichment

### 2.2 LLM-as-judge for City pages

Same shape, different rubric:
1. City-context specificity (would this paragraph only make sense for THIS city?)
2. FAQ specificity (each answer uses city-specific facts)
3. Gym card density (≥3 verified gyms visible)
4. Notable athletes / adjacency signals (is the cross-linking rich?)
5. Trust signals (verification dates, sources, report-incorrect-info link)

### 2.3 Duplicate description detection

For gym descriptions: compare to every other gym description in the same city. If cosine ≥0.85 against any same-city gym, flag (two gyms in the same city shouldn't have near-identical descriptions even if same federation).

### 2.4 Federation affiliation sanity

If `affiliatedFederations` includes a specific network, cross-check against that network's public affiliate list (during the nightly job). Warnings if a gym claims an affiliation the federation doesn't list. Not a hard block — federations update their lists slowly — but flagged.

---

## 3. Layer 3 — Your random sampling (non-blocking)

### 3.1 Geo sampling log

Each batch promoted produces a log entry:

```
Batch 2026-10-15-gym-detail-3
  27 gym pages promoted
  Ship report: 2026-10-15 21:30 UTC
  Pass rate: Layer 1 = 26/27, Layer 2 = 24/26 → 24 pages live

  >>> RANDOM SAMPLE FOR REVIEW <<<
  - /gyms/ca/los-angeles/10th-planet-hq   [link]
  - /gyms/tx/dallas/gracie-barra-dallas   [link]

  (Check these two when you have a spare 5 minutes. Verify address
   looks right, instructor name is correct, description doesn't
   sound like it was written for a different gym. Reply 'rollback
   {slug}' in the log if anything seems off.)
```

### 3.2 Geo-specific review checklist

When you sample a gym page, check:
- [ ] Address makes sense for the city (not in a different country via a typo)
- [ ] Instructor name matches what their website/IG says
- [ ] Description doesn't sound copy-paste from another gym
- [ ] Class schedule (if present) looks plausible
- [ ] No fake-looking data (made-up phone numbers, broken websites)
- [ ] Source links resolve

When you sample a city page, check:
- [ ] `bjjContext` paragraph is genuinely about this city
- [ ] FAQ answers aren't generic
- [ ] Gym cards look right (≥3, all verified)
- [ ] Nearby cities are actually nearby

### 3.3 Rollback cadence

Same as Iteration 1: reply `rollback {slug}` in the log → CI runs move affected pages to `noindex` on next build + trigger batch audit at stricter thresholds.

---

## 4. Batch plan (Geo, solo operator)

### 4.1 Batch sizes (deliberately small — data verification is the bottleneck)

| Page type | Batch size | Spacing |
|---|---|---|
| State hub | all 50 in one batch once State records exist | — |
| City (first 10) | 1–2 cities/batch | 2–3 weeks (matches your seeding cadence) |
| City (expansion, 11–50) | 2–3 cities/batch | 2 weeks |
| Gym detail | 15–20/batch | 1–2 weeks |

**Hard daily cap:** 30 pages promoted to `index` per calendar day (lower than Iteration 1's 40 — geo accuracy is more important than speed).

### 4.2 Batch promotion gate (sequential)

A city page cannot promote until at least 3 of its verified gyms are already live (or go live in the same batch). Enforce at CI.

### 4.3 Monitoring window

After a batch:
- **Wait ≥7 days** before next batch of the same type
- Watch: GSC indexation, local-pack rankings for `bjj {city}` query, user error reports

**Stop publishing (same type)** if:
- Indexation of previous batch <60% after 3 weeks
- Any GSC local-listing warning
- Verified error rate from user reports >5% of live gyms in a month (investigate verification process)

---

## 5. Rollout schedule — first 6 months of Iteration 2

Assumes Iteration 2 starts around Month 9 of the overall project (after Iteration 1 exit criteria).

### Month 1 (of Iteration 2)
- Build templates, gates, claim/submission flows
- Build State and City CMS collections
- Seed: manually verify 3 cities' gyms (LA, NYC, Miami) — ~15 gyms × 3 = 45 gyms
- **End of month: USA hub + 50 state hubs (thin) + 3 city pages + 45 gym pages live ≈ 100 pages**

### Month 2
- Seed 2 more cities (SF Bay, Chicago) + continue expanding verified gyms in initial 3
- Launch claim-listing flow
- **End of month: 5 city pages + 90 gym pages live ≈ 145 pages in pillar**

### Month 3
- Seed 2 more cities (Dallas, Houston) + process first claim submissions
- Launch submit-gym flow
- **End of month: 7 city pages + 140 gym pages ≈ 197 pages**

### Month 4
- Seed 2 more cities (Seattle, Denver)
- Begin paid-listing outreach to claimed gyms
- **End of month: 9 city pages + 180 gym pages ≈ 239 pages**

### Month 5
- Seed 1 more city (Atlanta) completes top-10 seed
- Start accepting high-quality user submissions
- Monthly re-verification job runs for first time
- **End of month: 10 city pages + 220 gym pages ≈ 280 pages**

### Month 6
- Expand based on demand: prioritize cities where users are submitting gym data
- First paid-listing revenue
- **End of month: 12–15 city pages + 280–350 gym pages ≈ 350 pages**

After Month 6: the pillar is either self-sustaining (claim/submission flow is working) or stalling. Evaluate before Month 7 whether to invest more or hold steady.

---

## 6. Ongoing freshness (critical for geo)

### 6.1 Automated freshness checks (nightly)

For every gym with a `website`:
- HEAD request to the website
- If website returns 5xx or is unreachable for 3 consecutive nights: flag the gym page for review
- If website has been unreachable for 30 consecutive days: auto-`noindex` the gym and mark `status: pending-verification`
- You manually re-verify or close-status

### 6.2 Monthly user-report triage

- Every Monday: check the user-report queue (30 min)
- Action rate target: respond within 7 days
- High-confidence reports (user submits photo of closed storefront, gym's site is down): trust and close
- Low-confidence reports: cross-check against Google Maps before acting

### 6.3 Annual re-verification

- Every gym re-verified within 18 months or `noindex`
- Automated reminder when `verifiedAt` crosses 12 months
- If a gym is `claimedByOwner`, email the owner requesting confirmation (less manual work)

### 6.4 Monthly self-audit

- 30 min/month: random-click 10 gym pages across the directory
- Check data plausibility against gym's current website/Instagram
- Batch-fix findings

---

## 7. Incident playbook (geo-specific)

### 7.1 A gym owner requests takedown

- Honor it, no questions asked
- Remove the listing within 72 hours of the request
- Add the gym to a "do not re-list" set keyed on address + name
- Record the takedown reason for pattern detection

### 7.2 A listing is flagged as factually wrong

- Immediate `noindex` on that gym (minutes, automated)
- Human review within 7 days
- Re-publish only after verification correction
- If the error was systematic (e.g., all Gracie Barra gyms had wrong federation label), audit same-federation or same-source gyms

### 7.3 Google Maps / local pack penalty

- Rare for a directory but possible. Signals: sudden drop in "bjj {city}" rankings; GSC surfaces a local-listing-specific warning.
- Response: freeze new gym publishing. Audit data quality across the set. Most likely cause: inaccurate listings. Fix, re-request indexing.

### 7.4 Paid-listing fraud

- Someone pays for a featured listing on a fake or disputed gym
- Policy: refund + un-feature. Do not ship paid-listing features that override the verification gates.

---

## 8. Geo-specific tooling

In addition to the Iteration 1 toolchain:

| Purpose | Tool/service |
|---|---|
| Geocoding (address → lat/lng) | Google Geocoding API or OpenStreetMap Nominatim (free, rate-limited) |
| Static maps | OpenStreetMap or Stamen tiles (ToS-compliant) or Mapbox ($0.50/1k on the free tier) |
| Postal code validation | `libpostal` or country-specific regexes |
| Owner-email verification | Transactional email service (already in Iteration 1 stack) |
| Website uptime check | Cron + HEAD request; cheap |

Adds approximately $20–50/month to the tooling bill.

---

## 9. Success signals for Iteration 2

| Signal | Month 3 | Month 6 |
|---|---|---|
| City pages indexed ≥85% | ✓ | ✓ |
| Gym pages indexed ≥85% | ✓ | ✓ |
| Claim flow submissions/month | ≥5 | ≥15 |
| Submit-a-gym submissions/month | ≥10 | ≥30 |
| User error reports/month | <5% of live gyms | <3% |
| `bjj {seed-city}` rankings in top 10 | ≥3 cities | ≥7 cities |
| Organic sessions on geo pillar | ≥200/mo | ≥1,000/mo |
| Paid-listing revenue | $0 | ≥$200/mo |

---

## 10. The one-paragraph summary

> "Iteration 2 ships a BJJ gym directory for 10–25 seed cities and 300–500 manually verified gyms, grown thereafter via owner claims and user submissions. Automated gates block any gym from publishing without verified address, instructor name, description, and ≥2 citation sources; any gym unverified for >18 months auto-unpublishes. No humans review pages in the pipeline, but I personally verify the seed-gym data during the seed phase (2–4 hrs/week for 4–6 weeks) and spot-check promoted gym pages weekly. Paid featured listings are introduced around Month 6 once the directory has traction. The pillar is fully decoupled from Iteration 1, so it can be paused or skipped entirely without breaking the content site."
