# Iteration 2 — Page Templates (Geo)

**Scope:** state, city, gym detail, plus the US hub. Worked examples for each.

> **Solo-operator note:** uniqueness floors are bumped vs. the team-operated spec. Geo pages have intrinsic unique data (addresses, instructor names, schedules) — the floor primarily guards against template-driven boilerplate.

---

## 1. USA hub

- **URL:** `/gyms`
- **Schema:** `Article`, `BreadcrumbList`, `ItemList` (of states)
- **Hand-crafted, not programmatic.**
- **Word count:** ≥600

### Structure
1. Breadcrumbs: Home › Gyms
2. H1: `"BJJ Gyms in the USA"`
3. Quick answer (≤40 words — AI citation)
4. How to choose a BJJ gym (unique, ≥300 words — ranks for "how to find a BJJ gym")
5. Map of US with state highlighting
6. State hub cards (templated ItemList)
7. FAQ (≥4 Q&A — "How much does BJJ cost?", "What should I expect at my first class?", etc.)
8. Sources

Written once, refreshed annually.

---

## 2. State hub

- **URL:** `/gyms/{state}`
- **Schema:** `Article`, `BreadcrumbList`, `ItemList`
- **Uniqueness floor:** 55%
- **Word count floor:** 300

### Structure
1. Breadcrumbs: Home › Gyms › {State}
2. H1: `"BJJ Gyms in {State Name}"`
3. Quick answer
4. State-level BJJ context (unique, ≥150 words — `State.description`)
5. City cards (templated — every City with stateId == this, including ones below the gym threshold with a "coming soon" flag)
6. Notable athletes from {State} (templated — pulled from Iteration 1 via `Athlete.nationality` + city inference)
7. Federations active in {State} (templated)
8. FAQ (≥2 Q&A)
9. Sources

Can publish with thin data (few verified gyms) because it's a navigational hub. Still requires the 300-word body floor.

---

## 3. City page

The primary ranking page. Never publishes without ≥3 verified gyms.

