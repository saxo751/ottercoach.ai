# Iteration 2 — Data Schemas (Geo)

**Scope:** records for the gym directory — `State`, `City`, `Gym`, plus supporting types.

Fields marked `required` must be populated for a page to pass the CI gate.

---

## 1. `State`

```ts
type State = {
  id: string;                              // "ca"
  slug: string;                            // "ca"
  name: string;                            // "California"
  countryCode: CountryCode;                // "US"
  description: string;                     // required, ≥150 words — BJJ overview for this state
  notableAcademyNames: string[];           // informal list for narrative
  cityCount: number;                       // denormalized — count of City records with stateId == this
  gymCount: number;                        // denormalized — count of verified gyms
  citationSources: Citation[];             // ≥1
  dateModified: ISODate;
};
```

**Publish gate:** state hubs publish as `index, follow` even with thin data, because they're navigational — but only if `description ≥150 words`. If no cities yet, the page lists "coming soon" cities and links back to major content hubs.

---

## 2. `City`

```ts
type City = {
  id: string;
  slug: string;                            // "los-angeles"
  name: string;                            // "Los Angeles"
  stateId: string;                         // required — @link State
  countryCode: CountryCode;
  populationBand: 'small' | 'medium' | 'large' | 'major';
  latitude: number;
  longitude: number;
  bjjContext: string;                      // required, ≥200 words — local BJJ history, notable gyms, notable athletes from here
  notableAthleteIds: string[];             // @link Athlete records (from Iteration 1) who are from this city
  adjacentCityIds: string[];               // for "nearby" internal linking
  gymCount: number;                        // denormalized
  verifiedGymCount: number;                // denormalized — gates the publish decision
  minimumGymsForPublish: 3;                // constant, not a data field — enforced by template
  faq: FAQItem[];                          // required, ≥3 — unique per city
  citationSources: Citation[];             // ≥1
  dateModified: ISODate;
};

type FAQItem = {
  question: string;
  answer: string;                          // ≥40 words, references city-specific facts
};
```

**Publish gate:** `verifiedGymCount ≥3` AND `bjjContext ≥200 words` AND `faq.length ≥3`. Below thresholds → `noindex, follow` until enriched.

---

## 3. `Gym`

The record type with the most compound requirements.

```ts
type Gym = {
  id: string;
  slug: string;                            // "gracie-barra-la"
  name: string;                            // required
  cityId: string;                          // required — @link City
  address: {                               // required
    streetLine1: string;
    streetLine2?: string;
    postalCode: string;
    countryCode: string;
  };
  location: {                              // required — for LocalBusiness schema
    latitude: number;
    longitude: number;
  };
  phone?: string;
  email?: string;
  website?: string;                        // strongly recommended
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  headInstructorAthleteId?: string;        // @link Athlete if modeled (Iteration 1)
  headInstructorName: string;              // required — denormalized even without athlete link
  lineage?: string;                        // "Rickson Gracie → Henry Akins → head instructor"
  affiliatedFederations: FederationName[]; // ≥1 if known — "ibjjf" | "gracie-humaita" | "graciebarra" | "alliance" | "checkmat" | "renzo" | "atos" | "10th-planet" | "independent"
  schedule?: ClassSchedule[];              // strongly encouraged — adds uniqueness + utility
  classStyles: ClassStyle[];               // required, ≥1 — "gi" | "no-gi" | "kids" | "womens" | "self-defense" | "competition"
  trialOffered: boolean;
  trialDetails?: string;                   // "First class free, or $20 trial week"
  pricingNote?: string;                    // "~$180/month" — optional
  description: string;                     // required, ≥120 words — what's distinctive about this gym
  verifiedAt: ISODate;                     // required
  verificationSource: 'federation-list' | 'manual' | 'gym-submitted' | 'gym-claimed' | 'user-submitted';
  verificationNotes: string[];             // audit trail — "Verified via IBJJF affiliate list + Google Maps on 2026-04-13"
  claimedByOwner: boolean;
  claimedByOwnerAt?: ISODate;
  ownerEmail?: string;                     // hashed in storage for privacy
  featuredListingTier?: 'none' | 'basic' | 'premium';  // monetization
  reviewCount?: number;                    // pulled from Google Maps if attributed
  averageRating?: number;
  heroImage?: ImageAsset;
  citationSources: Citation[];             // required, ≥2 (at minimum: gym's own site + one verification source)
  dateModified: ISODate;
  status: 'active' | 'closed' | 'pending-verification';
};

type ClassSchedule = {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;                       // "18:00"
  endTime: string;
  className: string;                       // "Fundamentals Gi"
  level: 'all-levels' | 'beginner' | 'advanced' | 'kids';
  style: 'gi' | 'no-gi' | 'mixed';
};

type ClassStyle = 'gi' | 'no-gi' | 'kids' | 'womens' | 'self-defense' | 'competition';
type FederationName = 'ibjjf' | 'gracie-humaita' | 'graciebarra' | 'alliance' | 'checkmat' | 'renzo' | 'atos' | '10th-planet' | 'independent';
```

