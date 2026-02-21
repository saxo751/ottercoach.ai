/**
 * Enrichment script: finds the best YouTube tutorial for each technique
 * using YouTube Data API + Claude to pick the most relevant result.
 *
 * Searches per individual technique (e.g., "Armbar from Mount" and
 * "Armbar from Closed Guard" get separate, specific videos).
 *
 * Usage:
 *   npx tsx src/scripts/enrichVideos.ts [--batch-size=20] [--category=submission]
 *
 * Requires YOUTUBE_API_KEY in .env
 * YouTube quota: each search costs 100 units, daily limit is 10,000 = ~100 searches/day
 */

import 'dotenv/config';
import { initDatabase } from '../db/database.js';
import { createAIProvider } from '../ai/factory.js';
import type { AIProvider } from '../ai/provider.js';
import type Database from 'better-sqlite3';

// --- Config ---
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const RESULTS_PER_SEARCH = 8;
const DELAY_BETWEEN_SEARCHES_MS = 1200; // be nice to the API

interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
}

interface TechniqueRow {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  starting_position: string;
}

// --- YouTube API ---
async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(RESULTS_PER_SEARCH),
    key: YOUTUBE_API_KEY!,
    relevanceLanguage: 'en',
    videoDuration: 'medium', // 4-20 minutes — ideal tutorial length
  });

  const url = `https://www.googleapis.com/youtube/v3/search?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return (data.items || []).map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
  }));
}

// --- LLM Selection ---
async function pickBestVideo(
  ai: AIProvider,
  technique: TechniqueRow,
  results: YouTubeSearchResult[]
): Promise<string | null> {
  if (results.length === 0) return null;

  const resultsList = results
    .map((r, i) => `[${i + 1}] "${r.title}" by ${r.channelTitle} (${r.videoId})\n    ${r.description.slice(0, 150)}`)
    .join('\n\n');

  const systemPrompt = `You are a BJJ technique video curator. Your job is to pick the single best instructional YouTube video for a SPECIFIC BJJ technique from a SPECIFIC position. Prefer videos that:
- Are actual technique tutorials/breakdowns (not highlights, compilations, or vlogs)
- Come from known BJJ instructors or reputable channels (e.g., Bernardo Faria, Lachlan Giles, John Danaher, Chewjitsu, BJJ Fanatics, Keenan Online, B-Team, Knight Jiu-Jitsu, The Grappling Academy, Stephan Kesting)
- Specifically teach the technique FROM THE CORRECT STARTING POSITION — this is critical
- Have clear titles that match what we're looking for

IMPORTANT: The starting position matters. "Armbar from Mount" is a completely different technique than "Armbar from Closed Guard". Pick a video that teaches the technique from the correct position.

If NONE of the results are a good match, respond with just: NONE`;

  const userMessage = `Pick the best tutorial video for:
- Technique: "${technique.subcategory}"
- Starting position: "${technique.starting_position}"
- Full name: "${technique.name}"
- Category: ${technique.category}

Search results:
${resultsList}

Respond with ONLY the video ID (e.g., "dQw4w9WgXcQ") of the best match, or "NONE" if nothing fits.`;

  const response = await ai.sendMessage(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { temperature: 0, maxTokens: 50 }
  );

  const cleaned = response.trim();
  if (cleaned === 'NONE' || cleaned.length < 5) return null;

  // Extract just the video ID (11 chars, alphanumeric + _ + -)
  const match = cleaned.match(/[a-zA-Z0-9_-]{11}/);
  return match ? match[0] : null;
}

// --- Main ---
async function main() {
  if (!YOUTUBE_API_KEY) {
    console.error('Missing YOUTUBE_API_KEY in .env');
    console.error('Get one free at: https://console.cloud.google.com/apis/credentials');
    console.error('Enable "YouTube Data API v3" in the API library first.');
    process.exit(1);
  }

  // Parse CLI args
  const args = process.argv.slice(2);
  let batchSize = 20;
  let categoryFilter: string | null = null;

  for (const arg of args) {
    if (arg.startsWith('--batch-size=')) batchSize = parseInt(arg.split('=')[1]);
    if (arg.startsWith('--category=')) categoryFilter = arg.split('=')[1];
  }

  const db = initDatabase();
  const ai = createAIProvider();

  // Get individual techniques that don't have curated videos yet
  let query = `
    SELECT id, name, category, subcategory, starting_position
    FROM technique_library
    WHERE youtube_url IS NULL
  `;
  const queryParams: string[] = [];
  if (categoryFilter) {
    query += ' AND category = ?';
    queryParams.push(categoryFilter);
  }
  query += ' ORDER BY category, subcategory, starting_position';

  const techniques = (queryParams.length > 0
    ? db.prepare(query).all(...queryParams)
    : db.prepare(query).all()) as TechniqueRow[];

  const batch = techniques.slice(0, batchSize);

  console.log(`Found ${techniques.length} techniques without curated videos`);
  console.log(`Processing batch of ${batch.length} (quota cost: ~${batch.length * 100} units)\n`);

  const updateStmt = db.prepare('UPDATE technique_library SET youtube_url = ? WHERE id = ?');
  let enriched = 0;
  let skipped = 0;

  for (let i = 0; i < batch.length; i++) {
    const technique = batch[i];
    // Include position in search for specific results
    const searchQuery = `bjj ${technique.subcategory} from ${technique.starting_position} tutorial`;

    process.stdout.write(`[${i + 1}/${batch.length}] "${technique.name}"... `);

    try {
      const results = await searchYouTube(searchQuery);

      if (results.length === 0) {
        console.log('no YouTube results');
        skipped++;
        continue;
      }

      const videoId = await pickBestVideo(ai, technique, results);

      if (!videoId) {
        console.log('LLM found no good match');
        skipped++;
      } else {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        updateStmt.run(youtubeUrl, technique.id);
        console.log(`✓ ${youtubeUrl}`);
        enriched++;
      }
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`);
      if (err.message.includes('403') || err.message.includes('quota')) {
        console.error('\nYouTube API quota exceeded. Run again tomorrow.');
        break;
      }
    }

    // Rate limit
    if (i < batch.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_SEARCHES_MS));
    }
  }

  const totalCurated = (db.prepare('SELECT COUNT(*) as c FROM technique_library WHERE youtube_url IS NOT NULL').get() as any).c;

  console.log(`\n--- Done ---`);
  console.log(`Enriched: ${enriched} techniques`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total techniques with curated videos: ${totalCurated}/351`);

  db.close();
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