- **URL:** `/gyms/{state}/{city}`
- **Schema:** `ItemList` (of `LocalBusiness`), `BreadcrumbList`, optional `FAQPage`
- **Uniqueness floor:** 55% (solo: bumped from 40%)
- **Word count floor:** 300 body words (excluding gym cards — cards don't count)

### Structure
1. Breadcrumbs: Home › Gyms › {State} › {City}
2. H1: `"BJJ Gyms in {City}, {State}"`
3. Static map (above fold) — city-centered with gym pins. Interactive map lazy-loads below fold.
4. Quick answer (unique, ≤40 words)
5. Intro (unique, ≥200 words — `City.bjjContext`)
6. Gym cards (templated — every verified gym with `cityId == this`)
7. Filter UI (client-side — gi/no-gi, kids, trial offered). Filtered views render `noindex`.
8. Notable athletes from {City} (templated — pulled from Iteration 1)
9. Nearby cities (templated from `City.adjacentCityIds`)
10. FAQ (unique, ≥3 Q&A — city-specific questions)
11. Sources

### Worked example — Los Angeles

Record: `City.name = "Los Angeles"`, `stateId = "ca"`, 18 verified gyms, `bjjContext` 220-word paragraph, 4 notable athletes, 5 adjacent cities, 4 FAQ items.

Rendered body word budget:
- Quick answer 35w · bjjContext 220w · FAQ 240w · Nearby/Notable/template labels 80w ≈ 575w body
- Template-shared text: ~80w
- Uniqueness ≈ 495/575 ≈ 86%. Well above 55% floor.

**FAQ example (unique to LA):**
- Q: "What's the average monthly cost of a BJJ gym in Los Angeles?" A: "$180–$280/month at most academies, with the Gracie Academy Torrance and Art of Jiu Jitsu (Costa Mesa, adjacent) toward the upper end. Many Hollywood-area gyms run $150–$200 for unlimited classes plus a trial week free."
- Q: "Which Los Angeles BJJ gym is best for beginners?" A: — references specific gyms by characteristic...
- Q: "Are there 24/7 BJJ gyms in LA?" A: ...
- Q: "Can I do BJJ in LA if I'm a complete beginner?" A: ...

Each FAQ is grounded in city-specific fact, not boilerplate.

---

## 4. Gym detail page

Data-dense, prose-light.

- **URL:** `/gyms/{state}/{city}/{gym-slug}`
- **Schema:** `LocalBusiness` (subtype: `MartialArtsSchool`, `SportsActivityLocation`), `BreadcrumbList`, `GeoCoordinates`, optional `Review`
- **Uniqueness floor:** 45% (solo: bumped from 35%)
- **Word count floor:** 200 (geo pages are data-dense, short prose is fine if data is rich)

### Structure
1. Breadcrumbs: Home › Gyms › {State} › {City} › {Gym Name}
2. H1: gym name
3. Hero image (gym-provided, or a static street view as fallback)
4. Key facts card (templated from record):
   - Address (copy-friendly, linked to Google Maps)
   - Phone (if available)
   - Website (external link)
   - Head instructor (linked to athlete page if modeled)
   - Federation affiliations
   - Class styles
   - Trial offer
5. Class schedule table (templated from `Gym.schedule`)
6. About this gym (unique — `Gym.description`, ≥120 words)
7. Head instructor bio block (if `headInstructorAthleteId` resolves, pull from athlete record; else use denormalized `headInstructorName` + `lineage`)
8. Location map + directions link
9. Reviews summary (if `reviewCount` and `averageRating` are populated with attribution)
10. "Claim this listing" CTA (if not yet claimed)
11. Nearby gyms in same city (templated)
12. Sources / attribution footer

### Worked example — Gracie Barra Torrance

Record: slug `gracie-barra-torrance`, address in Torrance CA, head instructor name with 20-year lineage traceable to Carlos Gracie Jr., all five class styles, full schedule with 18 weekly classes, 180-word description, website + IG + FB, `verificationSource: federation-list`, 2 citation sources.

Rendered body word budget:
- Description 180w · Key facts card 60w · Schedule table 80w · Head instructor bio 120w · Template labels 60w ≈ 500w
- Template-shared: ~80w
- Uniqueness ≈ 420/500 ≈ 84%. Well above 45%.

### LocalBusiness schema (required)

```json
{
  "@context": "https://schema.org",
  "@type": "MartialArtsSchool",
  "name": "Gracie Barra Torrance",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "...",
    "addressLocality": "Torrance",
    "addressRegion": "CA",
    "postalCode": "...",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 33.8358,
    "longitude": -118.3406
  },
  "telephone": "...",
  "url": "https://...",
  "openingHoursSpecification": [ /* from schedule */ ],
  "sameAs": [ /* social links */ ]
}
```

---

## 5. Template design rules (geo-specific)

### Forbidden patterns (CI-enforced)
- **String-replace mad-libs:** `"Looking for BJJ in {city}? We list the top gyms below."` repeated identically. Enforced by the n-gram frequency audit from `../iteration-1-content/QUALITY-GATES.md` §3.3.
- **Identical FAQ across cities.** Each city's FAQ must reference the city specifically. LLM prompts for FAQ generation include the city name + bjjContext + notable gyms as grounding.
- **Identical `description` across gyms.** Gym descriptions are ≥120 words that reference the specific gym's distinctive features (lineage, specialization, competition team, size, etc.).
- **Copied content from the gym's own website.** Use the gym's site as a reference, but paraphrase. Exact copying is copyright risk + duplicate-content risk.

### Required patterns
- **Schema first.** `LocalBusiness` with complete `address` and `geo` is non-negotiable. Missing schema → build fails.
- **Citation visible.** Sources section cites the federation list, Google Maps verification, and (if used) the gym's own site.
- **`verifiedAt` date visible.** On every gym page: "Listing verified [date]. [Report incorrect info] / [Claim this listing]" — builds trust.
- **Claim and report flows on every gym page.** Small, unobtrusive, but present. Grows the self-serve data flow.
- **Map with explicit dimensions.** Static map image with width/height; interactive map facade-loads on click.

### Image & media requirements
- Hero image: gym-provided or fallback to a city-representative stock (not a fake gym photo)
- Never fabricate gym interiors
- Maps: use OpenStreetMap or a ToS-compliant tile provider; don't embed scraped Google Maps
- Embed-style maps: facade pattern (image first, JS-loaded interactive on click)

---

## 6. Uniqueness engineering

What makes geo pages structurally unique enough to pass the floor:

- **Gym cards on city pages** are record-driven; they don't contribute to body-text uniqueness but do drive user value
- **City FAQ** is the main uniqueness engine on city pages — prompt-generate against `City.bjjContext` + notable gyms + adjacent cities
- **Gym description** is the main uniqueness engine on gym pages — prompt-generate against federation + instructor + class styles + schedule density
- **Head instructor block** on gym pages reuses Iteration 1 `Athlete` data where available — genuine cross-iteration uniqueness boost

Pages without these (e.g., a city with thin bjjContext or a gym with generic description) will struggle to pass the floor. That's the point — publish gate forces data richness.
