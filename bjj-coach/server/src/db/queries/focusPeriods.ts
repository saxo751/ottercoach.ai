import type Database from 'better-sqlite3';
import type { FocusPeriod } from '../types.js';
import { nowISO } from '../../utils/time.js';

export function createFocusPeriod(
  db: Database.Database,
  userId: string,
  name: string,
  startDate: string,
  fields: Partial<FocusPeriod> = {}
): FocusPeriod {
  const result = db.prepare(`
    INSERT INTO focus_periods (user_id, name, description, focus_positions, focus_techniques,
      start_date, end_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, name,
    fields.description ?? null,
    fields.focus_positions ?? null,
    fields.focus_techniques ?? null,
    startDate,
    fields.end_date ?? null,
    fields.status ?? 'active',
    nowISO()
  );

  return db.prepare('SELECT * FROM focus_periods WHERE id = ?').get(result.lastInsertRowid) as FocusPeriod;
}

export function getActiveFocusPeriod(db: Database.Database, userId: string): FocusPeriod | undefined {
  return db.prepare(`
    SELECT * FROM focus_periods
    WHERE user_id = ? AND status = 'active'
    ORDER BY start_date DESC
    LIMIT 1
  `).get(userId) as FocusPeriod | undefined;
}

export function getAllFocusPeriods(
  db: Database.Database,
  userId: string
): (FocusPeriod & { days_active: number; session_count: number })[] {
  return db.prepare(`
    SELECT *,
      CAST(julianday(COALESCE(end_date, date('now'))) - julianday(start_date) AS INTEGER) + 1 AS days_active,
      (SELECT COUNT(*) FROM training_sessions ts WHERE ts.focus_period_id = fp.id) AS session_count
    FROM focus_periods fp
    WHERE fp.user_id = ?
    ORDER BY start_date DESC
  `).all(userId) as (FocusPeriod & { days_active: number; session_count: number })[];
}

export function updateFocusPeriod(
  db: Database.Database,
  id: number,
  userId: string,
  fields: Partial<Pick<FocusPeriod, 'name' | 'description' | 'focus_techniques' | 'focus_positions' | 'status' | 'end_date'>>
): FocusPeriod | undefined {
  const allowed = ['name', 'description', 'focus_techniques', 'focus_positions', 'status', 'end_date'];
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in fields) {
      sets.push(`${key} = ?`);
      values.push((fields as Record<string, unknown>)[key]);
    }
  }

  if (sets.length === 0) return undefined;

  values.push(id, userId);
  db.prepare(`UPDATE focus_periods SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);

  return db.prepare('SELECT * FROM focus_periods WHERE id = ? AND user_id = ?').get(id, userId) as FocusPeriod | undefined;
}

export function deleteFocusPeriod(
  db: Database.Database,
  id: number,
  userId: string
): boolean {
  const sessionCount = db.prepare(
    'SELECT COUNT(*) as cnt FROM training_sessions WHERE focus_period_id = ? AND user_id = ?'
  ).get(id, userId) as { cnt: number } | undefined;

  if (sessionCount && sessionCount.cnt > 0) return false;

  const result = db.prepare('DELETE FROM focus_periods WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}