### Publish gate (Gym)
ALL of:
- `address` fully populated
- `headInstructorName` present
- `classStyles.length ≥1`
- `description ≥120 words`
- `verifiedAt` within 18 months
- `verificationSource` is one of `federation-list | manual | gym-claimed`
- `citationSources.length ≥2`
- `status == 'active'`

Any gym failing → `noindex, follow`. A gym remains in the database but unlisted until it passes.

---

## 4. `ClaimRequest` (owner-claim flow)

For the "claim this listing" UI.

```ts
type ClaimRequest = {
  id: string;
  gymId: string;                           // @link Gym
  submittedAt: ISODate;
  claimantName: string;
  claimantEmail: string;
  claimantRole: 'owner' | 'head-instructor' | 'manager' | 'other';
  verificationMethod: 'email-domain-match' | 'manual';
  verifiedAt?: ISODate;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
};
```

Auto-verify when `claimantEmail` domain matches the gym's `website` domain. Otherwise manual review (you).

---

## 5. `GymSubmission` (user-submission flow)

For "submit a gym" UI.

```ts
type GymSubmission = {
  id: string;
  submittedAt: ISODate;
  submitterEmail: string;
  relationshipToGym: 'student' | 'owner' | 'visitor' | 'other';
  proposedGymData: Partial<Gym>;           // user-filled subset
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'needs-verification';
  moderationNotes: string[];
  resultingGymId?: string;                 // if approved and converted to a Gym
};
```

Submissions go to a moderation queue. You review weekly (15–30 min). Approved submissions become `Gym` records with `verificationSource = 'user-submitted'` and must still go through manual or federation-list verification before they pass the publish gate.

---

## 6. Cross-cutting types (re-used from Iteration 1)

```ts
type ImageAsset = { /* same as Iteration 1 */ };
type ISODate = string;
type CountryCode = string;
type Citation = { /* same as Iteration 1 */ };
```

---

## 7. Denormalized fields (recompute on write)

- `State.cityCount`, `State.gymCount`
- `City.gymCount`, `City.verifiedGymCount`
- `Gym` has no denorm children

Recompute on: record insert, update, status change. Nightly full-table reconciliation job as a safety net.

---

## 8. Index & query patterns

For the directory UI to feel fast:

- Query: gyms by city → indexed on `cityId`
- Query: gyms by state → via city denorm
- Query: gyms by style → indexed on `classStyles` (array index)
- Query: gyms by federation → indexed on `affiliatedFederations`
- Query: claimed gyms → indexed on `claimedByOwner`
- Query: gyms due for re-verification → indexed on `verifiedAt`

---

## 9. Privacy & retention

- `Gym.ownerEmail` stored as salted hash; only used for claim-flow identity matching
- `ClaimRequest.claimantEmail` retained only until verified; then purged after 90 days
- `GymSubmission.submitterEmail` retained for 180 days (for moderation follow-up), then purged
- Gym data is public by design; claim/submission data is private

---

## 10. How geo records interact with Iteration 1

Deliberately minimal coupling:

- `Gym.headInstructorAthleteId` optionally links to an `Athlete` record. If set, the gym page renders the athlete card; the athlete page renders the gym card. Bidirectional internal link win.
- `City.notableAthleteIds` lists Iteration 1 `Athlete` records whose nationality + biographical city is this city. Internal-linking sugar.
- No other coupling. Iteration 2 can be entirely removed without breaking Iteration 1 pages.
