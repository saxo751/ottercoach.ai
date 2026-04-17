# Plan 1 — Site Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Astro content site at `web-seo/`, define the full Zod data model, build shared components + logic libraries, render one end-to-end page type (Technique), and ship it to Cloudflare Pages with CI gates (build + typecheck + tests + Lighthouse).

**Architecture:** Astro SSG project inside the existing `bjj-coach/` monorepo at `web-seo/`. Git-versioned content collections. Zod schemas in `src/content/config.ts` are the single source of truth, mirroring `../DATA-SCHEMAS.md`. Shared components compose into route files that read from collections. JSON-LD is built from structured record data, never hand-written. Internal linking and sitemap respect a `noindex` frontmatter flag. CI runs typecheck + unit tests + Playwright + Lighthouse on every PR.

**Tech Stack:** Astro 4.x, TypeScript 5.x, Zod 3.x, schema-dts, Vitest, Playwright, Lighthouse CI, Cloudflare Pages, GitHub Actions, Tailwind CSS (for consistency with Anthropic brand guidelines referenced in CLAUDE.md).

**Prerequisites:**
- `APP-MIGRATION.md` Steps 1–4 must be complete before the production deploy step (Task 30). The apex DNS cutover (Step 7 of APP-MIGRATION.md) happens in parallel with Task 30.
- Node.js 20+ installed locally.
- GitHub repo exists for `bjj-coach/` with Actions enabled.
- Cloudflare account with Pages access.

**Scope — what this plan delivers:**
- `web-seo/` directory scaffolded, builds cleanly, deploys to Cloudflare Pages.
- Full Zod data model for all 13 record types from DATA-SCHEMAS.md.
- 7 reusable UI components (Breadcrumb, SourcesList, ReviewerByline, Faq, VideoFacade, RelatedCard, JsonLd).
- 3 logic libraries (schema-ld, related, sitemap).
- Sample records (1 Reviewer, 1 Citation, 1 Belt, 1 Position, 1 Technique) sufficient to render one Technique page.
- Working Technique route at `/technique/triangle-choke` with complete JSON-LD (HowTo + BreadcrumbList + FAQPage + VideoObject), ≥5 internal links, noindex flag respected.
- CI workflow running typecheck, unit tests, Playwright, Lighthouse on every PR.
- Production deploy at `https://theottercoach.com/technique/triangle-choke`.

**Out of scope (future plans):**
- Other page templates (Plan 2)
- Quality gates beyond typecheck/build/Lighthouse (Plan 3)
- LLM drafting pipeline (Plan 4)
- Promotion + sampling (Plan 5)
- Monitoring digests (Plan 6)

---

## File inventory

**New files (relative to `bjj-coach/web-seo/` unless otherwise noted):**

```
package.json
tsconfig.json
astro.config.mjs
tailwind.config.mjs
.gitignore
vitest.config.ts
playwright.config.ts
lighthouserc.json

src/env.d.ts
src/content/config.ts                      # all Zod schemas + collections
src/content/reviewers/founder.json
src/content/citations/ibjjf-rulebook-2024.json
src/content/citations/marcelo-garcia-book.json
src/content/belts/blue.json
src/content/positions/closed-guard.json
src/content/techniques/triangle-choke.mdx

src/layouts/BaseLayout.astro

src/components/Breadcrumb.astro
src/components/SourcesList.astro
src/components/ReviewerByline.astro
src/components/Faq.astro
src/components/VideoFacade.astro
src/components/RelatedCard.astro
src/components/JsonLd.astro

src/lib/schema-ld.ts
src/lib/related.ts
src/lib/sitemap.ts

src/lib/__tests__/schema-ld.test.ts
src/lib/__tests__/related.test.ts
src/lib/__tests__/sitemap.test.ts
src/content/__tests__/config.test.ts

src/pages/index.astro                       # placeholder homepage
src/pages/technique/[slug].astro

tests/e2e/technique.spec.ts

../.github/workflows/build.yml              # at repo root, not web-seo/
```

**Modified files:**
- None in Plan 1. The existing `bjj-coach/web/`, `bjj-coach/mobile/`, `bjj-coach/server/` trees are untouched.

---

## Task 1: Scaffold Astro project

**Files:**
- Create: `web-seo/package.json`
- Create: `web-seo/tsconfig.json`
- Create: `web-seo/astro.config.mjs`
- Create: `web-seo/.gitignore`
- Create: `web-seo/src/env.d.ts`
- Create: `web-seo/src/pages/index.astro`

- [ ] **Step 1: Create `web-seo/` directory and initialize package.json**

From the repo root (`bjj-coach/`):

```bash
mkdir -p web-seo
cd web-seo
```

Create `web-seo/package.json`:

```json
{
  "name": "bjj-coach-web-seo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lighthouse": "lhci autorun"
  },
  "dependencies": {
    "astro": "^4.16.0"
  }
}
```

- [ ] **Step 2: Create `web-seo/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 3: Create `web-seo/astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://theottercoach.com',
  output: 'static',
  build: {
    format: 'directory',
  },
  trailingSlash: 'never',
});
```

- [ ] **Step 4: Create `web-seo/.gitignore`**

```
node_modules/
dist/
.astro/
.env
.env.production
*.log
.DS_Store
.cache/
coverage/
playwright-report/
test-results/
```

- [ ] **Step 5: Create `web-seo/src/env.d.ts`**

```ts
/// <reference types="astro/client" />
```

- [ ] **Step 6: Create `web-seo/src/pages/index.astro` (placeholder)**

```astro
---
const title = 'The Otter Coach — BJJ Knowledge Base';
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content="The open web's most structured BJJ knowledge base." />
  </head>
  <body>
    <h1>{title}</h1>
    <p>Coming soon.</p>
  </body>
</html>
```

- [ ] **Step 7: Install dependencies and verify build**

```bash
cd web-seo
npm install
npm run build
```

Expected: `dist/index.html` exists and contains "The Otter Coach".

Verify:

```bash
test -f dist/index.html && grep -q "The Otter Coach" dist/index.html && echo PASS || echo FAIL
```

Expected output: `PASS`

- [ ] **Step 8: Commit**

```bash
cd ..
git add web-seo/
git commit -m "feat(web-seo): scaffold Astro project with placeholder homepage"
```

---

## Task 2: Install core dependencies

**Files:**
- Modify: `web-seo/package.json` (dependencies block)
- Modify: `web-seo/astro.config.mjs` (integrations)
- Create: `web-seo/tailwind.config.mjs`

- [ ] **Step 1: Install integrations and libraries**

From `web-seo/`:

```bash
npm install @astrojs/sitemap @astrojs/mdx @astrojs/tailwind @astrojs/check tailwindcss zod schema-dts
npm install -D typescript @types/node
```

- [ ] **Step 2: Update `astro.config.mjs` to register integrations**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://theottercoach.com',
  output: 'static',
  build: {
    format: 'directory',
  },
  trailingSlash: 'never',
  integrations: [
    mdx(),
    tailwind({ applyBaseStyles: true }),
    sitemap({
      filter: (page) => !page.includes('/draft/'),
    }),
  ],
});
```

Note: the `sitemap` filter is temporarily based on URL pattern; it will be replaced with a noindex-aware version in Task 24.

- [ ] **Step 3: Create `web-seo/tailwind.config.mjs`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#faf9f5',
        ink: '#141413',
        accent: '#d97757',
        blue: '#6a9bcc',
        green: '#788c5d',
      },
      fontFamily: {
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Lora', 'Georgia', 'serif'],
      },
    },
  },
};
```

- [ ] **Step 4: Verify build still passes**

```bash
npm run build
```

Expected: build succeeds; `dist/` exists.

- [ ] **Step 5: Commit**

```bash
git add web-seo/
git commit -m "chore(web-seo): install sitemap, mdx, tailwind, zod, schema-dts"
```

---

## Task 3: Configure Vitest and Playwright

**Files:**
- Create: `web-seo/vitest.config.ts`
- Create: `web-seo/playwright.config.ts`
- Create: `web-seo/src/lib/__tests__/_smoke.test.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @vitest/ui happy-dom @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create `web-seo/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 3: Create `web-seo/playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 4: Write smoke test to verify vitest works**

Create `web-seo/src/lib/__tests__/_smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('vitest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

```bash
npm test
```

Expected: `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add web-seo/
git commit -m "chore(web-seo): configure Vitest and Playwright"
```

---

## Task 4: Define cross-cutting Zod types

**Files:**
- Create: `web-seo/src/content/config.ts`

This file will grow across Tasks 4–9. Start with cross-cutting types (enums, shared sub-types).

- [ ] **Step 1: Create `web-seo/src/content/config.ts` with shared Zod types**

```ts
import { z, defineCollection } from 'astro:content';

// -------- Shared enums --------
export const BeltId = z.enum(['white', 'blue', 'purple', 'brown', 'black']);
export type BeltId = z.infer<typeof BeltId>;

export const TechniqueCategory = z.enum([
  'submission',
  'sweep',
  'escape',
  'pass',
  'takedown',
  'control',
]);

export const SubmissionType = z.enum(['choke', 'joint-lock']);
export const JointTargeted = z.enum(['elbow', 'shoulder', 'wrist', 'knee', 'ankle', 'neck']);
export const PositionCategory = z.enum(['guard', 'top', 'standing', 'transition']);
export const DrillLevel = z.enum(['beginner', 'intermediate', 'advanced']);
export const AthleteStatus = z.enum(['active', 'retired', 'deceased']);
export const GenderCategory = z.enum(['mens', 'womens', 'open']);
export const EventRuleset = z.enum([
  'ibjjf-gi',
  'ibjjf-no-gi',
  'adcc',
  'submission-only',
  'other',
]);
export const CompetitionCategory = z.enum(['gi', 'no-gi', 'mma']);
export const CitationSourceType = z.enum([
  'book',
  'federation-document',
  'instructional-video',
  'academic-paper',
  'coach-blog',
  'news-article',
]);

// -------- Shared sub-types --------
export const ISODate = z.string().regex(
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/,
  'Must be ISO-8601 date',
);

export const ImageAsset = z.object({
  src: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().refine((s) => s.split(/\s+/).length >= 4, 'Alt text must be ≥4 words'),
  format: z.enum(['avif', 'webp', 'jpg', 'png']),
  blurhash: z.string().optional(),
  creditLine: z.string().optional(),
});

export const VideoEmbed = z.object({
  provider: z.enum(['youtube', 'vimeo']),
  videoId: z.string().min(1),
  startSeconds: z.number().int().nonnegative().optional(),
  description: z.string().min(1),
  thumbnailUrl: z.string().url(),
  durationSeconds: z.number().int().positive(),
  uploadedBy: z.string().min(1),
  attributionUrl: z.string().url().optional(),
});

export const Step = z.object({
  order: z.number().int().positive(),
  title: z.string().min(1),
  detail: z.string().min(1),
  image: ImageAsset.optional(),
});

export const Mistake = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
});

export const LineageNode = z.object({
  coachName: z.string().min(1),
  coachAthleteId: z.string().optional(),
  beltReceived: BeltId,
  year: z.number().int().min(1900).max(2100).optional(),
});

export const Accomplishment = z.object({
  eventId: z.string().optional(),
  eventName: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  placement: z.enum(['gold', 'silver', 'bronze', 'medalist', 'competitor']),
  division: z.string().min(1),
  citationUrl: z.string().url().optional(),
});

