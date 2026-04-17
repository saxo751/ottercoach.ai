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
