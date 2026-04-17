# Iteration 2 — Data Sourcing

**This is the decision-making document for Iteration 2.** Before you commit engineering time to gym directory templates, decide whether you can realistically source the data without a team. This doc lays out the options honestly.

---

## The problem

A BJJ gym directory is only useful if its data is accurate. Accurate means:
- Real gym, currently operating
- Correct address
- Correct head instructor name
- At least one working contact method
- At least basic schedule / class style info

You can't LLM-generate any of this — it's real-world fact about real businesses. Every gym record requires a one-time verification and an annual re-check. The question is: can a solo operator do this at scale?

## The honest answer

You can realistically personally verify ~100–300 gyms over 3–6 months of part-time (2–4 hrs/week) work. That's enough to seed ~10–20 cities with 10 gyms each — the first wave of Iteration 2. Beyond that, the directory has to grow via user-driven mechanisms (owner claims, user submissions) or it stalls.

So: manually seed the first wave yourself, then build the self-serve flows to grow it.

---

## Sourcing options — ranked by suitability for solo operator

### Option 1 — Federation & academy directories (RECOMMENDED seed source)

Many BJJ federations and academy networks publish official lists of affiliated gyms. These are pre-verified (the federation checks before listing) and public.

Examples worth mining:
- **IBJJF affiliate list** (ibjjf.com)
- **Gracie Academy official list** (gracieuniversity.com)
- **Gracie Barra locator** (graciebarra.com)
- **Alliance BJJ academies** (alliancejiujitsu.com)
- **Checkmat academies** (checkmathq.com)
- **Renzo Gracie affiliates**
- **Atos Jiu Jitsu academies**
- **10th Planet Jiu Jitsu locator** (10thplanetjj.com)

These directories typically list: name, address, head instructor, website. That's enough to pre-populate the fields and verify the rest manually.

**What you do with them:** Manually copy academy entries into your seed list. You're not scraping at scale — you're building a starting list from public federation directories. Include the federation source as the first `citationSource` on the gym record ("Listed as affiliate on IBJJF.com as of 2026-04-13").

Legal posture: these are public membership lists. Listing the same gyms with attribution is standard directory behavior. If any federation objects, remove at their request — but this is low-probability.

Expected yield: 200–400 pre-verified academy entries across your first 10 cities.

### Option 2 — Google Maps (CAREFUL — ToS considerations)

Google Maps is the single most comprehensive BJJ gym data source. Automated scraping violates ToS. Manual lookup is fine.

**What you do:** For each city in your seed set, manually open Google Maps, search "BJJ near [city]," and eyeball the top 20 results. Use the listings to verify addresses, see hours, read reviews (sanity check), and find the head instructor names in the reviews/photos/website links. This is the same workflow a prospective student would do.

Do NOT:
- Run Google Places API to mass-ingest listings (ToS + attribution requirements)
- Scrape the web UI with automated tools

Do:
- Manually check and verify individual listings
- Use the place URL as a citation source for each gym record ("Verified via Google Maps, 2026-04-13")

Expected yield: adds verification signal to existing federation list + surfaces non-affiliated gyms.

### Option 3 — The gym's own website (required for verification)

Every gym must have its own website / Instagram / Facebook with enough info to cross-reference. This is the final verification step.

**What you do:** For each candidate gym, visit the website/social. Confirm:
- Name matches
- Address matches
- Head instructor name matches
- Website is active (not a parked domain)
- Classes still offered

If any of these fail, the gym goes to the backlog, not the live directory.

### Option 4 — User submissions + owner claims (primary growth mechanism)

Once the seed is live, the directory grows via two user flows:

**Submit a gym:** anyone can submit a gym not yet listed. Form captures: name, address, instructor, website, relationship to gym (student / owner / visitor). Submissions go to a moderation queue. You approve or reject, targeting 80%+ approval rate with minimal editing.

**Claim this listing:** gym owners can claim their existing listing. Email verification using a domain matching their website domain. Claimed listings get:
- An "Owner-verified" badge (trust signal)
- Ability to edit the listing (schedule, photos, description)
- Optional upgrade to paid featured placement

Launch both flows in **Month 1 of Iteration 2**. They don't work without traffic, but the earlier they exist, the faster the flywheel turns.