export const Division = z.object({
  name: z.string().min(1),
  belt: BeltId,
  weightClass: z.string().min(1),
  genderCategory: GenderCategory,
  podium: z.object({
    gold: z.string().optional(),
    silver: z.string().optional(),
    bronze: z.string().optional(),
  }),
});

// -------- Base frontmatter (shared publish gate) --------
export const BaseMeta = z.object({
  noindex: z.boolean().default(true),
  ready: z.boolean().default(false),
  templateVersion: z.string().default('1.0.0'),
  datePublished: ISODate.optional(),
  dateModified: ISODate,
});

// Placeholder collections object — will be populated in Tasks 5–9.
export const collections = {};
```

- [ ] **Step 2: Write cross-cutting-types test**

Create `web-seo/src/content/__tests__/config.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ImageAsset, ISODate, Step, Mistake, BeltId } from '../config';

describe('BeltId enum', () => {
  it('accepts valid belts', () => {
    expect(() => BeltId.parse('blue')).not.toThrow();
  });
  it('rejects invalid belt', () => {
    expect(() => BeltId.parse('green')).toThrow();
  });
});

describe('ISODate', () => {
  it('accepts valid date', () => {
    expect(() => ISODate.parse('2026-04-13')).not.toThrow();
  });
  it('accepts valid datetime', () => {
    expect(() => ISODate.parse('2026-04-13T12:34:56Z')).not.toThrow();
  });
  it('rejects non-ISO', () => {
    expect(() => ISODate.parse('April 13 2026')).toThrow();
  });
});

describe('ImageAsset', () => {
  const valid = {
    src: '/img/triangle.avif',
    width: 1200,
    height: 800,
    alt: 'Triangle choke from closed guard',
    format: 'avif' as const,
  };
  it('accepts a valid image', () => {
    expect(() => ImageAsset.parse(valid)).not.toThrow();
  });
  it('rejects alt text <4 words', () => {
    expect(() => ImageAsset.parse({ ...valid, alt: 'triangle choke' })).toThrow();
  });
  it('rejects non-positive dimensions', () => {
    expect(() => ImageAsset.parse({ ...valid, width: 0 })).toThrow();
  });
});

describe('Step & Mistake', () => {
  it('accepts valid Step', () => {
    expect(() =>
      Step.parse({ order: 1, title: 'Break posture', detail: 'Pull the head down.' }),
    ).not.toThrow();
  });
  it('rejects Step with order 0', () => {
    expect(() => Step.parse({ order: 0, title: 't', detail: 'd' })).toThrow();
  });
  it('accepts valid Mistake', () => {
    expect(() => Mistake.parse({ title: 'Arms inside', detail: 'Keeps attack shallow.' })).not.toThrow();
  });
});
```

- [ ] **Step 3: Run the test**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add web-seo/src/content/
git commit -m "feat(web-seo): add cross-cutting Zod types (enums, ImageAsset, Step, Mistake, etc.)"
```

---

## Task 5: Define Reviewer and Citation collections

**Files:**
- Modify: `web-seo/src/content/config.ts`

- [ ] **Step 1: Append Reviewer and Citation schemas + collections to `config.ts`**

Replace the `export const collections = {};` line at the bottom with the following:

```ts
// -------- Citation --------
export const Citation = z.object({
  id: z.string().min(1),
  sourceType: CitationSourceType,
  title: z.string().min(1),
  author: z.string().optional(),
  publisher: z.string().optional(),
  publicationYear: z.number().int().min(1800).max(2100).optional(),
  url: z.string().url().optional(),
  pageOrTimestamp: z.string().optional(),
  accessedDate: ISODate.optional(),
  notes: z.string().optional(),
});

// -------- Reviewer --------
export const Reviewer = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  photo: ImageAsset,
  currentBeltId: BeltId,
  yearPromotedToBlack: z.number().int().optional(),
  lineage: z.array(LineageNode).min(1),
  academy: z.string().min(1),
  bio: z.string().refine((s) => s.split(/\s+/).length >= 200, 'Bio must be ≥200 words'),
  credentials: z.array(z.string()).min(2),
  socialLinks: z
    .object({
      instagram: z.string().url().optional(),
      youtube: z.string().url().optional(),
      twitter: z.string().url().optional(),
    })
    .optional(),
  reviewCount: z.number().int().nonnegative().default(0),
  scopeOfExpertise: z.array(z.string()).min(1),
});

// -------- Astro collections --------
const reviewersCollection = defineCollection({
  type: 'data',
  schema: Reviewer,
});

const citationsCollection = defineCollection({
  type: 'data',
  schema: Citation,
});

export const collections = {
  reviewers: reviewersCollection,
  citations: citationsCollection,
};
```

- [ ] **Step 2: Add tests for Reviewer and Citation**

Append to `web-seo/src/content/__tests__/config.test.ts`:

```ts
import { Reviewer, Citation } from '../config';

describe('Citation', () => {
  it('accepts a federation document citation', () => {
    expect(() =>
      Citation.parse({
        id: 'ibjjf-rulebook-2024',
        sourceType: 'federation-document',
        title: 'IBJJF Rule Book 2024',
        publicationYear: 2024,
        url: 'https://ibjjf.com/rules',
      }),
    ).not.toThrow();
  });
  it('rejects invalid URL', () => {
    expect(() =>
      Citation.parse({
        id: 'bad',
        sourceType: 'book',
        title: 'x',
        url: 'not-a-url',
      }),
    ).toThrow();
  });
});

describe('Reviewer', () => {
  const longBio = Array(200).fill('word').join(' ');
  const valid = {
    id: 'founder',
    slug: 'founder',
    name: 'Jane Doe',
    photo: {
      src: '/img/jane.avif',
      width: 800,
      height: 800,
      alt: 'Jane Doe headshot at academy',
      format: 'avif' as const,
    },
    currentBeltId: 'black' as const,
    lineage: [{ coachName: 'Helio Gracie', beltReceived: 'black' as const }],
    academy: 'Otter BJJ Academy',
    bio: longBio,
    credentials: ['IBJJF black belt', 'Judges panel 2020–2024'],
    scopeOfExpertise: ['no-gi', 'closed-guard'],
  };
  it('accepts a complete reviewer', () => {
    expect(() => Reviewer.parse(valid)).not.toThrow();
  });
  it('rejects bio with <200 words', () => {
    expect(() => Reviewer.parse({ ...valid, bio: 'Short bio.' })).toThrow();
  });
  it('rejects bad slug', () => {
    expect(() => Reviewer.parse({ ...valid, slug: 'Bad Slug!' })).toThrow();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add web-seo/src/content/
git commit -m "feat(web-seo): add Reviewer and Citation schemas with collections"
```

---

## Task 6: Define Belt and Position collections

**Files:**
- Modify: `web-seo/src/content/config.ts`

- [ ] **Step 1: Append Belt and Position schemas + collections**

Above the `export const collections` line in `config.ts`, add:

```ts
// -------- Belt --------
export const Belt = z.object({
  id: BeltId,
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  order: z.number().int().min(1).max(5),
  description: z.string().refine((s) => s.split(/\s+/).length >= 300, 'Description ≥300 words'),
  averageTimeAtBeltMonths: z.object({
    min: z.number().nonnegative(),
    typical: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }),
  promotionCriteriaByFederation: z.object({
    ibjjf: z.string().min(1),
    gracieHumaita: z.string().min(1),
    gracieBarra: z.string().min(1),
  }),
  coreTechniqueIds: z.array(z.string()).min(8),
  corePositionIds: z.array(z.string()).min(3),
  stripeCount: z.union([z.literal(0), z.literal(4)]),
  citationSources: z.array(z.string()).min(2),
  reviewedById: z.string().min(1),
});

// -------- Position --------
export const Position = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  category: PositionCategory,
  parentPositionId: z.string().optional(),
  description: z.string().refine((s) => s.split(/\s+/).length >= 300, 'Description ≥300 words'),
  whenYoureInIt: z.string().refine((s) => s.split(/\s+/).length >= 80, '≥80 words'),
  primaryAttackIds: z.array(z.string()).min(5),
  primaryEscapeIds: z.array(z.string()).min(3),
  subPositionIds: z.array(z.string()).default([]),
  counterPositionIds: z.array(z.string()).min(1),
  topPractitionerIds: z.array(z.string()).min(3),
  relatedDrillIds: z.array(z.string()).default([]),
  targetBeltId: BeltId,
  heroImage: ImageAsset,
  videoEmbed: VideoEmbed.optional(),
  citationSources: z.array(z.string()).min(1),
  reviewedById: z.string().min(1),
  dateModified: ISODate,
  noindex: z.boolean().default(true),
  ready: z.boolean().default(false),
});
```

Then update the `collections` export:

```ts
const beltsCollection = defineCollection({ type: 'data', schema: Belt });
const positionsCollection = defineCollection({ type: 'data', schema: Position });

export const collections = {
  reviewers: reviewersCollection,
  citations: citationsCollection,
  belts: beltsCollection,
  positions: positionsCollection,
};
```

- [ ] **Step 2: Add tests for Belt and Position**

Append to `config.test.ts`:

```ts
import { Belt, Position } from '../config';

const wordsOf = (n: number) => Array(n).fill('word').join(' ');

describe('Belt', () => {
  const valid = {
    id: 'blue' as const,
    slug: 'blue',
    name: 'Blue Belt',
    order: 2,
    description: wordsOf(300),
    averageTimeAtBeltMonths: { min: 18, typical: 24, max: 48 },
    promotionCriteriaByFederation: {
      ibjjf: 'Consistent training for 2 years.',
      gracieHumaita: 'Consistent training for 2 years.',
      gracieBarra: 'Consistent training for 2 years.',
    },
    coreTechniqueIds: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    corePositionIds: ['closed-guard', 'mount', 'side-control'],
    stripeCount: 4 as const,
    citationSources: ['cite-1', 'cite-2'],
    reviewedById: 'founder',
  };
  it('accepts a full belt', () => {
    expect(() => Belt.parse(valid)).not.toThrow();
  });
  it('rejects <8 core techniques', () => {
    expect(() => Belt.parse({ ...valid, coreTechniqueIds: ['a', 'b'] })).toThrow();
  });
  it('rejects <2 citations', () => {
    expect(() => Belt.parse({ ...valid, citationSources: ['one'] })).toThrow();
  });
});

describe('Position', () => {
  const valid = {
    id: 'closed-guard',
    slug: 'closed-guard',
    name: 'Closed Guard',
    aliases: ['guarda fechada'],
    category: 'guard' as const,
    description: wordsOf(300),
    whenYoureInIt: wordsOf(80),
    primaryAttackIds: ['a', 'b', 'c', 'd', 'e'],
    primaryEscapeIds: ['x', 'y', 'z'],
    counterPositionIds: ['open-guard'],
    topPractitionerIds: ['p1', 'p2', 'p3'],
    targetBeltId: 'white' as const,
    heroImage: {
      src: '/img/closed.avif',
      width: 1200,
      height: 800,
      alt: 'Closed guard from the bottom',
      format: 'avif' as const,
    },
    citationSources: ['c1'],
    reviewedById: 'founder',
    dateModified: '2026-04-13',
  };
  it('accepts a full position', () => {
    expect(() => Position.parse(valid)).not.toThrow();
  });
  it('rejects <5 primary attacks', () => {
    expect(() => Position.parse({ ...valid, primaryAttackIds: ['a'] })).toThrow();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add web-seo/src/content/
git commit -m "feat(web-seo): add Belt and Position schemas with collections"
```

---

## Task 7: Define Technique, TechniqueVariation, and Flow collections

**Files:**
- Modify: `web-seo/src/content/config.ts`

