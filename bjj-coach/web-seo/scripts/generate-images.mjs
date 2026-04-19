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
import { pickReference } from './lib/reference-map.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TECHNIQUES_DIR = join(ROOT, 'src/content/techniques');
const OUT_DIR = join(ROOT, 'public/img/techniques');

// Style-reference image passed to fal.ai so generated characters match the
// existing otter mascot. The default is selected per technique via pickReference()
// so pose-specific references (e.g. the armbar reference) anchor better results.
// Override globally by setting REFERENCE_IMAGE env var to a URL or local path.

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
const candidatesArg = [...args].find((a) => a.startsWith('--candidates='))?.split('=')[1];
const candidates = Math.max(1, Math.min(5, Number.parseInt(candidatesArg ?? '1', 10) || 1));

function exists(path) {
  return access(path).then(() => true).catch(() => false);
}

async function resolveReferenceImage(urlOrPath) {
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }
  const abs = urlOrPath.startsWith('/') ? urlOrPath : join(ROOT, urlOrPath);
  const buf = await readFile(abs);
  const ext = abs.toLowerCase().endsWith('.jpg') || abs.toLowerCase().endsWith('.jpeg') ? 'jpeg' : 'png';
  return `data:image/${ext};base64,${buf.toString('base64')}`;
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
  console.log(`Candidates per technique: ${candidates}`);
  console.log();
  const globalReferenceOverride = process.env.REFERENCE_IMAGE;

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const { slug, data } of records) {
    const primaryPath = join(OUT_DIR, `${slug}.webp`);
    if (!force && candidates === 1 && (await exists(primaryPath))) {
      console.log(`SKIP  ${slug}  (already exists — use --force to overwrite)`);
      skipped++;
      continue;
    }

    const referencePath = globalReferenceOverride ?? pickReference({ slug, category: data.category });
    const referenceInput = await resolveReferenceImage(referencePath);
    const prompt = buildTechniquePrompt({ ...data, slug });
    console.log(`GEN   ${slug}  (reference: ${referencePath})`);
    console.log(`      prompt: ${prompt.replace(/\n/g, ' ').slice(0, 200)}...`);

    for (let i = 1; i <= candidates; i++) {
      const outPath = candidates === 1
        ? primaryPath
        : join(OUT_DIR, `${slug}-c${i}.webp`);
      try {
        const imageUrl = await callFalNanoBanana(prompt, referenceInput);
        await downloadAndOptimize(imageUrl, outPath);
        console.log(`OK    ${slug}${candidates > 1 ? ` [${i}/${candidates}]` : ''}  →  ${outPath}`);
        generated++;
      } catch (err) {
        console.error(`FAIL  ${slug}${candidates > 1 ? ` [${i}/${candidates}]` : ''}: ${err.message}`);
        failed++;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log();
  console.log(`Summary: ${generated} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
