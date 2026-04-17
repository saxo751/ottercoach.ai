# Iteration 1 — Data Schemas

**Scope:** all non-geo data models. Every record type used by Iteration 1 page templates.
**Notation:** TypeScript-style. `required` fields must be populated for a page to pass the CI gate.

---

## 1. `Technique`

Canonical record per named technique. Variations are separate records (§2).

```ts
type Technique = {
  id: string;                              // UUID
  slug: string;                            // required, unique — "triangle-choke"
  name: string;                            // required — "Triangle Choke"
  aliases: string[];                       // ["Sankaku Jime", "Triangulo"]
  category: TechniqueCategory;             // required — "submission" | "sweep" | "escape" | "pass" | "takedown" | "control"
  submissionType?: 'choke' | 'joint-lock';
  jointTargeted?: 'elbow' | 'shoulder' | 'wrist' | 'knee' | 'ankle' | 'neck';
  parentPositionId: string;                // required — @link Position
  targetBeltId: BeltId;                    // required — earliest belt commonly taught
  difficulty: 1 | 2 | 3 | 4 | 5;           // 1 = fundamental, 5 = advanced
  legalByRuleset: {                        // required
    ibjjfGi:     { allowedAt: BeltId | 'never' };
    ibjjfNoGi:   { allowedAt: BeltId | 'never' };
    adcc:        { allowed: boolean };
    submissionOnly: { allowed: boolean };
  };
  shortDescription: string;                // required, ≤40 words — AI-quotable quick answer
  longDescription: string;                 // required, ≥150 words — narrative intro
  history?: string;                        // optional
  steps: Step[];                           // required, ≥4 items
  commonMistakes: Mistake[];               // required, ≥3 items
  counterTechniqueIds: string[];           // required, ≥1
  followUpTechniqueIds: string[];          // optional
  relatedTechniqueIds: string[];           // optional
  signaturePractitionerIds: string[];      // required, ≥3 — @link Athlete
  glossaryTermIds: string[];               // optional — auto-inline-linked
  heroImage: ImageAsset;                   // required
  videoEmbed?: VideoEmbed;
  citationSources: Citation[];             // required, ≥1 — see §11 (critical for solo op)
  reviewedById: string;                    // required — @link Reviewer
  datePublished: ISODate;
  dateModified: ISODate;
  noindex?: boolean;
};

type Step = {
  order: number;
  title: string;
  detail: string;                          // 1–3 sentences
  image?: ImageAsset;
};

type Mistake = {
  title: string;
  detail: string;                          // 1–2 sentences on why it fails and the fix
};

type VideoEmbed = {
  provider: 'youtube' | 'vimeo';
  videoId: string;
  startSeconds?: number;
  description: string;
  thumbnailUrl: string;
  durationSeconds: number;
  uploadedBy: string;
  attributionUrl?: string;
};
```

---

## 2. `TechniqueVariation`

```ts
type TechniqueVariation = {
  id: string;
  techniqueId: string;                     // required — @link Technique
  fromPositionId: string;                  // required — @link Position
  slug: string;                            // required — "from-closed-guard"
  variationName: string;                   // "Triangle from Closed Guard"
  shortDescription: string;                // required, ≤40 words
  steps: Step[];                           // required, ≥4, distinct from canonical
  commonMistakes: Mistake[];               // required, ≥3, distinct
  counterTechniqueIds: string[];           // required, ≥1
  setupDetail: string;                     // required, ≥80 words — specific setup for this position
  videoEmbed?: VideoEmbed;
  citationSources: Citation[];             // required, ≥1
  reviewedById: string;                    // required
  dateModified: ISODate;
};
```

**Creation rule:** only create a variation if rewritten steps + mistakes + setup would push uniqueness to ≥40% vs. the canonical. Otherwise, fold into canonical as a sub-section. Enforced in the CI gate.

---

## 3. `Position`

```ts
type Position = {
  id: string;
  slug: string;                            // "closed-guard"
  name: string;
  aliases: string[];                       // "guarda fechada", etc.
  category: 'guard' | 'top' | 'standing' | 'transition';
  parentPositionId?: string;               // "half-guard" parent of "deep-half-guard"
  description: string;                     // required, ≥300 words
  whenYoureInIt: string;                   // required, ≥80 words
  primaryAttackIds: string[];              // required, ≥5
  primaryEscapeIds: string[];              // required, ≥3
  subPositionIds: string[];
  counterPositionIds: string[];            // required, ≥1
  topPractitionerIds: string[];            // required, ≥3
  relatedDrillIds: string[];
  targetBeltId: BeltId;                    // earliest belt
  heroImage: ImageAsset;
  videoEmbed?: VideoEmbed;
  citationSources: Citation[];             // required, ≥1
  reviewedById: string;
  dateModified: ISODate;
};
```

