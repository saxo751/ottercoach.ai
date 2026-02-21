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
