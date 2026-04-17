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
