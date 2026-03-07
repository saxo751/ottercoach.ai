/**
 * Export/import enriched technique_library data (descriptions, YouTube URLs)
 * so it can be migrated from dev to production.
 *
 * Usage:
 *   npx tsx src/scripts/migrateTechniqueLibrary.ts export              # Export to technique-library-data.json
 *   npx tsx src/scripts/migrateTechniqueLibrary.ts export ./custom.json
 *   npx tsx src/scripts/migrateTechniqueLibrary.ts import              # Import from technique-library-data.json
 *   npx tsx src/scripts/migrateTechniqueLibrary.ts import ./custom.json
 *
 * The export uses (subcategory + starting_position) as the matching key,
 * so it works even if the production DB has different auto-increment IDs.
 */

import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { initDatabase } from '../db/database.js';

const DEFAULT_FILE = './technique-library-data.json';

interface TechniqueExport {
  subcategory: string;
  starting_position: string;
  youtube_url: string | null;
  description: string | null;
}

function exportData(filePath: string) {
  const db = initDatabase();

  const rows = db.prepare(`
    SELECT subcategory, starting_position, youtube_url, description
    FROM technique_library
    WHERE youtube_url IS NOT NULL OR description IS NOT NULL
    ORDER BY category, subcategory, starting_position
  `).all() as TechniqueExport[];

  const withVideos = rows.filter(r => r.youtube_url && r.youtube_url !== 'NONE').length;
  const withDescs = rows.filter(r => r.description).length;

  writeFileSync(filePath, JSON.stringify(rows, null, 2));

  console.log(`Exported ${rows.length} enriched techniques to ${filePath}`);
  console.log(`  - ${withVideos} with YouTube URLs`);
  console.log(`  - ${withDescs} with descriptions`);

  db.close();
}

function importData(filePath: string) {
  const db = initDatabase();

  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw) as TechniqueExport[];

  const updateStmt = db.prepare(`
    UPDATE technique_library
    SET youtube_url = COALESCE(?, youtube_url),
        description = COALESCE(?, description)
    WHERE subcategory = ? AND starting_position = ?
  `);

  let updated = 0;
  let skipped = 0;

  const transaction = db.transaction(() => {
    for (const row of data) {
      const result = updateStmt.run(
        row.youtube_url,
        row.description,
        row.subcategory,
        row.starting_position
      );
      if (result.changes > 0) {
        updated++;
      } else {
        skipped++;
      }
    }
  });

  transaction();

  console.log(`Imported from ${filePath}`);
  console.log(`  - ${updated} techniques updated`);
  if (skipped > 0) {
    console.log(`  - ${skipped} skipped (no matching technique in DB)`);
  }

  db.close();
}

function main() {
  const [command, filePath] = process.argv.slice(2);
  const file = filePath || DEFAULT_FILE;

  if (command === 'export') {
    exportData(file);
  } else if (command === 'import') {
    importData(file);
  } else {
    console.error('Usage:');
    console.error('  npx tsx src/scripts/migrateTechniqueLibrary.ts export [file.json]');
    console.error('  npx tsx src/scripts/migrateTechniqueLibrary.ts import [file.json]');
    process.exit(1);
  }
}

main();
