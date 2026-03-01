import type Database from 'better-sqlite3';
import type { TrainingSession } from '../types.js';
import { nowISO } from '../../utils/time.js';

export function createSession(
  db: Database.Database,
  userId: string,
  date: string,
  fields: Partial<TrainingSession> = {}
): TrainingSession {
  const result = db.prepare(`
    INSERT INTO training_sessions (user_id, date, duration_minutes, session_type,
      positions_worked, techniques_worked, rolling_notes, wins, struggles,
      new_techniques_learned, energy_level, raw_conversation, focus_period_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, date,
    fields.duration_minutes ?? null,
    fields.session_type ?? null,
    fields.positions_worked ?? null,
    fields.techniques_worked ?? null,
    fields.rolling_notes ?? null,
    fields.wins ?? null,
    fields.struggles ?? null,
    fields.new_techniques_learned ?? null,
    fields.energy_level ?? null,
    fields.raw_conversation ?? null,
    fields.focus_period_id ?? null,
    nowISO()
  );

  return db.prepare('SELECT * FROM training_sessions WHERE id = ?').get(result.lastInsertRowid) as TrainingSession;
}

export function getRecentSessionsByUserId(
  db: Database.Database,
  userId: string,
  limit = 10
): (TrainingSession & { focus_name: string | null })[] {
  return db.prepare(`
    SELECT ts.*, fp.name AS focus_name
    FROM training_sessions ts
    LEFT JOIN focus_periods fp ON ts.focus_period_id = fp.id
    WHERE ts.user_id = ?
    ORDER BY ts.date DESC
    LIMIT ?
  `).all(userId, limit) as (TrainingSession & { focus_name: string | null })[];
}

export function updateSession(
  db: Database.Database,
  sessionId: number,
  userId: string,
  fields: Partial<TrainingSession>
): (TrainingSession & { focus_name: string | null }) | null {
  const allowed = [
    'date', 'duration_minutes', 'session_type', 'positions_worked',
    'techniques_worked', 'rolling_notes', 'wins', 'struggles',
    'new_techniques_learned', 'energy_level', 'focus_period_id',
  ] as const;

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in fields) {
      setClauses.push(`${key} = ?`);
      values.push((fields as Record<string, unknown>)[key] ?? null);
    }
  }

  if (setClauses.length === 0) return null;

  values.push(sessionId, userId);
  db.prepare(
    `UPDATE training_sessions SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`
  ).run(...values);

  return db.prepare(`
    SELECT ts.*, fp.name AS focus_name
    FROM training_sessions ts
    LEFT JOIN focus_periods fp ON ts.focus_period_id = fp.id
    WHERE ts.id = ? AND ts.user_id = ?
  `).get(sessionId, userId) as (TrainingSession & { focus_name: string | null }) | null;
}

export function deleteSession(
  db: Database.Database,
  sessionId: number,
  userId: string
): boolean {
  const result = db.prepare(
    'DELETE FROM training_sessions WHERE id = ? AND user_id = ?'
  ).run(sessionId, userId);
  return result.changes > 0;
}

export function getSessionStats(
  db: Database.Database,
  userId: string
): { this_week: number; this_month: number; all_time: number } {
  const row = db.prepare(`
    SELECT
      SUM(CASE WHEN date >= date('now', 'weekday 0', '-6 days') THEN 1 ELSE 0 END) AS this_week,
      SUM(CASE WHEN date >= date('now', 'start of month') THEN 1 ELSE 0 END) AS this_month,
      COUNT(*) AS all_time
    FROM training_sessions
    WHERE user_id = ?
  `).get(userId) as { this_week: number; this_month: number; all_time: number };
  return { this_week: row.this_week || 0, this_month: row.this_month || 0, all_time: row.all_time || 0 };
}
