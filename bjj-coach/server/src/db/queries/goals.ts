import type Database from 'better-sqlite3';
import type { Goal } from '../types.js';
import { nowISO } from '../../utils/time.js';

export function createGoal(
  db: Database.Database,
  userId: string,
  description: string
): Goal {
  const result = db.prepare(`
    INSERT INTO goals (user_id, description, status, created_at)
    VALUES (?, ?, 'active', ?)
  `).run(userId, description, nowISO());

  return db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid) as Goal;
}

export function getActiveGoals(db: Database.Database, userId: string): Goal[] {
  return db.prepare(`
    SELECT * FROM goals
    WHERE user_id = ? AND status = 'active'
    ORDER BY created_at DESC
  `).all(userId) as Goal[];
}

export function getAllGoals(db: Database.Database, userId: string): Goal[] {
  return db.prepare(`
    SELECT * FROM goals
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as Goal[];
}

export function completeGoal(db: Database.Database, id: number, progressNotes?: string): void {
  const updates: string[] = ['status = ?', 'completed_at = ?'];
  const values: unknown[] = ['completed', nowISO()];

  if (progressNotes) {
    updates.push('progress_notes = ?');
    values.push(progressNotes);
  }

  values.push(id);
  db.prepare(`UPDATE goals SET ${updates.join(', ')} WHERE id = ?`).run(...values);
}

export function updateGoal(db: Database.Database, id: number, fields: Partial<Goal>): void {
  const allowed = ['description', 'status', 'progress_notes', 'completed_at'];
  const updates: string[] = [];
  const values: Record<string, unknown> = { id };

  for (const key of allowed) {
    if (key in fields) {
      updates.push(`${key} = @${key}`);
      values[key] = (fields as any)[key];
    }
  }
  if (updates.length === 0) return;

  db.prepare(`UPDATE goals SET ${updates.join(', ')} WHERE id = @id`).run(values);
}
