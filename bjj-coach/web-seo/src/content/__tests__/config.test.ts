import { describe, it, expect } from 'vitest';
import { ImageAsset, ISODate, Step, Mistake, BeltId, Reviewer, Citation, Belt, Position } from '../config';

const wordsOf = (n: number) => Array(n).fill('word').join(' ');

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
