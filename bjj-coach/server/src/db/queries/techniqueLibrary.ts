import type Database from 'better-sqlite3';
import type { LibraryTechnique } from '../types.js';

export function getAllLibraryTechniques(db: Database.Database): LibraryTechnique[] {
  return db.prepare('SELECT * FROM technique_library ORDER BY category, subcategory, starting_position').all() as LibraryTechnique[];
}

export function getLibraryByCategory(db: Database.Database, category: string): LibraryTechnique[] {
  return db.prepare('SELECT * FROM technique_library WHERE category = ? ORDER BY subcategory, starting_position').all(category) as LibraryTechnique[];
}

export function searchLibrary(db: Database.Database, query: string): LibraryTechnique[] {
  const pattern = `%${query}%`;
  return db.prepare(
    'SELECT * FROM technique_library WHERE name LIKE ? OR subcategory LIKE ? OR starting_position LIKE ? ORDER BY category, subcategory'
  ).all(pattern, pattern, pattern) as LibraryTechnique[];
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