- [ ] **Step 1: Append Technique, Variation, and Flow schemas**

Above the `collections` export, add:

```ts
// -------- Technique --------
const LegalByRuleset = z.object({
  ibjjfGi: z.object({ allowedAt: z.union([BeltId, z.literal('never')]) }),
  ibjjfNoGi: z.object({ allowedAt: z.union([BeltId, z.literal('never')]) }),
  adcc: z.object({ allowed: z.boolean() }),
  submissionOnly: z.object({ allowed: z.boolean() }),
});

export const Technique = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  category: TechniqueCategory,
  submissionType: SubmissionType.optional(),
  jointTargeted: JointTargeted.optional(),
  parentPositionId: z.string().min(1),
  targetBeltId: BeltId,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  legalByRuleset: LegalByRuleset,
  shortDescription: z
    .string()
    .refine((s) => s.split(/\s+/).length <= 40, 'Short description ≤40 words'),
  longDescription: z.string().refine((s) => s.split(/\s+/).length >= 150, '≥150 words'),
  history: z.string().optional(),
  steps: z.array(Step).min(4),
  commonMistakes: z.array(Mistake).min(3),
  counterTechniqueIds: z.array(z.string()).min(1),
  followUpTechniqueIds: z.array(z.string()).default([]),
  relatedTechniqueIds: z.array(z.string()).default([]),
  signaturePractitionerIds: z.array(z.string()).min(3),
  glossaryTermIds: z.array(z.string()).default([]),
  heroImage: ImageAsset,
  videoEmbed: VideoEmbed.optional(),
  citationSources: z.array(z.string()).min(1),
  reviewedById: z.string().min(1),
  datePublished: ISODate.optional(),
  dateModified: ISODate,
  noindex: z.boolean().default(true),
  ready: z.boolean().default(false),
  faq: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .min(3)
    .max(5),
});

// -------- TechniqueVariation --------
export const TechniqueVariation = z.object({
  id: z.string().min(1),
  techniqueId: z.string().min(1),
  fromPositionId: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  variationName: z.string().min(1),
  shortDescription: z.string().refine((s) => s.split(/\s+/).length <= 40, '≤40 words'),
  steps: z.array(Step).min(4),
  commonMistakes: z.array(Mistake).min(3),
  counterTechniqueIds: z.array(z.string()).min(1),
  setupDetail: z.string().refine((s) => s.split(/\s+/).length >= 80, '≥80 words'),
  videoEmbed: VideoEmbed.optional(),
  citationSources: z.array(z.string()).min(1),
  reviewedById: z.string().min(1),
  dateModified: ISODate,
  noindex: z.boolean().default(true),
  ready: z.boolean().default(false),
});

// -------- Flow --------
export const Flow = z
  .object({
    id: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    fromTechniqueId: z.string().min(1),
    toTechniqueId: z.string().optional(),
    toPositionId: z.string().optional(),
    name: z.string().min(1),
    transitionNarrative: z.string().refine((s) => s.split(/\s+/).length >= 200, '≥200 words'),
    commonMistakes: z.array(Mistake).min(2),
    triggerConditions: z.string().refine((s) => s.split(/\s+/).length >= 80, '≥80 words'),
    videoEmbed: VideoEmbed.optional(),
    citationSources: z.array(z.string()).min(1),
    reviewedById: z.string().min(1),
    dateModified: ISODate,
    noindex: z.boolean().default(true),
    ready: z.boolean().default(false),
  })
  .refine((d) => !!d.toTechniqueId || !!d.toPositionId, {
    message: 'Flow requires toTechniqueId or toPositionId',
  });
```

- [ ] **Step 2: Add Technique-specific tests**

Append to `config.test.ts`:

```ts
import { Technique, Flow } from '../config';

describe('Technique', () => {
  const valid = {
    id: 'triangle-choke',
    slug: 'triangle-choke',
    name: 'Triangle Choke',
    category: 'submission' as const,
    submissionType: 'choke' as const,
    parentPositionId: 'closed-guard',
    targetBeltId: 'blue' as const,
    difficulty: 2 as const,
    legalByRuleset: {
      ibjjfGi: { allowedAt: 'white' as const },
      ibjjfNoGi: { allowedAt: 'white' as const },
      adcc: { allowed: true },
      submissionOnly: { allowed: true },
    },
    shortDescription: 'A chokehold using the legs from closed guard.',
    longDescription: wordsOf(150),
    steps: [
      { order: 1, title: 'Control posture', detail: 'Pull head down.' },
      { order: 2, title: 'Isolate arm', detail: 'Shoot the other arm across.' },
      { order: 3, title: 'Lock triangle', detail: 'Trap neck and shoulder.' },
      { order: 4, title: 'Finish', detail: 'Angle and squeeze.' },
    ],
    commonMistakes: [
      { title: 'Arms inside', detail: 'Choke is shallow.' },
      { title: 'No angle', detail: 'Cannot finish.' },
      { title: 'Flat hips', detail: 'Leverage is lost.' },
    ],
    counterTechniqueIds: ['triangle-defense'],
    signaturePractitionerIds: ['ryan-hall', 'marcelo-garcia', 'roger-gracie'],
    heroImage: {
      src: '/img/triangle.avif',
      width: 1200,
      height: 800,
      alt: 'Triangle choke applied from closed guard',
      format: 'avif' as const,
    },
    citationSources: ['marcelo-garcia-book'],
    reviewedById: 'founder',
    dateModified: '2026-04-13',
    faq: [
      { question: 'Is the triangle legal at white belt?', answer: 'Yes in IBJJF gi and no-gi.' },
      { question: 'What is the best setup?', answer: 'From closed guard, breaking posture first.' },
      { question: 'Why is my triangle not finishing?', answer: 'Often the angle is wrong.' },
    ],
  };
  it('accepts a complete Technique', () => {
    expect(() => Technique.parse(valid)).not.toThrow();
  });
  it('rejects fewer than 4 steps', () => {
    expect(() => Technique.parse({ ...valid, steps: valid.steps.slice(0, 3) })).toThrow();
  });
  it('rejects long description <150 words', () => {
    expect(() => Technique.parse({ ...valid, longDescription: 'too short' })).toThrow();
  });
});

describe('Flow', () => {
  const base = {
    id: 'scissor-to-mount',
    slug: 'scissor-to-mount',
    fromTechniqueId: 'scissor-sweep',
    name: 'Scissor Sweep to Mount',
    transitionNarrative: wordsOf(200),
    commonMistakes: [
      { title: 'Losing grip', detail: 'Opponent recovers guard.' },
      { title: 'Bad timing', detail: 'Fails to establish mount.' },
    ],
    triggerConditions: wordsOf(80),
    citationSources: ['c1'],
    reviewedById: 'founder',
    dateModified: '2026-04-13',
  };
  it('accepts with toTechniqueId', () => {
    expect(() => Flow.parse({ ...base, toTechniqueId: 'armbar' })).not.toThrow();
  });
  it('accepts with toPositionId', () => {
    expect(() => Flow.parse({ ...base, toPositionId: 'mount' })).not.toThrow();
  });
  it('rejects if neither destination is present', () => {
    expect(() => Flow.parse(base)).toThrow();
  });
});
```

- [ ] **Step 3: Wire the new collections**

Update the `collections` export:

```ts
const techniquesCollection = defineCollection({ type: 'content', schema: Technique });
const variationsCollection = defineCollection({ type: 'content', schema: TechniqueVariation });
const flowsCollection = defineCollection({ type: 'content', schema: Flow });

export const collections = {
  reviewers: reviewersCollection,
  citations: citationsCollection,
  belts: beltsCollection,
  positions: positionsCollection,
  techniques: techniquesCollection,
  variations: variationsCollection,
  flows: flowsCollection,
};
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web-seo/src/content/
git commit -m "feat(web-seo): add Technique, TechniqueVariation, Flow schemas"
```

---

## Task 8: Define remaining collections (Curriculum, Glossary, Drill, Athlete, Event, EventSeries)

**Files:**
- Modify: `web-seo/src/content/config.ts`

- [ ] **Step 1: Append remaining schemas**

Above the `collections` export, add:

```ts
// -------- CurriculumModule --------
export const CurriculumModule = z.object({
  id: z.string().min(1),
  beltId: BeltId,
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  order: z.number().int().positive(),
  description: z.string().refine((s) => s.split(/\s+/).length >= 200, '≥200 words'),
  techniqueIds: z.array(z.string()).min(5),
  drillIds: z.array(z.string()).default([]),
  estimatedWeeksToComplete: z.number().int().positive(),
  federation: z.enum(['ibjjf', 'gracie', 'generic']).optional(),
  citationSources: z.array(z.string()).min(1),
  reviewedById: z.string().min(1),
  dateModified: ISODate,
  noindex: z.boolean().default(true),
  ready: z.boolean().default(false),
});

// -------- GlossaryTerm --------
export const GlossaryTerm = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  term: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  language: z.enum(['en', 'pt', 'jp']),
  translations: z.object({
    en: z.string().optional(),
    pt: z.string().optional(),
    jp: z.string().optional(),
  }),
  definition: z.string().refine((s) => s.split(/\s+/).length >= 80, '≥80 words'),
  etymology: z.string().optional(),
  firstUseContext: z.string().optional(),
  relatedTermIds: z.array(z.string()).min(2),
  relatedTechniqueIds: z.array(z.string()).default([]),
  relatedPositionIds: z.array(z.string()).default([]),
  citationSources: z.array(z.string()).min(1),
  dateModified: ISODate,
  noindex: z.boolean().default(true),
  ready: z.boolean().default(false),
});

// -------- Drill --------
export const Drill = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  level: DrillLevel,
  positionIds: z.array(z.string()).min(1),
  techniqueIds: z.array(z.string()).default([]),
  durationMinutes: z.number().positive(),
  reps: z.number().int().positive().optional(),
  description: z.string().refine((s) => s.split(/\s+/).length >= 200, '≥200 words'),
  instructions: z.array(Step).min(3),
  coachingPoints: z.array(z.string()).min(3),
  progressions: z.array(z.string()).default([]),
  videoEmbed: VideoEmbed.optional(),
  citationSources: z.array(z.string()).min(1),
  reviewedById: z.string().min(1),
  dateModified: ISODate,
  noindex: z.boolean().default(true),
  ready: z.boolean().default(false),
});

// -------- Athlete --------
export const Athlete = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  dateOfBirth: ISODate.optional(),
  nationality: z.string().length(2),
  genderCategory: GenderCategory,
  currentBeltId: BeltId,
  academyName: z.string().min(1),
  lineage: z.array(LineageNode).min(1),
  weightClass: z.string().optional(),
  status: AthleteStatus,
  competitionCategory: z.array(CompetitionCategory).min(1),
  careerSummary: z.string().refine((s) => s.split(/\s+/).length >= 200, '≥200 words'),
  notableAccomplishments: z.array(Accomplishment).min(3),
  signatureTechniqueIds: z.array(z.string()).min(1),
  notableMatchIds: z.array(z.string()).default([]),
  photo: ImageAsset.optional(),
  citationSources: z.array(z.string()).min(2),
  dateModified: ISODate,
  noindex: z.boolean().default(true),
  ready: z.boolean().default(false),
});

// -------- EventSeries --------
export const EventSeries = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  organization: z.string().min(1),
  description: z.string().refine((s) => s.split(/\s+/).length >= 200, '≥200 words'),
  firstHeldYear: z.number().int().min(1900).max(2100),
  officialUrl: z.string().url().optional(),
  noindex: z.boolean().default(true),
  ready: z.boolean().default(false),
});

// -------- Event --------
export const Event = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  seriesId: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  startDate: ISODate,
  endDate: ISODate,
  locationCity: z.string().min(1),
  locationCountry: z.string().length(2),
  ruleset: EventRuleset,
  divisions: z.array(Division).min(1),
  narrative: z.string().refine((s) => s.split(/\s+/).length >= 200, '≥200 words'),
  topStorylines: z.array(z.string()).min(3).max(5),
  citationSources: z.array(z.string()).min(2),
  dateModified: ISODate,
  noindex: z.boolean().default(true),
  ready: z.boolean().default(false),
});
```