### Option 5 — Paid data providers (Month 6+ only)

Services like Yext, Foursquare Places API, or SafeGraph sell verified local-business data with proper licensing. Cost is $0.01–0.10 per record at small volumes; $200–2,000/month at larger volumes.

**Solo-operator guidance:** don't buy data until the directory has traffic + revenue validating that the data expense is worth it. Start with Option 1 (federations) + Option 3 (manual verification) + Option 4 (user-driven). Layer in paid data only if it unblocks expansion.

### Option 6 — Partnerships (opportunistic)

Long-shot but possible: reach out to BJJ Heroes, Smoothcomp, or FloGrappling about data partnership (their data, your directory UX). Most likely "no" but occasionally these pan out.

---

## What you're NOT doing

Explicitly ruled out:

- **Scraping Google Maps, Yelp, Facebook with headless browsers.** ToS + risk.
- **Ingesting large third-party databases of questionable provenance.** Reputational + legal risk.
- **Generating plausible-looking gym data via LLM.** This is fabrication. Zero tolerance.
- **Copying BJJ Heroes' gym database wholesale.** Their data; ask first if you want it.

---

## The seed-list workflow (concrete, hours-estimable)

For each of the first 10 cities, the workflow is:

1. **Federation pass (30–60 min/city):** open IBJJF, Gracie, Alliance, Checkmat, Gracie Barra, 10th Planet affiliate lists. Filter by city. Compile a list of 10–25 candidate gyms.
2. **Dedupe + enrich (30 min/city):** merge candidates; add any obviously-missing ones from Google Maps.
3. **Verify each candidate (15–20 min/gym):**
   - Visit gym's website (must exist)
   - Visit Google Maps listing (must exist)
   - Cross-reference head instructor name
   - Confirm address
   - Note class styles (gi, no-gi, kids, women's)
   - Note trial offer if advertised
4. **Enter into CMS (10 min/gym):** fill record, add citation sources, flag for publish
5. **Publish after city has ≥3 verified gyms.**

Total time per city: ~3–5 hours depending on density. 10 cities = ~40 hours. Spread over 4–6 weeks = 6–10 hours/week for the seeding phase.

This is meaningful effort but bounded. Once the seed is done, the workload drops to:
- Claim/submission moderation (30–60 min/week)
- Annual re-verification per gym (5 min/gym × 300 gyms ÷ 52 weeks ≈ 30 min/week spread)

So long-term maintenance is ~1–2 hours/week — sustainable.

---

## The "should I do this" decision tree

```
Are you already training BJJ and familiar with the gym scene in
your target cities?
├── Yes → Iteration 2 is viable. The personal knowledge massively
│         reduces verification effort.
│
└── No → Can you commit 6–10 hrs/week for 4–6 weeks to seed 10 cities?
         ├── Yes → Still viable, just more research-heavy per gym.
         │         Focus on 5 cities instead of 10 for the first wave.
         │
         └── No → Skip Iteration 2. Stick with Iteration 1. The content
                  pillar alone is a real, respectable project. Come back
                  to geo when your life has more bandwidth — the data
                  will still be there.
```

---

## Ongoing data freshness plan

Once you're past the seed phase:

- **Annual re-verification:** automated script pings each gym's website monthly. If it fails 3 consecutive months, the listing is auto-flagged for manual review. You either re-verify (10 min) or mark closed (1 min).
- **User report flow:** "report incorrect information" button on every gym page. Reports go to your moderation queue. You action within 72 hours.
- **Google Maps sanity check:** quarterly, sample 20 random listings and confirm they still appear in Google Maps search for their city. Catches closed businesses that didn't update their website.

Expected maintenance steady state: 1–2 hours/week for a 300-gym directory; scales sub-linearly if owner claims take over editing.

---

## The data licensing / attribution rule

Every source you pull gym data from gets attribution on the gym record's `citationSources`. Keep the sources visible — it's the honest move, it reduces takedown risk, and it's a trust signal for users and search engines alike.

Do NOT attempt to obscure sources. If you're pulling from IBJJF's affiliate list, say so. If you're pulling from a partnership with BJJ Heroes (hypothetical), say so. Hidden data lineage is a risk pattern; visible data lineage is a credibility signal.
