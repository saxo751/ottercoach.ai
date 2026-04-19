import { getCollection } from 'astro:content';

/**
 * Returns true if the URL should be included in the sitemap.
 * URLs present in the noindexUrls set are excluded.
 */
export function filterNoindex(url: string, noindexUrls: Set<string>): boolean {
  return !noindexUrls.has(url);
}

/**
 * Builds the set of URLs that are marked noindex across all collections that
 * carry a noindex frontmatter flag.
 */
export async function buildNoindexUrlSet(site: string): Promise<Set<string>> {
  const out = new Set<string>();
  const push = (path: string) => out.add(new URL(path, site).toString());

  const techniques = await getCollection('techniques', (e: any) => e.data.noindex === true);
  (techniques as any[]).forEach((e) => push(`/technique/${e.data.slug}`));

  const positions = await getCollection('positions', (e: any) => e.data.noindex === true);
  (positions as any[]).forEach((e) => push(`/position/${e.data.slug}`));

  // Additional collections will be added as their routes are built in Plan 2.
  return out;
}
