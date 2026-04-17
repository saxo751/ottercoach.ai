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
