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
    expect((ld.step as any)[0]['@type']).toBe('HowToStep');
    expect((ld.step as any)[0].position).toBe(1);
  });
});
