import type Database from 'better-sqlite3';
import type { ConversationEntry } from '../types.js';
import type { Platform } from '../../utils/constants.js';
import { nowISO } from '../../utils/time.js';

export function addMessage(
  db: Database.Database,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  platform: Platform
): void {
  db.prepare(`
    INSERT INTO conversation_history (user_id, role, content, platform, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, role, content, platform, nowISO());
}

export function getRecentMessages(
  db: Database.Database,
  userId: string,
  limit = 30
): ConversationEntry[] {
  return db.prepare(`
    SELECT * FROM conversation_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit).reverse() as ConversationEntry[];
}

/** Returns the most recent message (any role) for a user, or undefined. */
export function getLastMessage(
  db: Database.Database,
  userId: string
): ConversationEntry | undefined {
  return db.prepare(`
    SELECT * FROM conversation_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId) as ConversationEntry | undefined;
}
