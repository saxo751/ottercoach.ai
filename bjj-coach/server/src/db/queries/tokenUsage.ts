import type Database from 'better-sqlite3';
import type { TokenUsage } from '../../ai/provider.js';
import type { TokenUsageRecord } from '../types.js';

export function logTokenUsage(
  db: Database.Database,
  userId: string,
  mode: string,
  usage: TokenUsage
): void {
  db.prepare(`
    INSERT INTO token_usage (user_id, mode, input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    mode,
    usage.input_tokens,
    usage.output_tokens,
    usage.cache_creation_input_tokens ?? null,
    usage.cache_read_input_tokens ?? null,
    new Date().toISOString()
  );
}

export function getTokenUsageByUser(
  db: Database.Database,
  userId: string,
  days?: number
): TokenUsageRecord[] {
  if (days) {
    return db.prepare(`
      SELECT * FROM token_usage
      WHERE user_id = ? AND created_at >= datetime('now', ?)
      ORDER BY created_at DESC
    `).all(userId, `-${days} days`) as TokenUsageRecord[];
  }
  return db.prepare(`
    SELECT * FROM token_usage
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as TokenUsageRecord[];
}

export function getTokenUsageSummary(
  db: Database.Database,
  days?: number
): any[] {
  const dateFilter = days ? `WHERE t.created_at >= datetime('now', '-${days} days')` : '';
  return db.prepare(`
    SELECT
      t.user_id,
      u.name AS user_name,
      t.mode,
      COUNT(*) AS call_count,
      SUM(t.input_tokens) AS total_input_tokens,
      SUM(t.output_tokens) AS total_output_tokens,
      SUM(COALESCE(t.cache_creation_input_tokens, 0)) AS total_cache_creation_tokens,
      SUM(COALESCE(t.cache_read_input_tokens, 0)) AS total_cache_read_tokens
    FROM token_usage t
    LEFT JOIN users u ON u.id = t.user_id
    ${dateFilter}
    GROUP BY t.user_id, t.mode
    ORDER BY t.user_id, t.mode
  `).all();
}
