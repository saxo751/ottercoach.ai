import { DATA_DELIMITER } from '../utils/constants.js';

export interface ParsedResponse {
  text: string;
  data: Record<string, unknown> | null;
}

/**
 * Splits an AI response on the ---DATA--- delimiter.
 * Everything before is the user-facing text.
 * Everything after is JSON data for the system to process.
 */
export function parseAIResponse(raw: string): ParsedResponse {
  const idx = raw.indexOf(DATA_DELIMITER);
  if (idx === -1) {
    return { text: raw.trim(), data: null };
  }

  const text = raw.slice(0, idx).trim();
  const jsonStr = raw.slice(idx + DATA_DELIMITER.length).trim();

  try {
    const data = JSON.parse(jsonStr);
    return { text, data };
  } catch {
    console.warn('[parser] Failed to parse DATA block:', jsonStr.slice(0, 200));
    return { text, data: null };
  }
}
