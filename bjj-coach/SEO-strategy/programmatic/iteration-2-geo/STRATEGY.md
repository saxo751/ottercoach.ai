# Iteration 2 Strategy — Gyms & Cities

**Scope:** states, cities, gyms. Nothing else.
**Operator model:** solo; no humans in the content pipeline; you personally verify gym data for a small seed set.
**Prepared:** 2026-04-13

---

## 1. Why geo is the big commercial prize (and the big operational risk)

Commercial side:
- `"bjj gyms near me"` has CPC $1.20 and 1,200 monthly volume
- The long tail across US cities aggregates to an estimated 10,000+ monthly searches
- No dedicated BJJ directory has built a schema-marked, well-organized open-web gym aggregator — the SERPs are dominated by Yelp, Google Maps, and individual gym sites
- Monetization path: featured listings ($29–99/mo), gym-owner upgrades, possibly lead generation

Operational side:
- Gym data is a living data problem. Names change, instructors move, gyms close, schedules shift.
- You need to verify the data yourself or risk publishing incorrect information about real businesses.
- Google treats local-business data with particular sensitivity. Inaccurate listings draw direct user complaints *and* algorithmic downgrades.
- You cannot scale gym coverage by "generating" content — the uniqueness comes from real facts about real businesses.

**The strategic decision this iteration forces:** are you willing to spend ~2–4 hours per week verifying and maintaining gym data in exchange for access to the highest-commercial-intent queries in the BJJ niche? If not, skip Iteration 2 entirely. The content pillar alone is a viable project.

---

## 2. Three-level hierarchy

```
/gyms                           ← USA hub (1 page)
/gyms/{state}                   ← state hubs (50)
/gyms/{state}/{city}            ← city pages (only if ≥3 verified gyms)
/gyms/{state}/{city}/{gym-slug} ← gym detail pages
```

- **USA hub:** hand-written, ~600 words, links to state hubs, general "how to choose a BJJ gym" content. Captures "bjj near me" head term.
- **State hub:** one per US state. Lists cities (cards). Short state-level BJJ context. Generated from State + City records.
- **City page:** the main ranking unit. Only renders for cities with ≥3 verified gyms (enforced gate). Includes map, gym cards, city-level BJJ history, FAQ.
- **Gym detail:** one per verified gym. Address, instructor, schedule, styles, trial info, reviews, map.

---

## 3. Volume targets (realistic for solo)

### End-of-Iteration-2 targets (month 12 of overall project, assuming Iteration 1 shipped by month 9)

| Page type | Volume |
|---|---|
| USA hub | 1 |
| State hubs | 50 |
| City pages | 25–50 |
| Gym detail pages | 300–500 |

Deliberately small. The 50-US-state hubs are cheap to render from the state record + city list. The 25–50 city pages are the real work because they gate on verified gym data. The 300–500 gym records are the bottleneck.

### Why not more cities?

Because 10 well-verified cities will out-rank 200 scraped-and-unverified cities every time. Google penalizes low-quality local-business listings. The weeds between ambition and quality here is narrow.

Start with 10 cities (see §4), expand to 25 as you get owner claims, push for 50 only when the flow from user submissions is stable.

---

## 4. The first 10 cities (seed set)

Picked for BJJ density + commercial value + verifiability. You personally seed these with 5–15 gyms each.

1. **Los Angeles, CA** — highest BJJ density in the US
2. **New York, NY** — dense, high-intent market
3. **San Francisco Bay Area, CA** — treat as one metro
4. **Miami, FL** — Brazilian-diaspora BJJ strength
5. **Chicago, IL**
6. **Dallas, TX** — large gym scene
7. **Houston, TX**
8. **Seattle, WA**
9. **Denver, CO**
10. **Atlanta, GA**

Total effort to seed: ~40–100 hours of your time upfront, ~3–8 gyms per city manually verified (name, address, instructor, classes, website). Realistic to do over 4–6 weeks of part-time work.

Once these 10 are live and ranking, the flywheel kicks in: gym owners claim listings, users submit corrections, and the directory starts growing itself.

---

## 5. Verification is non-negotiable

The single quality gate that cannot be automated: **does this gym actually exist, and is the data accurate?**

For your seed set, verification is:
1. Gym has a website, active social media, AND Google Maps listing
2. Head instructor's name matches across at least two of those sources
3. Address confirmed via Google Maps
4. At least one contact method (phone, email, or contact form) works

