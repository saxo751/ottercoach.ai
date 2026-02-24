import type Database from 'better-sqlite3';
import type { UserMemory } from '../types.js';
import type { MemoryCategory } from '../../utils/constants.js';
import { MEMORY_CATEGORIES } from '../../utils/constants.js';

export function createMemory(
  db: Database.Database,
  userId: string,
  category: string,
  content: string,
  sourceMode: string | null,
  confidence: number = 3
): number {
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO user_memories (user_id, category, content, source_mode, confidence, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(userId, category, content, sourceMode, confidence, now, now);
  return result.lastInsertRowid as number;
}

/**
 * Load memories for prompt injection, with category-based limits to keep token budget reasonable.
 */
export function getMemoriesForPrompt(db: Database.Database, userId: string): UserMemory[] {
  // Uncapped categories: identity, preference, fact
  const uncapped = db.prepare(`
    SELECT * FROM user_memories
    WHERE user_id = ? AND status = 'active' AND category IN ('identity', 'preference', 'fact')
    ORDER BY category, updated_at DESC
  `).all(userId) as UserMemory[];

  // Capped: coaching_insight — last 10
  const insights = db.prepare(`
    SELECT * FROM user_memories
    WHERE user_id = ? AND status = 'active' AND category = 'coaching_insight'
    ORDER BY updated_at DESC LIMIT 10
  `).all(userId) as UserMemory[];

  // Capped: session_observation — last 5
  const observations = db.prepare(`
    SELECT * FROM user_memories
    WHERE user_id = ? AND status = 'active' AND category = 'session_observation'
    ORDER BY updated_at DESC LIMIT 5
  `).all(userId) as UserMemory[];

  // Capped: pattern — last 5
  const patterns = db.prepare(`
    SELECT * FROM user_memories
    WHERE user_id = ? AND status = 'active' AND category = 'pattern'
    ORDER BY updated_at DESC LIMIT 5
  `).all(userId) as UserMemory[];

  return [...uncapped, ...insights, ...observations, ...patterns];
}

/**
 * Get all active memories for a user (used in extraction instructions so AI can see what exists).
 */
export function getActiveMemories(db: Database.Database, userId: string): UserMemory[] {
  return db.prepare(`
    SELECT * FROM user_memories
    WHERE user_id = ? AND status = 'active'
    ORDER BY category, updated_at DESC
  `).all(userId) as UserMemory[];
}

/**
 * LIKE substring match for finding a memory to supersede.
 */
export function findMemoryByContent(db: Database.Database, userId: string, searchText: string): UserMemory | undefined {
  return db.prepare(`
    SELECT * FROM user_memories
    WHERE user_id = ? AND status = 'active' AND content LIKE ?
    ORDER BY updated_at DESC LIMIT 1
  `).get(userId, `%${searchText}%`) as UserMemory | undefined;
}

/**
 * Mark old memory as superseded, linking it to the new one.
 */
export function supersedeMemory(db: Database.Database, oldId: number, newMemoryId: number): void {
  const now = new Date().toISOString();
  const txn = db.transaction(() => {
    db.prepare(`
      UPDATE user_memories SET status = 'superseded', superseded_by = ?, updated_at = ? WHERE id = ?
    `).run(newMemoryId, now, oldId);
  });
  txn();
}

/**
 * Archive session_observation memories older than N days.
 */
export function archiveStaleObservations(db: Database.Database, days: number = 30): number {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE user_memories
    SET status = 'archived', updated_at = ?
    WHERE category = 'session_observation' AND status = 'active' AND updated_at < ?
  `).run(now, cutoff);
  return result.changes;
}

/**
 * Process the memories array from a ---DATA--- block.
 * Handles create and supersede actions.
 */
export function processMemoryExtraction(
  db: Database.Database,
  userId: string,
  data: Record<string, unknown>,
  sourceMode: string
): void {
  // Process memories array
  if (Array.isArray(data.memories)) {
    for (const mem of data.memories) {
      if (!mem || typeof mem !== 'object') continue;
      const { action, category, content, confidence, supersedes_content } = mem as Record<string, unknown>;

      if (!content || typeof content !== 'string') continue;
      if (!category || typeof category !== 'string') continue;
      if (!MEMORY_CATEGORIES.includes(category as MemoryCategory)) continue;

      const conf = typeof confidence === 'number' ? Math.max(1, Math.min(5, confidence)) : 3;

      if (action === 'supersede' && typeof supersedes_content === 'string') {
        const existing = findMemoryByContent(db, userId, supersedes_content);
        const newId = createMemory(db, userId, category, content, sourceMode, conf);
        if (existing) {
          supersedeMemory(db, existing.id, newId);
          console.log(`[memory] Superseded memory #${existing.id} with #${newId} for user ${userId}`);
        } else {
          console.log(`[memory] Created memory #${newId} (supersede target not found) for user ${userId}`);
        }
      } else {
        const newId = createMemory(db, userId, category, content, sourceMode, conf);
        console.log(`[memory] Created memory #${newId} [${category}] for user ${userId}`);
      }
    }
  }

  // Process daily_log string
  if (typeof data.daily_log === 'string' && data.daily_log.trim()) {
    // Import inline to avoid circular deps — use the function from dailyLogs
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO user_daily_logs (user_id, log_date, entry_type, content, source_mode, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, today, sourceMode, data.daily_log.trim(), sourceMode, now);
    console.log(`[memory] Appended daily log for user ${userId} on ${today}`);
  }
}
