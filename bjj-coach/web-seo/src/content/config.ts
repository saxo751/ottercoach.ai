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

// -------- Astro collections --------
const reviewersCollection = defineCollection({
  type: 'data',
  schema: Reviewer,
});

const citationsCollection = defineCollection({
  type: 'data',
  schema: Citation,
});

const beltsCollection = defineCollection({ type: 'data', schema: Belt });
const positionsCollection = defineCollection({ type: 'data', schema: Position });
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