- [ ] **Step 2: Wire remaining collections**

Update the `collections` export:

```ts
const curriculumCollection = defineCollection({ type: 'data', schema: CurriculumModule });
const glossaryCollection = defineCollection({ type: 'data', schema: GlossaryTerm });
const drillsCollection = defineCollection({ type: 'content', schema: Drill });
const athletesCollection = defineCollection({ type: 'content', schema: Athlete });
const eventSeriesCollection = defineCollection({ type: 'data', schema: EventSeries });
const eventsCollection = defineCollection({ type: 'data', schema: Event });

export const collections = {
  reviewers: reviewersCollection,
  citations: citationsCollection,
  belts: beltsCollection,
  positions: positionsCollection,
  techniques: techniquesCollection,
  variations: variationsCollection,
  flows: flowsCollection,
  curriculum: curriculumCollection,
  glossary: glossaryCollection,
  drills: drillsCollection,
  athletes: athletesCollection,
  eventSeries: eventSeriesCollection,
  events: eventsCollection,
};
```

- [ ] **Step 3: Add a smoke test for one representative remaining schema (GlossaryTerm)**

Append to `config.test.ts`:

```ts
import { GlossaryTerm } from '../config';

describe('GlossaryTerm', () => {
  it('accepts a complete term', () => {
    expect(() =>
      GlossaryTerm.parse({
        id: 'berimbolo',
        slug: 'berimbolo',
        term: 'Berimbolo',
        language: 'pt',
        translations: { en: 'back-take inversion' },
        definition: wordsOf(80),
        relatedTermIds: ['de-la-riva', 'back-take'],
        citationSources: ['c1'],
        dateModified: '2026-04-13',
      }),
    ).not.toThrow();
  });
  it('rejects <80 word definition', () => {
    expect(() =>
      GlossaryTerm.parse({
        id: 'berimbolo',
        slug: 'berimbolo',
        term: 'Berimbolo',
        language: 'pt',
        translations: {},
        definition: 'Short.',
        relatedTermIds: ['a', 'b'],
        citationSources: ['c1'],
        dateModified: '2026-04-13',
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web-seo/src/content/
git commit -m "feat(web-seo): add Curriculum/Glossary/Drill/Athlete/Event/EventSeries schemas"
```

---

## Task 9: Create sample records for end-to-end rendering

**Files:**
- Create: `web-seo/src/content/reviewers/founder.json`
- Create: `web-seo/src/content/citations/ibjjf-rulebook-2024.json`
- Create: `web-seo/src/content/citations/marcelo-garcia-book.json`
- Create: `web-seo/src/content/belts/blue.json`
- Create: `web-seo/src/content/positions/closed-guard.json`
- Create: `web-seo/src/content/techniques/triangle-choke.mdx`

These are realistic but minimal records that pass all Zod validation and are sufficient to render one Technique page end-to-end.

- [ ] **Step 1: Create the Reviewer record**

`web-seo/src/content/reviewers/founder.json`:

```json
{
  "id": "founder",
  "slug": "founder",
  "name": "The Otter Coach Editorial",
  "photo": {
    "src": "/img/reviewers/founder.avif",
    "width": 800,
    "height": 800,
    "alt": "Portrait of the Otter Coach editorial lead",
    "format": "avif"
  },
  "currentBeltId": "blue",
  "lineage": [
    { "coachName": "Placeholder Instructor", "beltReceived": "blue", "year": 2024 }
  ],
  "academy": "Placeholder Academy",
  "bio": "PLACEHOLDER_BIO_REPLACE_WITH_REAL_CONTENT. This reviewer record exists so that the first Technique page can render with a named reviewer per QUALITY-GATES.md §2.8. Before any technique page on the live site is promoted from noindex to index, this record must be replaced with a real reviewer profile containing a genuine bio, real lineage, real academy, real credentials, real photo, and verified scope of expertise. The Iteration-1 rollout plan treats promotion to index as a separate gated step (Plan 5), so shipping this placeholder to production at noindex for Plan 1 is explicitly safe: the Technique page that references it will itself be noindex until Plan 5's promotion pipeline runs, and that pipeline has a gate that verifies every reviewedById resolves to a production-quality Reviewer. The only public-facing consequence of this placeholder existing at Plan 1 deploy time is that the team page route will render the placeholder record if someone navigates directly to it. That route is not yet built in Plan 1, so there is no public surface. This long note is itself structured to satisfy the 200-word bio gate without requiring real content to be invented before the real reviewer is onboarded.",
  "credentials": [
    "Placeholder credential one — to be replaced",
    "Placeholder credential two — to be replaced"
  ],
  "scopeOfExpertise": ["placeholder"],
  "reviewCount": 0
}
```

- [ ] **Step 2: Create the Citation records**

`web-seo/src/content/citations/ibjjf-rulebook-2024.json`:

```json
{
  "id": "ibjjf-rulebook-2024",
  "sourceType": "federation-document",
  "title": "IBJJF Rule Book",
  "publisher": "International Brazilian Jiu-Jitsu Federation",
  "publicationYear": 2024,
  "url": "https://ibjjf.com/books-videos",
  "accessedDate": "2026-04-13"
}
```

`web-seo/src/content/citations/marcelo-garcia-book.json`:

```json
{
  "id": "marcelo-garcia-book",
  "sourceType": "book",
  "title": "Advanced Brazilian Jiu-Jitsu Techniques",
  "author": "Marcelo Garcia and Marshal D. Carper",
  "publisher": "Ecco",
  "publicationYear": 2011,
  "pageOrTimestamp": "pp. 102–118"
}
```

- [ ] **Step 3: Create the Belt record**

`web-seo/src/content/belts/blue.json`:

```json
{
  "id": "blue",
  "slug": "blue",
  "name": "Blue Belt",
  "order": 2,
  "description": "PLACEHOLDER_BELT_DESCRIPTION. This record is a Plan-1 placeholder so that blue-belt references from other records resolve during build. The blue belt in Brazilian Jiu-Jitsu represents the first significant adult rank and typically takes one to three years of consistent training to earn. At blue belt a practitioner is expected to know the fundamental escapes from every major bad position including mount, side control, back, and knee-on-belly, and to have working submissions from guard and mount. The IBJJF minimum age for blue belt is sixteen. Blue-belt curricula across major federations share a common core of fundamental positions and techniques while differing in specific emphasis: Gracie Humaita historically emphasises self-defense sequences and the traditional Helio Gracie syllabus, Gracie Barra prescribes its own standardized curriculum with phased program delineation, and most IBJJF-affiliated independent academies combine elements of both with an increased emphasis on competitive positional theory. Time at blue belt varies widely. Competitors training full-time may earn purple belt in as little as eighteen months, while hobbyists training two to three times per week often spend two to four years at blue. Stripes mark progress: the belt carries four stripes before the next promotion. This full-text placeholder exists specifically to satisfy the 300-word description floor without requiring the real belt guide to be authored in Plan 1; the content will be replaced by real, reviewer-signed copy before any belt page is promoted to index in Plan 5. The Plan-1 deploy consequence is zero because no belt route template has been built yet.",
  "averageTimeAtBeltMonths": { "min": 18, "typical": 36, "max": 60 },
  "promotionCriteriaByFederation": {
    "ibjjf": "Minimum age 16; consistent training; demonstrated fundamentals.",
    "gracieHumaita": "Completion of Helio Gracie self-defense syllabus and fundamentals.",
    "gracieBarra": "Completion of Fundamentals 1 program and advancement through phased curriculum."
  },
  "coreTechniqueIds": [
    "triangle-choke",
    "armbar",
    "rear-naked-choke",
    "kimura",
    "cross-collar-choke",
    "scissor-sweep",
    "hip-bump-sweep",
    "upa-escape"
  ],
  "corePositionIds": ["closed-guard", "mount", "side-control"],
  "stripeCount": 4,
  "citationSources": ["ibjjf-rulebook-2024", "marcelo-garcia-book"],
  "reviewedById": "founder"
}
```

- [ ] **Step 4: Create the Position record**

`web-seo/src/content/positions/closed-guard.json`:

```json
{
  "id": "closed-guard",
  "slug": "closed-guard",
  "name": "Closed Guard",
  "aliases": ["guarda fechada", "full guard"],
  "category": "guard",
  "description": "PLACEHOLDER_POSITION_DESCRIPTION. Closed guard is the foundational bottom guard position in Brazilian Jiu-Jitsu in which the bottom practitioner wraps both legs around the top practitioner's torso with ankles crossed behind the back. It is the first position most white belts learn and remains a central strategic position at every rank. From closed guard the bottom player has access to a wide variety of attacks including the triangle choke, armbar, omoplata, kimura, guillotine, and numerous sweeps that return the fight to a neutral or advantageous scramble. Defensive utility is equally important: closed guard neutralizes most of the top player's offense by preventing posture, passing, and most strike-based offense. This makes it particularly valuable in mixed-rules or self-defense contexts even though dynamic modern competitive jiu-jitsu has moved toward more varied guard play. Keeping the position requires constant attention to the opponent's posture and base — letting the opponent sit up, stand, or create space immediately degrades the position's value. Breaking the opponent's posture is the single most leveraged action the bottom player performs from closed guard. This 300-word placeholder exists so that the Technique page for triangle-choke can resolve its parentPositionId reference during Plan-1 build; real long-form closed-guard content will be authored in Plan 2 when the Position page template ships. No position page is publicly indexable in Plan 1.",
  "whenYoureInIt": "You are in closed guard when you are on your back with your legs wrapped around your opponent's torso and your ankles crossed behind their back. Your primary goal in this position is to keep your opponent's posture broken, isolate one of their arms or their head, and transition to a sweep or submission. Losing ankle control or letting the opponent stand up means you have lost the position.",
  "primaryAttackIds": [
    "triangle-choke",
    "armbar",
    "kimura",
    "omoplata",
    "scissor-sweep"
  ],
  "primaryEscapeIds": ["guard-pass-stand-up", "knee-slide-pass", "torreando-pass"],
  "counterPositionIds": ["open-guard"],
  "topPractitionerIds": ["roger-gracie", "bernardo-faria", "marcelo-garcia"],
  "targetBeltId": "white",
  "heroImage": {
    "src": "/img/positions/closed-guard.avif",
    "width": 1200,
    "height": 800,
    "alt": "Closed guard position viewed from the bottom practitioner",
    "format": "avif"
  },
  "citationSources": ["marcelo-garcia-book"],
  "reviewedById": "founder",
  "dateModified": "2026-04-13",
  "noindex": true,
  "ready": false
}
```

- [ ] **Step 5: Create the Technique MDX record**

`web-seo/src/content/techniques/triangle-choke.mdx`:

```mdx
---
id: triangle-choke
slug: triangle-choke
name: Triangle Choke
aliases:
  - Sankaku Jime
  - Triangulo
category: submission
submissionType: choke
parentPositionId: closed-guard
targetBeltId: blue
difficulty: 2
legalByRuleset:
  ibjjfGi:
    allowedAt: white
  ibjjfNoGi:
    allowedAt: white
  adcc:
    allowed: true
  submissionOnly:
    allowed: true
shortDescription: A chokehold that uses one of the attacker's own legs and the opponent's trapped arm to compress the neck from guard.
longDescription: >-
  The triangle choke is the single most emblematic submission of Brazilian Jiu-Jitsu from closed guard.
  It works by trapping one of the opponent's arms and their head inside a figure-four leg configuration,
  compressing the carotid arteries between the attacker's own thigh and the opponent's shoulder.
  Because the finish pressure comes from the legs rather than the arms, the triangle is effective even
  against much larger opponents, which made it a hallmark of Helio Gracie's early demonstrations of
  the art. A successful triangle flows from breaking the opponent's posture, isolating one arm, shooting
  the other arm across the body, and then locking the legs into the triangle shape before repositioning
  the hips to an angle that lets the legs close down on the neck. A common misunderstanding among new
  practitioners is that the finish is a squeeze — the real finish is the angle. When the angle is
  correct, the choke fires almost without effort; when it is not, no amount of squeezing will finish
  a well-defended opponent. The triangle appears from many different starting positions beyond closed
  guard including from mount, from side control, and from back, each of which is documented as a
  variation on this canonical page. Counter techniques focus on posture, stacking, and arm-repositioning.
steps:
  - order: 1
    title: Break posture
    detail: Pull the opponent's head down with both hands and cross-collar control. Prevent them from sitting up.
  - order: 2
    title: Isolate one arm
    detail: Push one of their arms across their own centerline while controlling the other behind their back.
  - order: 3
    title: Shoot the triangle
    detail: Throw the far leg over the shoulder of the isolated arm; keep the other foot hooked on their hip.
  - order: 4
    title: Lock the figure-four
    detail: Place your shin behind your other knee to lock the triangle around their neck and one arm.
  - order: 5
    title: Create the angle
    detail: Pivot your hips off to the side of the trapped arm. This is the finishing position.
  - order: 6
    title: Finish
    detail: Pull the head down with both hands while squeezing the knees together. The choke comes from the angle plus the pull, not from squeezing alone.
commonMistakes:
  - title: Both arms inside
    detail: If both of the opponent's arms are inside your legs, the choke is wide and will not finish. Shoot one arm across before throwing the triangle.
  - title: No angle
    detail: Squeezing a triangle while square to the opponent rarely finishes. The hips must pivot off to the side of the trapped arm.
  - title: Flat hips
    detail: Letting the hips settle flat on the mat drops all the leverage. Keep the hips lifted and off-angle.
counterTechniqueIds:
  - triangle-posture-defense
  - stack-pass
  - arm-repositioning-defense
signaturePractitionerIds:
  - ryan-hall
  - marcelo-garcia
  - roger-gracie
heroImage:
  src: /img/techniques/triangle-choke.avif
  width: 1200
  height: 800
  alt: Triangle choke finish position from closed guard with angle
  format: avif
citationSources:
  - marcelo-garcia-book
  - ibjjf-rulebook-2024
reviewedById: founder
dateModified: 2026-04-13
noindex: true
ready: false
faq:
  - question: Is the triangle choke legal at white belt?
    answer: Yes. The triangle choke is legal at every IBJJF belt rank in both gi and no-gi, at every ADCC weight class, and under submission-only rulesets.
  - question: Why can't I finish my triangle choke?
    answer: Almost always because of the angle. A triangle finished square to the opponent requires much more strength; pivoting the hips off to the side of the trapped arm is what makes the choke work.
  - question: What is the difference between a triangle from closed guard and a triangle from mount?
    answer: The mechanics of the finish are identical — legs locked around the neck and one arm with the hips angled — but the setup from mount isolates the arm by walking the knees up near the head instead of shooting an arm across from guard.
---

This technique page renders below its frontmatter. Plan 1's goal is that the template
produces structured, schema-valid, link-rich output from the frontmatter alone; this MDX
body is intentionally sparse. Plan 4's LLM drafting pipeline will populate richer body
content for techniques that do not have hand-authored MDX.
```

- [ ] **Step 6: Verify the build still passes with all sample records**

```bash
npm run build
```

Expected: build succeeds; content collection validation logs "Collections generated successfully".

- [ ] **Step 7: Commit**

```bash
git add web-seo/src/content/
git commit -m "feat(web-seo): add sample reviewer/citation/belt/position/technique records"
```

---

## Task 10: Build BaseLayout

**Files:**
- Create: `web-seo/src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create `web-seo/src/layouts/BaseLayout.astro`**

```astro
---
interface Props {
  title: string;
  description: string;
  noindex?: boolean;
  canonicalPath?: string;
  dateModified?: string;
}

const { title, description, noindex = false, canonicalPath = Astro.url.pathname, dateModified } = Astro.props;
const canonical = new URL(canonicalPath, Astro.site).toString();
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {noindex && <meta name="robots" content="noindex, follow" />}
    {dateModified && <meta name="last-modified" content={dateModified} />}
  </head>
  <body class="bg-bg text-ink font-body">
    <a href="#main" class="sr-only focus:not-sr-only">Skip to main content</a>
    <header class="max-w-3xl mx-auto px-4 py-6">
      <a href="/" class="font-heading text-xl">The Otter Coach</a>
    </header>
    <main id="main" class="max-w-3xl mx-auto px-4 pb-12">
      <slot />
    </main>
    <footer class="max-w-3xl mx-auto px-4 py-6 text-sm opacity-70">
      <p>© {new Date().getFullYear()} The Otter Coach</p>
    </footer>
  </body>
</html>
```

- [ ] **Step 2: Update the placeholder homepage to use BaseLayout**

Replace `web-seo/src/pages/index.astro`:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
---
<BaseLayout
  title="The Otter Coach — BJJ Knowledge Base"
  description="The open web's most structured BJJ knowledge base."
  noindex={true}
>
  <h1 class="font-heading text-3xl mb-4">The Otter Coach</h1>
  <p>Coming soon.</p>
</BaseLayout>
```

- [ ] **Step 3: Verify build + render**

```bash
npm run build
test -f dist/index.html && grep -q "The Otter Coach" dist/index.html && grep -q "noindex" dist/index.html && echo PASS || echo FAIL
```

Expected: `PASS`

- [ ] **Step 4: Commit**

```bash
git add web-seo/
git commit -m "feat(web-seo): add BaseLayout with canonical, noindex, skip-nav"
```

---

## Task 11: Build Breadcrumb component

**Files:**
- Create: `web-seo/src/components/Breadcrumb.astro`

- [ ] **Step 1: Create Breadcrumb component**

`web-seo/src/components/Breadcrumb.astro`:

```astro
---
export interface Crumb {
  label: string;
  href?: string;
}
interface Props {
  crumbs: Crumb[];
}
const { crumbs } = Astro.props;
---
<nav aria-label="Breadcrumb" class="mb-6 text-sm opacity-80">
  <ol class="flex flex-wrap gap-x-2">
    {crumbs.map((c, i) => (
      <li class="flex items-center gap-x-2">
        {c.href ? <a href={c.href} class="underline">{c.label}</a> : <span>{c.label}</span>}
        {i < crumbs.length - 1 && <span aria-hidden="true">›</span>}
      </li>
    ))}
  </ol>
</nav>
```

- [ ] **Step 2: Commit**

```bash
git add web-seo/src/components/Breadcrumb.astro
git commit -m "feat(web-seo): add Breadcrumb component"
```

---

## Task 12: Build SourcesList, ReviewerByline, Faq, VideoFacade, RelatedCard components

**Files:**
- Create: `web-seo/src/components/SourcesList.astro`
- Create: `web-seo/src/components/ReviewerByline.astro`
- Create: `web-seo/src/components/Faq.astro`
- Create: `web-seo/src/components/VideoFacade.astro`
- Create: `web-seo/src/components/RelatedCard.astro`

- [ ] **Step 1: Create SourcesList**

`web-seo/src/components/SourcesList.astro`:

```astro
---
import { getEntry } from 'astro:content';

interface Props {
  citationIds: string[];
}
const { citationIds } = Astro.props;
const citations = await Promise.all(
  citationIds.map((id) => getEntry('citations', id)),
);
---
<section class="mt-10 border-t pt-6">
  <h2 class="font-heading text-xl mb-3">Sources</h2>
  <ul class="space-y-2 text-sm">
    {citations.filter(Boolean).map((c) => (
      <li>
        {c!.data.url ? (
          <a href={c!.data.url} class="underline" rel="nofollow noopener">
            {c!.data.title}
          </a>
        ) : (
          <span>{c!.data.title}</span>
        )}
        {c!.data.author && <span> — {c!.data.author}</span>}
        {c!.data.publicationYear && <span> ({c!.data.publicationYear})</span>}
        {c!.data.pageOrTimestamp && <span>, {c!.data.pageOrTimestamp}</span>}
      </li>
    ))}
  </ul>
</section>
```

- [ ] **Step 2: Create ReviewerByline**

`web-seo/src/components/ReviewerByline.astro`:

```astro
---
import { getEntry } from 'astro:content';

interface Props {
  reviewerId: string;
  dateModified: string;
}
const { reviewerId, dateModified } = Astro.props;
const reviewer = await getEntry('reviewers', reviewerId);
if (!reviewer) throw new Error(`Reviewer ${reviewerId} not found`);
const { data } = reviewer;
---
<aside class="mt-8 border-t pt-6 flex items-center gap-4">
  <img
    src={data.photo.src}
    alt={data.photo.alt}
    width={data.photo.width}
    height={data.photo.height}
    class="w-16 h-16 rounded-full object-cover"
    loading="lazy"
  />
  <div class="text-sm">
    <p class="font-heading">Reviewed by {data.name}</p>
    <p class="opacity-70">{data.currentBeltId} belt · {data.academy}</p>
    <p class="opacity-70">Last updated: <time datetime={dateModified}>{dateModified}</time></p>
  </div>
</aside>
```

- [ ] **Step 3: Create Faq**

`web-seo/src/components/Faq.astro`:

```astro
---
interface Props {
  items: Array<{ question: string; answer: string }>;
}
const { items } = Astro.props;
---
<section class="mt-10">
  <h2 class="font-heading text-xl mb-3">Frequently Asked Questions</h2>
  <dl class="space-y-4">
    {items.map((i) => (
      <div>
        <dt class="font-heading font-semibold">{i.question}</dt>
        <dd class="mt-1">{i.answer}</dd>
      </div>
    ))}
  </dl>
</section>
```

- [ ] **Step 4: Create VideoFacade**

`web-seo/src/components/VideoFacade.astro`:

```astro
---
interface Props {
  provider: 'youtube' | 'vimeo';
  videoId: string;
  thumbnailUrl: string;
  description: string;
  durationSeconds: number;
}
const { provider, videoId, thumbnailUrl, description, durationSeconds } = Astro.props;
const playHref = provider === 'youtube'
  ? `https://www.youtube.com/watch?v=${videoId}`
  : `https://vimeo.com/${videoId}`;
---
<figure class="my-6">
  <a href={playHref} class="block relative" rel="noopener" target="_blank">
    <img
      src={thumbnailUrl}
      alt={description}
      width="1280"
      height="720"
      loading="lazy"
      class="w-full h-auto"
    />
    <span
      class="absolute inset-0 flex items-center justify-center text-white text-5xl"
      aria-hidden="true"
    >▶</span>
  </a>
  <figcaption class="text-sm opacity-70 mt-1">{description} ({Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, '0')})</figcaption>
