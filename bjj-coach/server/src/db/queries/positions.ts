import type Database from 'better-sqlite3';
import type { Position } from '../types.js';
import type { PositionCategory } from '../../utils/constants.js';
import { nowISO } from '../../utils/time.js';

export function createPosition(
  db: Database.Database,
  userId: string,
  name: string,
  category: PositionCategory,
  confidenceLevel = 1
): Position {
  const now = nowISO();
  const result = db.prepare(`
    INSERT INTO positions (user_id, name, category, confidence_level, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, name, category, confidenceLevel, now, now);

  return db.prepare('SELECT * FROM positions WHERE id = ?').get(result.lastInsertRowid) as Position;
}

export function getPositionsByUserId(db: Database.Database, userId: string): Position[] {
  return db.prepare('SELECT * FROM positions WHERE user_id = ? ORDER BY name').all(userId) as Position[];
}

export function updatePosition(db: Database.Database, id: number, fields: Partial<Position>): void {
  const allowed = ['name', 'category', 'confidence_level', 'last_trained_at', 'notes'];
  const updates: string[] = [];
  const values: Record<string, unknown> = { id };

  for (const key of allowed) {
    if (key in fields) {
      updates.push(`${key} = @${key}`);
      values[key] = (fields as any)[key];
    }
  }
  if (updates.length === 0) return;

  updates.push('updated_at = @updated_at');
  values.updated_at = nowISO();
  db.prepare(`UPDATE positions SET ${updates.join(', ')} WHERE id = @id`).run(values);
}
