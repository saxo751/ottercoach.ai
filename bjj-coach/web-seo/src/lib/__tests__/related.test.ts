import { describe, it, expect } from 'vitest';
import { countInternalLinks, resolveRelatedCards } from '../related';

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

  it('returns 0 when no internal links are present', () => {
    expect(countInternalLinks('<p>no links</p>')).toBe(0);
  });
});

describe('resolveRelatedCards', () => {
  it('returns empty array when content collection is empty (unit-test shim)', async () => {
    const cards = await resolveRelatedCards({
      counterIds: ['armbar'],
      followUpIds: ['omoplata'],
      relatedIds: ['kimura', 'armbar'],
    });
    expect(cards).toEqual([]);
  });
});