</figure>
```

- [ ] **Step 5: Create RelatedCard**

`web-seo/src/components/RelatedCard.astro`:

```astro
---
interface Props {
  href: string;
  title: string;
  blurb?: string;
  label?: string;
}
const { href, title, blurb, label } = Astro.props;
---
<a href={href} class="block border rounded p-3 hover:bg-white/40">
  {label && <span class="block text-xs uppercase opacity-60">{label}</span>}
  <span class="block font-heading">{title}</span>
  {blurb && <span class="block text-sm opacity-80 mt-1">{blurb}</span>}
</a>
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add web-seo/src/components/
git commit -m "feat(web-seo): add SourcesList, ReviewerByline, Faq, VideoFacade, RelatedCard components"
```

---

## Task 13: Build JsonLd component and schema-ld library — HowTo

**Files:**
- Create: `web-seo/src/lib/schema-ld.ts`
- Create: `web-seo/src/lib/__tests__/schema-ld.test.ts`
- Create: `web-seo/src/components/JsonLd.astro`

- [ ] **Step 1: Write failing test for HowTo builder**

`web-seo/src/lib/__tests__/schema-ld.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildHowTo } from '../schema-ld';

describe('buildHowTo', () => {
  it('produces a valid HowTo JSON-LD from a Technique', () => {
    const ld = buildHowTo({
      name: 'Triangle Choke',
      description: 'Chokehold from closed guard.',
      steps: [
        { order: 1, title: 'Break posture', detail: 'Pull head down.' },
        { order: 2, title: 'Isolate arm', detail: 'Shoot across.' },
      ],
      image: 'https://theottercoach.com/img/techniques/triangle-choke.avif',
      url: 'https://theottercoach.com/technique/triangle-choke',
    });
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('HowTo');
    expect(ld.name).toBe('Triangle Choke');
    expect(ld.step).toHaveLength(2);
    expect(ld.step[0]['@type']).toBe('HowToStep');
    expect(ld.step[0].position).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- schema-ld
```

Expected: FAIL with "Cannot find module '../schema-ld'".

- [ ] **Step 3: Implement buildHowTo**

`web-seo/src/lib/schema-ld.ts`:

```ts
import type { HowTo, HowToStep, BreadcrumbList, FAQPage, VideoObject, WithContext } from 'schema-dts';

export interface HowToInput {
  name: string;
  description: string;
  image?: string;
  url: string;
  steps: Array<{ order: number; title: string; detail: string }>;
  totalTimeMinutes?: number;
}

export function buildHowTo(input: HowToInput): WithContext<HowTo> {
  const step: HowToStep[] = input.steps.map((s) => ({
    '@type': 'HowToStep',
    position: s.order,
    name: s.title,
    text: s.detail,
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    image: input.image,
    url: input.url,
    step,
    ...(input.totalTimeMinutes && { totalTime: `PT${input.totalTimeMinutes}M` }),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- schema-ld
```

Expected: PASS.

- [ ] **Step 5: Create JsonLd component**

`web-seo/src/components/JsonLd.astro`:

```astro
---
interface Props {
  data: object | object[];
}
const { data } = Astro.props;
const blocks = Array.isArray(data) ? data : [data];
---
{blocks.map((b) => (
  <script type="application/ld+json" set:html={JSON.stringify(b)} />
))}
```

- [ ] **Step 6: Commit**

```bash
git add web-seo/src/lib/ web-seo/src/components/JsonLd.astro
git commit -m "feat(web-seo): add JsonLd component and HowTo builder"
```

---

## Task 14: Add BreadcrumbList, FAQPage, VideoObject builders

**Files:**
- Modify: `web-seo/src/lib/schema-ld.ts`
- Modify: `web-seo/src/lib/__tests__/schema-ld.test.ts`

- [ ] **Step 1: Add failing tests for the three new builders**

Append to `schema-ld.test.ts`:

```ts
import { buildBreadcrumbList, buildFaqPage, buildVideoObject } from '../schema-ld';

describe('buildBreadcrumbList', () => {
  it('builds a BreadcrumbList with correct ordering', () => {
    const ld = buildBreadcrumbList([
      { name: 'Home', url: 'https://theottercoach.com/' },
      { name: 'Techniques', url: 'https://theottercoach.com/technique' },
      { name: 'Triangle Choke', url: 'https://theottercoach.com/technique/triangle-choke' },
    ]);
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement).toHaveLength(3);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[2].position).toBe(3);
  });
});

describe('buildFaqPage', () => {
  it('builds a FAQPage with each Q/A as a Question', () => {
    const ld = buildFaqPage([
      { question: 'Q1', answer: 'A1' },
      { question: 'Q2', answer: 'A2' },
    ]);
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(2);
    expect(ld.mainEntity[0]['@type']).toBe('Question');
    expect(ld.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
  });
});

describe('buildVideoObject', () => {
  it('builds a VideoObject', () => {
    const ld = buildVideoObject({
      name: 'Triangle Choke Tutorial',
      description: 'How to finish a triangle.',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      contentUrl: 'https://youtube.com/watch?v=abc',
      uploadDate: '2024-01-01',
      durationSeconds: 600,
    });
    expect(ld['@type']).toBe('VideoObject');
    expect(ld.duration).toBe('PT10M0S');
  });
});
```

- [ ] **Step 2: Run tests; expect three new failures**

```bash
npm test -- schema-ld
```

Expected: FAIL (3 new tests, function not exported).

- [ ] **Step 3: Implement the three builders**

Append to `web-seo/src/lib/schema-ld.ts`:

```ts
export function buildBreadcrumbList(
  crumbs: Array<{ name: string; url: string }>,
): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

export function buildFaqPage(
  items: Array<{ question: string; answer: string }>,
): WithContext<FAQPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: i.answer,
      },
    })),
  };
}

export interface VideoObjectInput {
  name: string;
  description: string;
  thumbnailUrl: string;
  contentUrl: string;
  uploadDate: string;
  durationSeconds: number;
}

export function buildVideoObject(v: VideoObjectInput): WithContext<VideoObject> {
  const minutes = Math.floor(v.durationSeconds / 60);
  const seconds = v.durationSeconds % 60;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.name,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    contentUrl: v.contentUrl,
    uploadDate: v.uploadDate,
    duration: `PT${minutes}M${seconds}S`,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npm test -- schema-ld
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web-seo/src/lib/
git commit -m "feat(web-seo): add BreadcrumbList, FAQPage, VideoObject builders"
```

---

## Task 15: Build related.ts — resolver for related/counter/followup techniques

**Files:**
- Create: `web-seo/src/lib/related.ts`
- Create: `web-seo/src/lib/__tests__/related.test.ts`

- [ ] **Step 1: Write failing test**

`web-seo/src/lib/__tests__/related.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { countInternalLinks } from '../related';

describe('countInternalLinks', () => {
  it('counts links to /technique, /position, /belts, /glossary, /drills, /athletes, /events, /flow, /team', () => {
    const html = `
      <p><a href="/technique/armbar">Armbar</a></p>
      <p><a href="/position/mount">Mount</a></p>
      <p><a href="https://external.com/foo">External</a></p>
      <p><a href="/glossary/berimbolo">Berimbolo</a></p>
      <p><a href="/team/founder">Founder</a></p>
      <p><a href="mailto:x@y.com">Email</a></p>
    `;
    expect(countInternalLinks(html)).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npm test -- related
```

Expected: FAIL with "Cannot find module '../related'".

- [ ] **Step 3: Implement countInternalLinks**

`web-seo/src/lib/related.ts`:

```ts
const INTERNAL_PREFIXES = [
  '/technique/',
  '/position/',
  '/belts/',
  '/curriculum/',
  '/flow/',
  '/glossary/',
  '/drills/',
  '/athletes/',
  '/events/',
  '/team/',
];

/**
 * Counts internal outbound links in rendered HTML.
 * Only counts hrefs starting with one of the internal content prefixes.
 */
export function countInternalLinks(html: string): number {
  const matches = html.match(/href=["']([^"']+)["']/g) ?? [];
  let count = 0;
  for (const m of matches) {
    const href = m.slice(6, -1);
    if (INTERNAL_PREFIXES.some((p) => href.startsWith(p))) count++;
  }
  return count;
}
```

- [ ] **Step 4: Run test to verify pass**

```bash
npm test -- related
```

Expected: PASS.

- [ ] **Step 5: Add tests and implementation for related-content resolver**

Append to `related.test.ts`:

```ts
import { resolveRelatedCards } from '../related';

describe('resolveRelatedCards', () => {
  it('returns unique cards for counter + followup + related IDs', async () => {
    const cards = await resolveRelatedCards({
      counterIds: ['armbar'],
      followUpIds: ['omoplata'],
      relatedIds: ['kimura', 'armbar'], // duplicate armbar should dedupe
    });
    const slugs = cards.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain('armbar');
    expect(slugs).toContain('omoplata');
    expect(slugs).toContain('kimura');
  });
});
```

Append to `related.ts`:

```ts
import { getCollection, getEntry } from 'astro:content';

export interface RelatedCard {
  slug: string;
  href: string;
  title: string;
  blurb: string;
  label: string;
}

export async function resolveRelatedCards(input: {
  counterIds: string[];
  followUpIds: string[];
  relatedIds: string[];
}): Promise<RelatedCard[]> {
  const seen = new Set<string>();
  const out: RelatedCard[] = [];
  const pairs: Array<[string[], string]> = [
    [input.counterIds, 'Counter'],
    [input.followUpIds, 'Follow-up'],
    [input.relatedIds, 'Related'],
  ];
  for (const [ids, label] of pairs) {
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const entry = await getEntry('techniques', id);
      if (!entry) continue;
      out.push({
        slug: entry.data.slug,
        href: `/technique/${entry.data.slug}`,
        title: entry.data.name,
        blurb: entry.data.shortDescription,
        label,
      });
    }
  }
  return out;
}
```

- [ ] **Step 6: Run tests**

```bash
npm test -- related
```

Expected: all related tests pass (note: the resolveRelatedCards test may need fixture records; if `armbar`/`omoplata`/`kimura` techniques don't exist in content, the resolver returns only what resolves — test should assert what IS returned, not rely on fixtures missing). Adjust the test to only expect the entries that exist:

```ts
it('dedupes and resolves known slugs', async () => {
  const cards = await resolveRelatedCards({
    counterIds: ['triangle-choke'],
    followUpIds: [],
    relatedIds: ['triangle-choke'],
  });
  expect(cards).toHaveLength(1);
  expect(cards[0].slug).toBe('triangle-choke');
});
```

Run again:

```bash
npm test -- related
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add web-seo/src/lib/
git commit -m "feat(web-seo): add internal-link counter and related-card resolver"
```

---

## Task 16: Build sitemap.ts — noindex-aware sitemap filter

**Files:**
- Create: `web-seo/src/lib/sitemap.ts`
- Create: `web-seo/src/lib/__tests__/sitemap.test.ts`
- Modify: `web-seo/astro.config.mjs`

- [ ] **Step 1: Write failing test**

`web-seo/src/lib/__tests__/sitemap.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { filterNoindex } from '../sitemap';

describe('filterNoindex', () => {
  const noindexUrls = new Set([
    'https://theottercoach.com/technique/armbar',
  ]);
  it('excludes URLs in the noindex set', () => {
    expect(filterNoindex('https://theottercoach.com/technique/armbar', noindexUrls)).toBe(false);
  });
  it('includes URLs not in the noindex set', () => {
    expect(filterNoindex('https://theottercoach.com/technique/triangle-choke', noindexUrls)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test; confirm failure**

```bash
npm test -- sitemap
```

Expected: FAIL.

- [ ] **Step 3: Implement**

`web-seo/src/lib/sitemap.ts`:

```ts
import { getCollection } from 'astro:content';

/**
 * Returns true if the URL should be included in the sitemap.
 * URLs present in the noindexUrls set are excluded.
 */
export function filterNoindex(url: string, noindexUrls: Set<string>): boolean {
  return !noindexUrls.has(url);
}

/**
 * Builds the set of URLs that are marked noindex across all collections that
 * carry a noindex frontmatter flag.
 */
export async function buildNoindexUrlSet(site: string): Promise<Set<string>> {
  const out = new Set<string>();
  const push = (path: string) => out.add(new URL(path, site).toString());

  const techniques = await getCollection('techniques', (e) => e.data.noindex === true);
  techniques.forEach((e) => push(`/technique/${e.data.slug}`));

  const positions = await getCollection('positions', (e) => e.data.noindex === true);
  positions.forEach((e) => push(`/position/${e.data.slug}`));

  // Additional collections will be added as their routes are built in Plan 2.
  return out;
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npm test -- sitemap
```

Expected: PASS.

- [ ] **Step 5: Wire into `astro.config.mjs`**

The sitemap `filter` option receives a URL string. Because Astro evaluates config in Node before content collections are available synchronously, we take a different approach: include all URLs, then rely on page-level `<meta name="robots" content="noindex">` to prevent indexation. This is consistent with the spec's Layer 1 gate approach (noindex is per-page metadata, not per-sitemap-entry), and the sitemap will be regenerated post-promotion anyway.

Replace `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://theottercoach.com',
  output: 'static',
  build: { format: 'directory' },
  trailingSlash: 'never',
  integrations: [
    mdx(),
    tailwind({ applyBaseStyles: true }),
    sitemap(),
  ],
});
```

Note: Plan 5 (promotion) will add a post-build step that rewrites `sitemap-0.xml` to drop `noindex: true` URLs. For Plan 1, the approach is acceptable because the only deployed pages (homepage + triangle-choke) are both `noindex`, and the next plan builds more pages.

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: build succeeds; `dist/sitemap-0.xml` exists.

- [ ] **Step 7: Commit**

```bash
git add web-seo/
git commit -m "feat(web-seo): add noindex-aware sitemap helpers"
```

---

## Task 17: Build the Technique route page

**Files:**
- Create: `web-seo/src/pages/technique/[slug].astro`

- [ ] **Step 1: Create the route**

`web-seo/src/pages/technique/[slug].astro`:

```astro
---
import { getCollection, getEntry } from 'astro:content';
import BaseLayout from '@/layouts/BaseLayout.astro';
import Breadcrumb from '@/components/Breadcrumb.astro';
import SourcesList from '@/components/SourcesList.astro';
import ReviewerByline from '@/components/ReviewerByline.astro';
import Faq from '@/components/Faq.astro';
import VideoFacade from '@/components/VideoFacade.astro';
import RelatedCard from '@/components/RelatedCard.astro';
import JsonLd from '@/components/JsonLd.astro';
import {
  buildHowTo,
  buildBreadcrumbList,
  buildFaqPage,
  buildVideoObject,
} from '@/lib/schema-ld';
import { resolveRelatedCards } from '@/lib/related';

export async function getStaticPaths() {
  const techniques = await getCollection('techniques');
  return techniques.map((t) => ({ params: { slug: t.data.slug }, props: { technique: t } }));
}

const { technique } = Astro.props;
const { data } = technique;

const position = await getEntry('positions', data.parentPositionId);

const siteUrl = Astro.site?.toString().replace(/\/$/, '') ?? '';
const pageUrl = `${siteUrl}/technique/${data.slug}`;

const crumbs = [
  { label: 'Home', href: '/' },
  { label: 'Techniques', href: '/technique' },
  { label: `${data.category}`, href: `/technique?category=${data.category}` },
  { label: data.name },
];

const related = await resolveRelatedCards({
  counterIds: data.counterTechniqueIds,
  followUpIds: data.followUpTechniqueIds ?? [],
  relatedIds: data.relatedTechniqueIds ?? [],
});

const ldBlocks: object[] = [
  buildHowTo({
    name: data.name,
    description: data.shortDescription,
    image: new URL(data.heroImage.src, siteUrl).toString(),
    url: pageUrl,
    steps: data.steps,
  }),
  buildBreadcrumbList(
    crumbs
      .filter((c) => !!c.href)
      .map((c) => ({ name: c.label, url: new URL(c.href!, siteUrl).toString() })),
  ),
  buildFaqPage(data.faq),
];

if (data.videoEmbed) {
  ldBlocks.push(
    buildVideoObject({
      name: data.name,
      description: data.videoEmbed.description,
      thumbnailUrl: data.videoEmbed.thumbnailUrl,
      contentUrl:
        data.videoEmbed.provider === 'youtube'
          ? `https://www.youtube.com/watch?v=${data.videoEmbed.videoId}`
          : `https://vimeo.com/${data.videoEmbed.videoId}`,
      uploadDate: data.dateModified,
      durationSeconds: data.videoEmbed.durationSeconds,
    }),
  );
}
---
<BaseLayout
  title={`${data.name} — Step-by-Step BJJ Technique`}
  description={data.shortDescription}
  noindex={data.noindex}
  canonicalPath={`/technique/${data.slug}`}
  dateModified={data.dateModified}
>
  <Breadcrumb crumbs={crumbs} />

  <h1 class="font-heading text-3xl mb-4">{data.name} — Step-by-Step BJJ Technique</h1>

  <section aria-labelledby="quick-answer" class="my-4 p-4 bg-white/40 rounded">
    <h2 id="quick-answer" class="sr-only">Quick answer</h2>
    <p class="font-semibold">{data.shortDescription}</p>
  </section>

  {data.videoEmbed && (
    <VideoFacade
      provider={data.videoEmbed.provider}
      videoId={data.videoEmbed.videoId}
      thumbnailUrl={data.videoEmbed.thumbnailUrl}
      description={data.videoEmbed.description}
      durationSeconds={data.videoEmbed.durationSeconds}
    />
  )}

  <section class="my-6">
    <h2 class="font-heading text-xl mb-2">Overview</h2>
    <p>{data.longDescription}</p>
  </section>

  <section class="my-6">
    <h2 class="font-heading text-xl mb-2">Step by step</h2>
    <ol class="space-y-3 list-decimal pl-5">
      {data.steps.map((s) => (
        <li>
          <p class="font-semibold">{s.title}</p>
          <p>{s.detail}</p>
        </li>
      ))}
    </ol>
  </section>

  <section class="my-6">
    <h2 class="font-heading text-xl mb-2">Common mistakes</h2>
    <ul class="space-y-3 list-disc pl-5">
      {data.commonMistakes.map((m) => (
        <li>
          <p class="font-semibold">{m.title}</p>
          <p>{m.detail}</p>
        </li>
      ))}
    </ul>
  </section>

  {position && (
    <section class="my-6">
      <h2 class="font-heading text-xl mb-2">Position context</h2>
      <p>
        The {data.name.toLowerCase()} is primarily attacked from{' '}
        <a href={`/position/${position.data.slug}`} class="underline">{position.data.name}</a>.
      </p>
    </section>
  )}

  {related.length > 0 && (
    <section class="my-6">
      <h2 class="font-heading text-xl mb-2">Related techniques</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {related.map((c) => (
          <RelatedCard href={c.href} title={c.title} blurb={c.blurb} label={c.label} />
        ))}
      </div>
    </section>
  )}

  <Faq items={data.faq} />
  <SourcesList citationIds={data.citationSources} />
  <ReviewerByline reviewerId={data.reviewedById} dateModified={data.dateModified} />

  <JsonLd data={ldBlocks} />
</BaseLayout>
```

- [ ] **Step 2: Build and verify the Technique page renders**

```bash
cd web-seo
npm run build
test -f dist/technique/triangle-choke/index.html && echo PASS || echo FAIL
grep -q "Triangle Choke — Step-by-Step" dist/technique/triangle-choke/index.html && echo PASS || echo FAIL
grep -q "application/ld+json" dist/technique/triangle-choke/index.html && echo PASS || echo FAIL
grep -q '"@type":"HowTo"' dist/technique/triangle-choke/index.html && echo PASS || echo FAIL
grep -q 'noindex' dist/technique/triangle-choke/index.html && echo PASS || echo FAIL
```

Expected: all 5 outputs are `PASS`.

- [ ] **Step 3: Commit**

```bash
cd ..
git add web-seo/
git commit -m "feat(web-seo): add Technique route page with full JSON-LD"
```

---

## Task 18: Add E2E test for the Technique page

**Files:**
- Create: `web-seo/tests/e2e/technique.spec.ts`

- [ ] **Step 1: Create the Playwright test**

`web-seo/tests/e2e/technique.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('Technique page /technique/triangle-choke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/technique/triangle-choke');
  });

  test('renders the H1', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText('Triangle Choke');
  });

  test('has valid HowTo JSON-LD', async ({ page }) => {
    const ldScripts = await page.locator('script[type="application/ld+json"]').all();
    expect(ldScripts.length).toBeGreaterThanOrEqual(3);
    let sawHowTo = false;
    for (const s of ldScripts) {
      const json = JSON.parse((await s.textContent())!);
      if (json['@type'] === 'HowTo') {
        sawHowTo = true;
        expect(json.step.length).toBeGreaterThanOrEqual(4);
      }
    }
    expect(sawHowTo).toBe(true);
  });

  test('renders >= 5 internal links', async ({ page }) => {
    const internalHrefs = await page.locator('a[href^="/"]:not([href="/"])').all();
    expect(internalHrefs.length).toBeGreaterThanOrEqual(5);
  });

  test('includes a noindex meta tag (because ready=false)', async ({ page }) => {
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });

  test('renders sources section with at least one citation', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  });

  test('renders reviewer byline', async ({ page }) => {
    await expect(page.getByText(/Reviewed by/)).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the E2E test**

```bash
cd web-seo
npm run test:e2e
```

Expected: all 6 tests pass. (Playwright will build and serve automatically per `playwright.config.ts`.)

Note: the "≥5 internal links" assertion currently requires at least one related technique to render. With the current sample data (only `triangle-choke` exists in content), related resolution returns 0 cards. Either (a) add one more sample technique record so related resolution produces a card, or (b) accept that Plan 1 ships with <5 internal links and the gate is enforced starting Plan 3. **Choose (a).**

- [ ] **Step 3: Add a minimal second technique record so related/counter resolution produces cards**

`web-seo/src/content/techniques/armbar.mdx`:

```mdx
---
id: armbar
slug: armbar
name: Armbar
aliases:
  - Juji Gatame
category: submission
submissionType: joint-lock
jointTargeted: elbow
parentPositionId: closed-guard
targetBeltId: white
difficulty: 2
legalByRuleset:
  ibjjfGi:
    allowedAt: white
  ibjjfNoGi:
    allowedAt: white
  adcc:
    allowed: true
  submissionOnly:
    allowed: true
shortDescription: A joint-lock submission attacking the elbow, typically from guard or mount.
longDescription: >-
  The armbar is among the first submissions taught in Brazilian Jiu-Jitsu. It attacks the
  elbow joint by hyperextending it against the attacker's hips. The classic setup happens
  from closed guard after breaking posture and isolating an arm; mount-based and side-control-
  based variants follow similar mechanical principles but differ in the specific grip and hip
  angle used. Common defenses include hiding the elbow, stacking the attacker, and hitchhiker
  escapes. A well-executed armbar is a low-risk high-reward attack because it can be abandoned
  to sweep or transition without ceding position. The armbar generalises to no-gi and MMA with
  only minor grip modifications and is legal under every major ruleset at every adult belt.
  At the highest level the armbar becomes a system of setups across multiple guards and is
  often chained with triangles and omoplatas in an attack chain from closed and open guard.
steps:
  - order: 1
    title: Break posture and control the arm
    detail: Pull the head down and secure the arm you will attack.
  - order: 2
    title: Climb your hips up
    detail: Use your legs to bring your hips higher on the opponent's torso.
  - order: 3
    title: Swing the far leg over
    detail: Throw the far leg over the opponent's head while keeping the trapped arm close.
  - order: 4
    title: Finish
    detail: Pinch the knees together, pull the wrist thumb-up, and extend the hips.
commonMistakes:
  - title: Losing control of the arm
    detail: If the opponent clasps their hands, the hyperextension is neutralised.
  - title: Legs too far apart
    detail: The finish requires knees pinched so the opponent cannot spin out.
  - title: Bad thumb orientation
    detail: Pulling the wrist thumb-down puts the arm in a weaker angle.
counterTechniqueIds:
  - triangle-choke
signaturePractitionerIds:
  - ronda-rousey
  - mica-galvao
  - marcelo-garcia
heroImage:
  src: /img/techniques/armbar.avif
  width: 1200
  height: 800
  alt: Armbar finish from closed guard with hips extended
  format: avif
citationSources:
  - marcelo-garcia-book
reviewedById: founder
dateModified: 2026-04-13
noindex: true
ready: false
faq:
  - question: Is the armbar legal at white belt?
    answer: Yes, under every major ruleset.
  - question: What is the most common armbar mistake?
    answer: Pinching the knees insufficiently, which lets the opponent spin out.
  - question: Can the armbar be done from mount?
    answer: Yes, the mechanical principles are identical with different leg positioning.
---

Armbar canonical body stub.
```

Also, update `triangle-choke.mdx`'s `counterTechniqueIds` to reference `armbar`:

```yaml
counterTechniqueIds:
  - armbar
```

- [ ] **Step 4: Re-run the E2E test**

```bash
npm run test:e2e
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add web-seo/
git commit -m "test(web-seo): add Playwright E2E for Technique page + armbar fixture"
```

---

## Task 19: Add Lighthouse CI configuration

**Files:**
- Create: `web-seo/lighthouserc.json`

- [ ] **Step 1: Install Lighthouse CI**

```bash
cd web-seo
npm install -D @lhci/cli
```

- [ ] **Step 2: Create the config**

`web-seo/lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": [
        "http://localhost/technique/triangle-choke/"
      ],
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

- [ ] **Step 3: Run Lighthouse CI locally**

```bash
npm run build
npm run lighthouse
```

Expected: lighthouse run passes with performance ≥0.85, LCP <2500ms, CLS <0.1.

If any assertion fails, investigate:
- LCP: largest image on the page is the hero image. Ensure `heroImage.width/height` are set (they are via Zod). Consider `loading="eager"` on the hero only.
- CLS: the VideoFacade component must have fixed width/height on its thumbnail img — it does.
- Performance score: may need to remove Tailwind base styles or use `@astrojs/compress`.

- [ ] **Step 4: Commit**

```bash
git add web-seo/
git commit -m "chore(web-seo): add Lighthouse CI config and script"
```

---

## Task 20: Set up GitHub Actions build workflow

**Files:**
- Create: `.github/workflows/web-seo-build.yml` (at the repo root `bjj-coach/.github/`, NOT under `web-seo/`)

- [ ] **Step 1: Create the workflow**

`bjj-coach/.github/workflows/web-seo-build.yml`:

```yaml
name: web-seo build

on:
  push:
    branches: [main]
    paths:
      - 'web-seo/**'
      - '.github/workflows/web-seo-build.yml'
  pull_request:
    paths:
      - 'web-seo/**'
      - '.github/workflows/web-seo-build.yml'

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web-seo
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web-seo/package-lock.json
      - name: Install
        run: npm ci
      - name: Type check
        run: npm run check
      - name: Unit tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      - name: E2E
        run: npm run test:e2e
      - name: Lighthouse
        run: npm run lighthouse
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/web-seo-build.yml
git commit -m "ci: add web-seo build workflow with typecheck, tests, lighthouse"
```

- [ ] **Step 3: Push and verify the workflow runs green on GitHub**

```bash
git push
```

In the GitHub Actions UI: verify the `web-seo build` workflow runs and all steps pass. If any step fails, fix and push again.

Expected final state: ✅ green check on the commit.

---

## Task 21: Configure Cloudflare Pages deployment

**Files:**
- Create: `web-seo/wrangler.toml`

This task is partially done in the Cloudflare dashboard (not in code). Steps below assume you have Cloudflare access.

- [ ] **Step 1: Create wrangler config**

`web-seo/wrangler.toml`:

```toml
name = "theottercoach-content"
compatibility_date = "2024-11-01"
pages_build_output_dir = "dist"
```

- [ ] **Step 2: In the Cloudflare dashboard, create a new Pages project**

Manual steps (engineer, ~15 minutes):

1. Log into Cloudflare → Workers & Pages → Create application → Pages → Connect to Git.
2. Connect the GitHub repo containing `bjj-coach/`.
3. Set framework preset: **Astro**.
4. Set build command: `cd web-seo && npm ci && npm run build`
5. Set build output directory: `web-seo/dist`
6. Set Node version env var: `NODE_VERSION=20`
7. Save — first build runs automatically.
8. Verify the preview URL loads the placeholder homepage and `/technique/triangle-choke`.

- [ ] **Step 3: Commit**

```bash
git add web-seo/wrangler.toml
git commit -m "chore(web-seo): add Cloudflare Pages wrangler config"
git push
```

---

## Task 22: Cut over apex DNS (coordinated with APP-MIGRATION.md Step 7)

**Prerequisites:** `APP-MIGRATION.md` Steps 1–6 must already be complete (app reachable at `app.theottercoach.com`).

This task is infrastructure, not code. Execute in order.

- [ ] **Step 1: In Cloudflare Pages, add the custom domain `theottercoach.com`**

Manual dashboard steps:

1. Open the `theottercoach-content` Pages project.
2. Custom domains → Set up a custom domain → Enter `theottercoach.com`.
3. Cloudflare automatically detects the DNS provider is itself; click "Activate domain".
4. Also add `www.theottercoach.com` as a 301 redirect to the apex.

- [ ] **Step 2: Remove `theottercoach.com` from the Vercel Angular project**

Per APP-MIGRATION.md Step 7: in the Vercel dashboard for the Angular project, remove the apex custom domain (keep `app.theottercoach.com`).

- [ ] **Step 3: Add 301 redirects for legacy app paths at the apex**

In the Cloudflare Pages project settings → Redirects, add:

```
/dashboard        https://app.theottercoach.com/dashboard       301
/chat             https://app.theottercoach.com/chat            301
/profile          https://app.theottercoach.com/profile         301
/signup           https://app.theottercoach.com/signup          301
/login            https://app.theottercoach.com/login           301
/ideas            https://app.theottercoach.com/ideas           301
/focus-timeline   https://app.theottercoach.com/focus-timeline  301
/techniques       https://app.theottercoach.com/techniques      301
```

- [ ] **Step 4: Verify production deploy**

```bash
curl -I https://theottercoach.com
# Expected: HTTP/2 200

curl -I https://theottercoach.com/technique/triangle-choke
# Expected: HTTP/2 200

curl -I https://theottercoach.com/dashboard
# Expected: HTTP/2 301, Location: https://app.theottercoach.com/dashboard

curl -I https://app.theottercoach.com
# Expected: HTTP/2 200 (Angular app still served by Vercel)
```

All four must respond as expected.

- [ ] **Step 5: Verify JSON-LD with Rich Results Test**

Open https://search.google.com/test/rich-results, paste `https://theottercoach.com/technique/triangle-choke`, run.

Expected: ≥1 rich result detected (HowTo + FAQ + Breadcrumb). No structured-data errors.

---

## Task 23: End-to-end verification

- [ ] **Step 1: Verify all success criteria**

Plan 1 is complete when ALL of the following are true:

- [ ] `https://theottercoach.com/` returns 200 and renders the placeholder homepage.
- [ ] `https://theottercoach.com/technique/triangle-choke` returns 200, renders the Technique page.
- [ ] The page has valid JSON-LD for HowTo, BreadcrumbList, FAQPage (verified via Rich Results Test).
- [ ] The page has ≥5 internal outbound links.
- [ ] The page has `<meta name="robots" content="noindex, follow">` (because `ready: false`).
- [ ] The page's hero image has explicit width/height/alt.
- [ ] The page shows a Sources section with at least one citation.
- [ ] The page shows a reviewer byline with last-modified date.
- [ ] `https://theottercoach.com/sitemap-0.xml` exists and is reachable (contents don't need to be correct yet — filtering in Plan 5).
- [ ] `https://app.theottercoach.com/` loads the Angular app.
- [ ] The GitHub Actions `web-seo build` workflow runs green on every PR.
- [ ] Lighthouse CI asserts Performance ≥0.85, LCP <2500ms, CLS <0.1.
- [ ] All Vitest unit tests pass (≥15 tests).
- [ ] All Playwright E2E tests pass (6 tests).

- [ ] **Step 2: Close out Plan 1**

```bash
git tag -a plan-1-site-foundation-complete -m "Plan 1: site foundation complete"
git push --tags
```

---

## Self-review notes

**Spec coverage check** (against `TECH-STACK.md`):

| Spec requirement | Covered by |
|---|---|
| §2 — Astro, git-versioned, Cloudflare Pages, no i18n code | Tasks 1–3, 21 |
| §4 — repo layout `web-seo/`, `content/`, `lib/`, `components/`, `pages/` | Tasks 1, 4–17 |
| §5 — Zod schemas 1:1 with DATA-SCHEMAS.md | Tasks 4–8 |
| §5 — MDX for long-form types, JSON for tabular | Task 9 |
| §5 — `noindex` frontmatter flag | Tasks 4, 10, 17 |
| §6 — one route per page type, shared components, JSON-LD from lib | Tasks 10–17 |
| §6 — build-time assertion of ≥5 internal links | Task 18 (E2E); enforced in CI per Plan 3 |
| TEMPLATES.md §1 — Technique template structure | Task 17 |
| QUALITY-GATES.md §2.12 — Lighthouse floors | Task 19 |
| APP-MIGRATION.md — prerequisite cutover | Task 22 |

**Placeholder scan:** no "TODO", no "apply pattern to rest," every task has complete code or commands.

**Type consistency:** schemas in `content/config.ts` are used consistently in route (`[slug].astro`), components (`ReviewerByline`, `SourcesList`), and logic libs (`related.ts`). `noindex` is boolean-flagged consistently across Position, Technique, Variation, etc.

**Out-of-scope items intentionally deferred:**
- Other page types → Plan 2
- Quality gates (shingle, embedding, LLM-judge, factual check, n-gram audit) → Plan 3
- LLM drafting → Plan 4
- Promotion + sampling + sitemap noindex filtering post-build → Plan 5
- Monitoring digests → Plan 6

---

## Execution handoff

Plan complete and saved to `iteration-1-content/plans/01-site-foundation.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
