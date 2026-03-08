import type Database from 'better-sqlite3';
import type { Technique, FocusPeriod, LibraryTechnique } from '../../db/types.js';
import { findMatchingLibraryTechniques, searchLibrary } from '../../db/queries/techniqueLibrary.js';

/**
 * Collect technique names from user's known techniques and active focus period.
 */
export function collectTechniqueNames(techniques: Technique[], activeFocus?: FocusPeriod): string[] {
  const names = new Set<string>();

  for (const t of techniques) {
    names.add(t.name);
  }

  if (activeFocus?.focus_techniques) {
    try {
      const focusTechs = JSON.parse(activeFocus.focus_techniques);
      if (Array.isArray(focusTechs)) {
        for (const name of focusTechs) {
          if (typeof name === 'string') names.add(name);
        }
      }
    } catch {}
  }

  return Array.from(names);
}

// Common BJJ stop words to filter out when searching the library from user messages
const STOP_WORDS = new Set([
  'how', 'do', 'i', 'a', 'the', 'to', 'is', 'it', 'in', 'on', 'and', 'or', 'of', 'for',
  'what', 'can', 'you', 'my', 'me', 'from', 'with', 'this', 'that', 'an', 'at', 'by',
  'should', 'would', 'could', 'about', 'any', 'some', 'tell', 'show', 'explain', 'help',
  'work', 'works', 'working', 'get', 'getting', 'got', 'been', 'being', 'have', 'has',
  'just', 'really', 'very', 'when', 'where', 'why', 'there', 'here', 'also', 'like',
  'want', 'need', 'trying', 'try', 'did', 'does', 'doing', 'was', 'were', 'are', 'am',
]);

/**
 * Extract BJJ-relevant keywords from a user message for library search.
 * Filters out common stop words and short words.
 */
function extractSearchTerms(message: string): string {
  const words = message.toLowerCase().replace(/[?!.,;:'"]/g, '').split(/\s+/);
  const meaningful = words.filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return meaningful.join(' ');
}

/**
 * Look up technique library entries with YouTube URLs / descriptions
 * that match the user's known techniques, focus period, and current message.
 */
export function getLibraryMatchesForUser(
  db: Database.Database,
  techniques: Technique[],
  activeFocus?: FocusPeriod,
  userMessage?: string
): LibraryTechnique[] {
  const matched = new Map<number, LibraryTechnique>();

  // Match against user's known techniques + focus period
  const names = collectTechniqueNames(techniques, activeFocus);
  for (const lib of findMatchingLibraryTechniques(db, names)) {
    matched.set(lib.id, lib);
  }

  // Also search the library based on the user's current message
  if (userMessage) {
    const searchTerms = extractSearchTerms(userMessage);
    if (searchTerms) {
      const messageMatches = searchLibrary(db, searchTerms);
      // Only include entries with youtube_url or description, cap at 5 from message search
      let added = 0;
      for (const lib of messageMatches) {
        if (added >= 5) break;
        if (matched.has(lib.id)) continue;
        if ((lib.youtube_url && lib.youtube_url !== 'NONE') || lib.description) {
          matched.set(lib.id, lib);
          added++;
        }
      }
    }
  }

  return Array.from(matched.values());
}