Only gyms passing all four go into the database. Unverified candidates go to a "backlog" table and stay there until someone can verify.

After the seed set is live, verification can partially outsource to:
- Gym owners claiming their listing (self-verification with confirmation email)
- Users submitting corrections (moderation queue, you approve)
- Annual automated re-check (website still resolving? Google Maps listing still present?)

---

## 6. Data sourcing strategy

**See `DATA-SOURCING.md` for full detail.** The short version:

- **Don't scrape Google Maps.** Against ToS and legally risky.
- **Do use federation directories** (IBJJF, Gracie, Alliance, etc.) as a starting list of real academies — these are public and already verify membership.
- **Do manually seed 10 cities** — unavoidable.
- **Do build a "claim this listing" and "submit a gym" flow** so the directory can grow beyond your personal verification capacity.
- **Consider paid data sources** (Yext, SafeGraph) if the project generates revenue.

---

## 7. Solo-operator adjustments specific to geo

Compared to the original (team-assumed) plan, these are the changes:

| Area | Team build | Solo build |
|---|---|---|
| Initial city count | 50 cities | 10 cities |
| Gyms per city | auto-scraped | hand-seeded 5–15 |
| Verification | data-ops role | you, 4–6 hours/week |
| Publishing cadence | 25 cities/month | 1–3 cities/month |
| Re-verification | quarterly | annually |
| Claim-listing flow | Phase 4 | Month 1 of Iteration 2 — essential, not optional |
| Paid listings | Phase 4 | Month 6 of Iteration 2 |

---

## 8. Monetization timing

Paid listings are the whole commercial rationale for Iteration 2. Targets:

- **Month 3:** ship the "featured listing" / "claim this listing" UI
- **Month 4–5:** outreach to 50 gym owners across the seed cities with a free-trial offer on premium listings
- **Month 6+:** start charging ($29/mo basic, $99/mo premium tier)

Revenue isn't the goal for a hobby project, but even modest revenue ($500–2,000/mo) covers tooling costs and provides validation that the directory is useful enough for businesses to pay for placement.

---

## 9. Risks specific to Iteration 2

| Risk | Mitigation |
|---|---|
| Inaccurate gym data → user complaints, Google quality signal | Hard verification gate; 12-month re-verification; claim-listing flow |
| Gym closes, data goes stale | Annual automated ping (does website resolve? GMaps listing exist?); user reporting flow |
| Cease-and-desist from a gym owner | Immediate takedown policy + contact form. Respect all requests; this pillar is high-touch. |
| "Scraping" allegation | Never scrape Google Maps. Federation directories are fine; manual seed is fine. Document sources. |
| Thin-content signal from sparse cities | Enforced ≥3-verified-gyms gate for city pages |
| Fraudulent claim-listing submissions | Email verification + SMS verification for claims; moderation queue |
| Regulatory / ADA issues on directory | Keep it simple; don't accept paid placement without disclosure |

---

## 10. Exit criteria for Iteration 2

At end of Iteration 2 (~Month 6 of Iteration 2, ~Month 15 of overall project):

- [ ] 25+ city pages live, all meeting the ≥3-verified-gym gate
- [ ] 300+ verified gym detail pages
- [ ] All 50 state hubs rendered (even thin ones)
- [ ] Claim-listing and submit-gym flows live and receiving submissions
- [ ] At least 5 gym owners have claimed their listing
- [ ] ≥1,000 monthly organic sessions on the geo pillar alone
- [ ] Directory generating ≥$200/mo via paid listings OR a clear path to that within 60 days

If those criteria aren't met, Iteration 2 is officially "on hold" — the content pillar keeps running, the existing geo pages stay live, but you stop adding new cities until something changes (traffic, revenue, or a decision to add resources).

---

## 11. The honest alternative: don't do Iteration 2

Completely legitimate for a hobby project: ship Iteration 1, accept that you're leaving the geo commercial opportunity on the table, and keep the site a pure BJJ knowledge resource.

**Signals you should skip Iteration 2:**
- Iteration 1 is already consuming all your time
- You don't enjoy or have capacity for the verification work
- The project is monetized via app installs (not listings), and content-pillar traffic is converting well enough
- You don't have the seed cities' gym scene in personal knowledge/network (makes verification harder)

The content pillar alone — well executed — is a real SEO asset in a real niche. Iteration 2 is a multiplier, not a requirement.
