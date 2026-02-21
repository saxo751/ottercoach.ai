import type Database from 'better-sqlite3';
import type { User, MagicLinkToken } from '../types.js';
import { nowISO } from '../../utils/time.js';

export function findUserByEmail(db: Database.Database, email: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
}

export function createMagicLinkToken(
  db: Database.Database,
  userId: string,
  token: string,
  expiresAt: string,
): MagicLinkToken {
  const now = nowISO();
  db.prepare(`
    INSERT INTO magic_link_tokens (user_id, token, expires_at, used, created_at)
    VALUES (?, ?, ?, 0, ?)
  `).run(userId, token, expiresAt, now);

  return db.prepare('SELECT * FROM magic_link_tokens WHERE token = ?').get(token) as MagicLinkToken;
}

export function findValidToken(
  db: Database.Database,
  token: string,
): (MagicLinkToken & { email: string }) | undefined {
  return db.prepare(`
    SELECT mlt.*, u.email
    FROM magic_link_tokens mlt
    JOIN users u ON mlt.user_id = u.id
    WHERE mlt.token = ? AND mlt.used = 0 AND mlt.expires_at > ?
  `).get(token, nowISO()) as (MagicLinkToken & { email: string }) | undefined;
}

export function markTokenUsed(db: Database.Database, tokenId: number): void {
  db.prepare('UPDATE magic_link_tokens SET used = 1 WHERE id = ?').run(tokenId);
}

export function cleanExpiredTokens(db: Database.Database): void {
  db.prepare('DELETE FROM magic_link_tokens WHERE expires_at < ? OR used = 1').run(nowISO());
}
