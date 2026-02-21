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
      new_techniques_learned, energy_level, raw_conversation, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    nowISO()
  );

  return db.prepare('SELECT * FROM training_sessions WHERE id = ?').get(result.lastInsertRowid) as TrainingSession;
}

export function getRecentSessionsByUserId(
  db: Database.Database,
  userId: string,
  limit = 10
): TrainingSession[] {
  return db.prepare(`
    SELECT * FROM training_sessions
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT ?
  `).all(userId, limit) as TrainingSession[];
}
