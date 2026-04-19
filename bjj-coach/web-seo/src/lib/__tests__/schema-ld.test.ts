import { describe, it, expect } from 'vitest';
import { buildHowTo, buildBreadcrumbList, buildFaqPage, buildVideoObject } from '../schema-ld';

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
    expect((ld.step as any)[0]['@type']).toBe('HowToStep');
    expect((ld.step as any)[0].position).toBe(1);
  });
});

describe('buildBreadcrumbList', () => {
  it('builds a BreadcrumbList with correct ordering', () => {
    const ld = buildBreadcrumbList([
      { name: 'Home', url: 'https://theottercoach.com/' },
      { name: 'Techniques', url: 'https://theottercoach.com/technique' },
      { name: 'Triangle Choke', url: 'https://theottercoach.com/technique/triangle-choke' },
    ]);
    expect(ld['@type']).toBe('BreadcrumbList');
    expect((ld.itemListElement as any)).toHaveLength(3);
    expect((ld.itemListElement as any)[0].position).toBe(1);
    expect((ld.itemListElement as any)[2].position).toBe(3);
  });
});

describe('buildFaqPage', () => {
  it('builds a FAQPage with each Q/A as a Question', () => {
    const ld = buildFaqPage([
      { question: 'Q1', answer: 'A1' },
      { question: 'Q2', answer: 'A2' },
    ]);
    expect(ld['@type']).toBe('FAQPage');
    expect((ld.mainEntity as any)).toHaveLength(2);
    expect((ld.mainEntity as any)[0]['@type']).toBe('Question');
    expect((ld.mainEntity as any)[0].acceptedAnswer['@type']).toBe('Answer');
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