---

## 4. `Belt` & `CurriculumModule`

```ts
type Belt = {
  id: BeltId;                              // "white" | "blue" | "purple" | "brown" | "black"
  slug: string;
  name: string;                            // "White Belt"
  order: 1 | 2 | 3 | 4 | 5;
  description: string;                     // ≥300 words
  averageTimeAtBeltMonths: { min: number; typical: number; max: number };
  promotionCriteriaByFederation: {
    ibjjf: string;
    gracieHumaita: string;
    gracieBarra: string;
  };
  coreTechniqueIds: string[];              // required, ≥8
  corePositionIds: string[];               // required, ≥3
  stripeCount: 0 | 4;
  citationSources: Citation[];             // required, ≥2 (federation sources)
  reviewedById: string;
};

type CurriculumModule = {
  id: string;
  beltId: BeltId;                          // required
  slug: string;                            // "fundamental-techniques"
  name: string;                            // "Fundamental Techniques for White Belt"
  order: number;
  description: string;                     // ≥200 words
  techniqueIds: string[];                  // required, ≥5
  drillIds: string[];
  estimatedWeeksToComplete: number;
  federation?: 'ibjjf' | 'gracie' | 'generic';
  citationSources: Citation[];             // required, ≥1
  reviewedById: string;
};
```

---

## 5. `Flow` (transition)

```ts
type Flow = {
  id: string;
  slug: string;                            // "scissor-sweep-to-mount"
  fromTechniqueId: string;                 // required
  toTechniqueId?: string;                  // one of toTechniqueId or toPositionId required
  toPositionId?: string;
  name: string;                            // "Scissor Sweep into Mount"
  transitionNarrative: string;             // required, ≥200 words
  commonMistakes: Mistake[];               // required, ≥2
  triggerConditions: string;               // required, ≥80 words — "when opponent does X"
  videoEmbed?: VideoEmbed;
  citationSources: Citation[];             // required, ≥1
  reviewedById: string;
  dateModified: ISODate;
};
```

Flows are only published when a real documented transition exists. This is editorial quality at programmatic URL shape. No auto-enumeration of all technique×technique combos.

---

## 6. `GlossaryTerm`

```ts
type GlossaryTerm = {
  id: string;
  slug: string;                            // "berimbolo"
  term: string;
  aliases: string[];
  language: 'en' | 'pt' | 'jp';
  translations: { en?: string; pt?: string; jp?: string };
  definition: string;                      // required, ≥80 words
  etymology?: string;
  firstUseContext?: string;
  relatedTermIds: string[];                // required, ≥2
  relatedTechniqueIds?: string[];
  relatedPositionIds?: string[];
  citationSources: Citation[];             // required, ≥1
  dateModified: ISODate;
};
```

---

## 7. `Drill`

```ts
type Drill = {
  id: string;
  slug: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  positionIds: string[];                   // ≥1
  techniqueIds?: string[];
  durationMinutes: number;
  reps?: number;
  description: string;                     // required, ≥200 words
  instructions: Step[];                    // required, ≥3
  coachingPoints: string[];                // required, ≥3
  progressions: string[];
  videoEmbed?: VideoEmbed;
  citationSources: Citation[];             // required, ≥1
  reviewedById: string;
};
```

---

## 8. `Athlete`

Highest hallucination risk record type — every field must be citable.

```ts
type Athlete = {
  id: string;
  slug: string;                            // "marcus-almeida-buchecha"
  name: string;
  aliases: string[];                       // ["Buchecha"]
  dateOfBirth?: ISODate;
  nationality: CountryCode;
  genderCategory: 'mens' | 'womens' | 'open';
  currentBeltId: BeltId;
  academyName: string;                     // denormalized even if gym isn't modeled in Iteration 1
  lineage: LineageNode[];                  // required, ≥1
  weightClass?: string;
  status: 'active' | 'retired' | 'deceased';
  competitionCategory: ('gi' | 'no-gi' | 'mma')[];
  careerSummary: string;                   // required, ≥200 words for indexable athletes
  notableAccomplishments: Accomplishment[];// required, ≥3
  signatureTechniqueIds: string[];         // required, ≥1
  notableMatchIds?: string[];
  photo?: ImageAsset;
  citationSources: Citation[];             // required, ≥2 (biographical claims need sourcing)
  dateModified: ISODate;
};

type LineageNode = {
  coachName: string;
  coachAthleteId?: string;
  beltReceived: BeltId;
  year?: number;
};

type Accomplishment = {
  eventId?: string;                        // @link Event if modeled
  eventName: string;                       // always denormalized
  year: number;
  placement: 'gold' | 'silver' | 'bronze' | 'medalist' | 'competitor';
  division: string;                        // "black belt heavy"
  citationUrl?: string;                    // direct source for this claim
};
```

