#!/usr/bin/env node
/**
 * Generate hero images for technique pages via fal.ai nano-banana.
 *
 * Usage:
 *   FAL_KEY=xxx npm run gen:images                 # generate missing images for all techniques
 *   FAL_KEY=xxx npm run gen:images -- --slug=armbar
 *   FAL_KEY=xxx npm run gen:images -- --force      # regenerate all
 *
 * Output: public/img/techniques/<slug>.webp (1200x800)
 *
 * Style: passes the existing otter mascot as a reference image so generated
 * images match the brand character instead of being random AI interpretations.
 */

import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';
import { buildTechniquePrompt } from './lib/prompt-template.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TECHNIQUES_DIR = join(ROOT, 'src/content/techniques');
const OUT_DIR = join(ROOT, 'public/img/techniques');

// Public URL for style-reference image. Used as fal.ai nano-banana edit input
// so generated characters match the existing otter mascot instead of inventing
// a new one each call.
const REFERENCE_IMAGE_URL = 'https://ottercoach-ai.pages.dev/otters/reference-stance.png';

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error('ERROR: FAL_KEY env var is required.');
  console.error('Get one at https://fal.ai/dashboard/keys and run:');
  console.error('  FAL_KEY=xxx npm run gen:images');
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const slugArg = [...args].find((a) => a.startsWith('--slug='))?.split('=')[1];

function exists(path) {
  return access(path).then(() => true).catch(() => false);
}

async function loadTechniques() {
  const files = (await readdir(TECHNIQUES_DIR)).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
  const records = [];
  for (const file of files) {
    const slug = file.replace(/\.(mdx|md)$/, '');
    if (slugArg && slug !== slugArg) continue;
    const raw = await readFile(join(TECHNIQUES_DIR, file), 'utf8');
    const { data } = matter(raw);
    records.push({ slug, data });
  }
  return records;
}

async function callFalNanoBanana(prompt, referenceUrl) {
  const response = await fetch('https://fal.run/fal-ai/nano-banana/edit', {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_urls: [referenceUrl],
      num_images: 1,
      output_format: 'jpeg',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`fal.ai error ${response.status}: ${text}`);
  }

  const json = await response.json();
  const imageUrl = json.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error(`fal.ai returned no image. Response: ${JSON.stringify(json).slice(0, 500)}`);
  }
  return imageUrl;
}

async function downloadAndOptimize(imageUrl, outPath) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${imageUrl}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf)
    .resize(1200, 800, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile(outPath);
}

async function main() {
  const records = await loadTechniques();
  if (records.length === 0) {
    console.log('No techniques matched.');
    return;
  }
  console.log(`Found ${records.length} technique(s). Output dir: ${OUT_DIR}`);
  console.log(`Reference image: ${REFERENCE_IMAGE_URL}`);
  console.log();

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const { slug, data } of records) {
    const outPath = join(OUT_DIR, `${slug}.webp`);
    if (!force && (await exists(outPath))) {
      console.log(`SKIP  ${slug}  (already exists — use --force to overwrite)`);
      skipped++;
      continue;
    }

    const prompt = buildTechniquePrompt({ ...data, slug });
    console.log(`GEN   ${slug}`);
    console.log(`      prompt: ${prompt.replace(/\n/g, ' ').slice(0, 220)}...`);
    try {
      const imageUrl = await callFalNanoBanana(prompt, REFERENCE_IMAGE_URL);
      await downloadAndOptimize(imageUrl, outPath);
      console.log(`OK    ${slug}  →  ${outPath}`);
      generated++;
    } catch (err) {
      console.error(`FAIL  ${slug}: ${err.message}`);
      failed++;
    }
    // small breather between API calls
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log();
  console.log(`Summary: ${generated} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
