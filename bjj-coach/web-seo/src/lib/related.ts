import { getEntry } from 'astro:content';

const INTERNAL_PREFIXES = [
  '/technique/',
  '/position/',
  '/belts/',
  '/curriculum/',
  '/flow/',
  '/glossary/',
  '/drills/',
  '/athletes/',
  '/events/',
  '/team/',
];

/**
 * Counts internal outbound links in rendered HTML.
 * Only counts hrefs starting with one of the internal content prefixes.
 */
export function countInternalLinks(html: string): number {
  const matches = html.match(/href=["']([^"']+)["']/g) ?? [];
  let count = 0;
  for (const m of matches) {
    const href = m.slice(6, -1);
    if (INTERNAL_PREFIXES.some((p) => href.startsWith(p))) count++;
  }
  return count;
}

export interface RelatedCard {
  slug: string;
  href: string;
  title: string;
  blurb: string;
  label: string;
}

export async function resolveRelatedCards(input: {
  counterIds: string[];
  followUpIds: string[];
  relatedIds: string[];
}): Promise<RelatedCard[]> {
  const seen = new Set<string>();
  const out: RelatedCard[] = [];
  const pairs: Array<[string[], string]> = [
    [input.counterIds, 'Counter'],
    [input.followUpIds, 'Follow-up'],
    [input.relatedIds, 'Related'],
  ];
  for (const [ids, label] of pairs) {
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const entry = await getEntry('techniques', id);
      if (!entry) continue;
      const slug = (entry as any).slug ?? id;
      out.push({
        slug,
        href: `/technique/${slug}`,
        title: entry.data.name,
        blurb: entry.data.shortDescription,
        label,
      });
    }
  }
  return out;
}