**Publish gate:** careerSummary ≥200 words AND ≥3 accomplishments with citation URLs AND ≥1 signature technique AND ≥2 `citationSources` overall. Else `noindex`.

---

## 9. `Event` & `EventSeries`

```ts
type EventSeries = {
  id: string;                              // "ibjjf-worlds"
  slug: string;
  name: string;
  organization: string;                    // "IBJJF"
  description: string;                     // ≥200 words
  firstHeldYear: number;
  officialUrl?: string;
};

type Event = {
  id: string;
  slug: string;                            // "ibjjf-worlds-2025"
  name: string;                            // "IBJJF World Championship 2025"
  seriesId: string;                        // @link EventSeries
  year: number;
  startDate: ISODate;
  endDate: ISODate;
  locationCity: string;                    // stored as string, not @link City (geo is Iteration 2)
  locationCountry: CountryCode;
  ruleset: 'ibjjf-gi' | 'ibjjf-no-gi' | 'adcc' | 'submission-only' | 'other';
  divisions: Division[];                   // required, ≥1
  narrative: string;                       // required, ≥200 words
  topStorylines: string[];                 // 3–5 one-sentence beats
  citationSources: Citation[];             // required, ≥2 (result sources)
  dateModified: ISODate;
};

type Division = {
  name: string;                            // "Black Belt Heavy Men's"
  belt: BeltId;
  weightClass: string;
  genderCategory: 'mens' | 'womens' | 'open';
  podium: { gold?: AthleteId; silver?: AthleteId; bronze?: AthleteId };
};
```

---

## 10. `Reviewer`

Your E-E-A-T backbone.

```ts
type Reviewer = {
  id: string;
  slug: string;
  name: string;
  photo: ImageAsset;                       // required
  currentBeltId: BeltId;                   // required
  yearPromotedToBlack?: number;
  lineage: LineageNode[];                  // required, ≥1
  academy: string;                         // required
  bio: string;                             // required, ≥200 words
  credentials: string[];                   // required, ≥2
  socialLinks?: { instagram?: string; youtube?: string; twitter?: string };
  reviewCount: number;                     // denormalized
  scopeOfExpertise: string[];              // "no-gi", "leglocks", "closed-guard" — used to match reviewer to technique
};
```

For solo operation, start with one `Reviewer` record (you, or one recruited coach). Add more as you recruit them.

---

## 11. `Citation` — the anti-hallucination spine

Citations are how we replace human fact-checkers. Every indexable record must carry at least one.

```ts
type Citation = {
  id: string;
  sourceType: 'book' | 'federation-document' | 'instructional-video' | 'academic-paper' | 'coach-blog' | 'news-article';
  title: string;                           // "The Gracie Way" | "IBJJF Rule Book 2024"
  author?: string;
  publisher?: string;
  publicationYear?: number;
  url?: string;                            // direct URL when available
  pageOrTimestamp?: string;                // "p. 142" or "3:24"
  accessedDate?: ISODate;
  notes?: string;
};
```

Citations appear on the rendered page in a "Sources" footer section (small but visible) AND are injected into JSON-LD as `citation` on appropriate schema types (Article, HowTo, etc.).

---

## 12. Cross-cutting types

```ts
type ImageAsset = {
  src: string;
  width: number;                           // required (CLS)
  height: number;                          // required (CLS)
  alt: string;                             // required, ≥4 words, descriptive
  format: 'avif' | 'webp' | 'jpg' | 'png';
  blurhash?: string;
  creditLine?: string;                     // attribution where applicable
};

type ISODate = string;
type CountryCode = string;                 // ISO-3166 alpha-2
type BeltId = 'white' | 'blue' | 'purple' | 'brown' | 'black';
type TechniqueCategory = 'submission' | 'sweep' | 'escape' | 'pass' | 'takedown' | 'control';
type AthleteId = string;
```

---

## 13. Derived / denormalized fields

Pre-compute for performance; regenerate on write:

- `Technique.variationCount`
- `Position.techniqueCount`, `Position.attackCount`, `Position.escapeCount`
- `Belt.techniqueCount`
- `Athlete.accomplishmentCount`, `Athlete.signatureTechniqueCount`
- `Reviewer.reviewCount`
- `EventSeries.eventCount`

These drive UI counts, publish gates (e.g., athlete needs ≥3 accomplishments), and sitemap decisions.
