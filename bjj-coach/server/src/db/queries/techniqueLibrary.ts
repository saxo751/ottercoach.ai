import type Database from 'better-sqlite3';
import type { LibraryTechnique } from '../types.js';

export function getAllLibraryTechniques(db: Database.Database): LibraryTechnique[] {
  return db.prepare('SELECT * FROM technique_library ORDER BY category, subcategory, starting_position').all() as LibraryTechnique[];
}

export function getLibraryByCategory(db: Database.Database, category: string): LibraryTechnique[] {
  return db.prepare('SELECT * FROM technique_library WHERE category = ? ORDER BY subcategory, starting_position').all(category) as LibraryTechnique[];
}

export function searchLibrary(db: Database.Database, query: string): LibraryTechnique[] {
  const words = query.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];

  // Each word must match somewhere in name, subcategory, or starting_position
  const conditions = words.map(() =>
    "(name LIKE ? OR subcategory LIKE ? OR starting_position LIKE ?)"
  );
  const params = words.flatMap(w => {
    const p = `%${w}%`;
    return [p, p, p];
  });

  return db.prepare(
    `SELECT * FROM technique_library WHERE ${conditions.join(' AND ')} ORDER BY category, subcategory`
  ).all(...params) as LibraryTechnique[];
}

export function getLibraryCategories(db: Database.Database): { category: string; count: number }[] {
  return db.prepare(
    'SELECT category, COUNT(*) as count FROM technique_library GROUP BY category ORDER BY category'
  ).all() as { category: string; count: number }[];
}

export function updateLibraryVideoUrl(db: Database.Database, id: number, youtubeUrl: string): void {
  db.prepare('UPDATE technique_library SET youtube_url = ? WHERE id = ?').run(youtubeUrl, id);
}

export function updateLibraryDescription(db: Database.Database, id: number, description: string): void {
  db.prepare('UPDATE technique_library SET description = ? WHERE id = ?').run(description, id);
}

export function getLibraryTechniqueNames(db: Database.Database): string[] {
  const rows = db.prepare('SELECT name FROM technique_library ORDER BY name').all() as { name: string }[];
  return rows.map(r => r.name);
}
