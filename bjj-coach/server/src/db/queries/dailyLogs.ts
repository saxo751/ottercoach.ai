import type Database from 'better-sqlite3';
import type { UserDailyLog } from '../types.js';

export function appendDailyLog(
  db: Database.Database,
  userId: string,
  logDate: string,
  entryType: string,
  content: string,
  sourceMode: string | null
): void {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO user_daily_logs (user_id, log_date, entry_type, content, source_mode, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, logDate, entryType, content, sourceMode, now);
}

export function getRecentDailyLogs(db: Database.Database, userId: string, days: number = 3): UserDailyLog[] {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return db.prepare(`
    SELECT * FROM user_daily_logs
    WHERE user_id = ? AND log_date >= ?
    ORDER BY log_date DESC, created_at DESC
  `).all(userId, cutoff) as UserDailyLog[];
}

export function pruneOldDailyLogs(db: Database.Database, retentionDays: number = 30): number {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const result = db.prepare(`
    DELETE FROM user_daily_logs WHERE log_date < ?
  `).run(cutoff);
  return result.changes;
}
