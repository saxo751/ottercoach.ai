/**
 * Generates step-by-step bullet point descriptions for each technique
 * in the technique library using Claude.
 *
 * Batches multiple techniques per LLM call to minimize API usage.
 *
 * Usage:
 *   npx tsx src/scripts/generateDescriptions.ts [--batch-size=10] [--category=submission] [--overwrite]
 *
 * Options:
 *   --batch-size=N    Number of techniques per LLM call (default: 10)
 *   --category=X      Only process techniques in this category
 *   --overwrite       Re-generate descriptions even if one already exists
 */

import 'dotenv/config';
import { initDatabase } from '../db/database.js';
import { runMigrations } from '../db/migrations.js';
import { createAIProvider } from '../ai/factory.js';
import type { AIProvider } from '../ai/provider.js';
import type Database from 'better-sqlite3';

const DELAY_BETWEEN_CALLS_MS = 500;

interface TechniqueRow {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  starting_position: string;
}

interface DescriptionResult {
  id: number;
  description: string;
}

async function generateBatch(
  ai: AIProvider,
  techniques: TechniqueRow[]
): Promise<DescriptionResult[]> {
  const techniqueList = techniques
    .map((t, i) => `[${i + 1}] ID=${t.id} | "${t.name}" | Category: ${t.category} | Subcategory: ${t.subcategory} | Starting position: ${t.starting_position}`)
    .join('\n');

  const systemPrompt = `You are a knowledgeable BJJ (Brazilian Jiu-Jitsu) instructor writing concise step-by-step descriptions of techniques.

For each technique you are given, write a short description as bullet points (using "- " prefix). Each description should:
- Have 3-6 bullet points covering the key steps to execute the technique
- Be written as clear, actionable instructions (e.g., "Control their wrist with your left hand")
- Mention the starting position context in the first bullet
- Include important details like grips, weight distribution, and common finishing mechanics
- Be accurate to how the technique is actually performed in BJJ
- Use standard BJJ terminology

Respond with ONLY valid JSON — an array of objects with "id" (the technique ID) and "description" (the bullet points as a single string with newlines between bullets).

Example response format:
[
  {
    "id": 1,
    "description": "- From mount, isolate their arm by pinning their wrist to the mat\\n- Slide your hand under their elbow and grip your own wrist (figure-four grip)\\n- Keep your head low and squeeze your elbows together\\n- Slowly lift their elbow while keeping their wrist pinned to apply the shoulder lock"
  }
]`;

  const userMessage = `Generate step-by-step descriptions for these ${techniques.length} BJJ techniques:\n\n${techniqueList}`;

  const response = await ai.sendMessage(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { temperature: 0.3, maxTokens: 4096 }
  );

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = response.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr) as DescriptionResult[];
    return parsed;
  } catch {
    console.error('  Failed to parse LLM response as JSON. Raw response:');
    console.error(jsonStr.slice(0, 500));
    return [];
  }
}

async function main() {
  // Parse CLI args
  const args = process.argv.slice(2);
  let batchSize = 10;
  let categoryFilter: string | null = null;
  let overwrite = false;

  for (const arg of args) {
    if (arg.startsWith('--batch-size=')) batchSize = parseInt(arg.split('=')[1]);
    if (arg.startsWith('--category=')) categoryFilter = arg.split('=')[1];
    if (arg === '--overwrite') overwrite = true;
  }

  const db = initDatabase();
  runMigrations(db);

  const ai = createAIProvider();

  // Get techniques that need descriptions
  let query = `
    SELECT id, name, category, subcategory, starting_position
    FROM technique_library
  `;
  const conditions: string[] = [];
  const queryParams: string[] = [];

  if (!overwrite) {
    conditions.push('description IS NULL');
  }
  if (categoryFilter) {
    conditions.push('category = ?');
    queryParams.push(categoryFilter);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY category, subcategory, starting_position';

  const techniques = (queryParams.length > 0
    ? db.prepare(query).all(...queryParams)
    : db.prepare(query).all()) as TechniqueRow[];

  if (techniques.length === 0) {
    console.log('All techniques already have descriptions. Use --overwrite to regenerate.');
    db.close();
    return;
  }

  console.log(`Found ${techniques.length} techniques needing descriptions`);
  console.log(`Processing in batches of ${batchSize} (${Math.ceil(techniques.length / batchSize)} LLM calls)\n`);

  const updateStmt = db.prepare('UPDATE technique_library SET description = ? WHERE id = ?');
  let generated = 0;
  let failed = 0;

  for (let i = 0; i < techniques.length; i += batchSize) {
    const batch = techniques.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(techniques.length / batchSize);

    process.stdout.write(`[Batch ${batchNum}/${totalBatches}] ${batch.length} techniques (${batch[0].category})... `);

    try {
      const results = await generateBatch(ai, batch);

      // Update DB in a transaction
      const transaction = db.transaction(() => {
        for (const result of results) {
          if (result.id && result.description) {
            updateStmt.run(result.description, result.id);
            generated++;
          }
        }
      });
      transaction();

      console.log(`✓ ${results.length} descriptions generated`);
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`);
      failed += batch.length;

      if (err.message.includes('rate') || err.message.includes('429')) {
        console.error('\nRate limited. Waiting 30 seconds...');
        await new Promise((r) => setTimeout(r, 30000));
        // Retry this batch
        i -= batchSize;
        failed -= batch.length;
        continue;
      }
    }

    // Small delay between calls
    if (i + batchSize < techniques.length) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_CALLS_MS));
    }
  }

  const totalWithDesc = (db.prepare('SELECT COUNT(*) as c FROM technique_library WHERE description IS NOT NULL').get() as any).c;
  const total = (db.prepare('SELECT COUNT(*) as c FROM technique_library').get() as any).c;

  console.log(`\n--- Done ---`);
  console.log(`Generated: ${generated} descriptions`);
  console.log(`Failed: ${failed}`);
  console.log(`Total with descriptions: ${totalWithDesc}/${total}`);

  db.close();
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
