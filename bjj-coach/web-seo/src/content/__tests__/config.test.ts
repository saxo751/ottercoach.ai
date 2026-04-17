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
