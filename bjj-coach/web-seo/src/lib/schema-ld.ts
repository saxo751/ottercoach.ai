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
