import type Database from 'better-sqlite3';
import type { UserChannel, User } from '../types.js';
import type { Platform } from '../../utils/constants.js';
import { createUser } from './users.js';
import { nowISO } from '../../utils/time.js';

export function findUserByPlatformId(
  db: Database.Database,
  platform: Platform,
  platformUserId: string
): User | undefined {
  return db.prepare(`
    SELECT u.* FROM users u
    JOIN user_channels uc ON u.id = uc.user_id
    WHERE uc.platform = ? AND uc.platform_user_id = ?
  `).get(platform, platformUserId) as User | undefined;
}

export function createUserChannel(
  db: Database.Database,
  userId: string,
  platform: Platform,
  platformUserId: string
): UserChannel {
  const now = nowISO();
  db.prepare(`
    INSERT INTO user_channels (user_id, platform, platform_user_id, is_primary, created_at)
    VALUES (?, ?, ?, 1, ?)
  `).run(userId, platform, platformUserId, now);

  return db.prepare(
    'SELECT * FROM user_channels WHERE user_id = ? AND platform = ?'
  ).get(userId, platform) as UserChannel;
}

export function getPrimaryChannel(db: Database.Database, userId: string): UserChannel | undefined {
  return db.prepare(
    'SELECT * FROM user_channels WHERE user_id = ? ORDER BY is_primary DESC LIMIT 1'
  ).get(userId) as UserChannel | undefined;
}

/** Find existing user by platform ID, or create a new user + channel mapping. */
export function findOrCreateUser(
  db: Database.Database,
  platform: Platform,
  platformUserId: string
): { user: User; isNew: boolean } {
  const existing = findUserByPlatformId(db, platform, platformUserId);
  if (existing) return { user: existing, isNew: false };

  const user = createUser(db);
  createUserChannel(db, user.id, platform, platformUserId);
  return { user, isNew: true };
}

export function getUserPushTokens(db: Database.Database, userId: string): string[] {
  const rows = db.prepare(`
    SELECT push_token FROM user_channels
    WHERE user_id = ? AND platform = 'mobile' AND push_token IS NOT NULL
  `).all(userId) as { push_token: string }[];
  return rows.map((r) => r.push_token);
}

export function registerPushToken(
  db: Database.Database,
  userId: string,
  pushToken: string
): void {
  const existing = db.prepare(`
    SELECT id FROM user_channels
    WHERE user_id = ? AND platform = 'mobile' AND push_token = ?
  `).get(userId, pushToken);

  if (existing) return;

  const now = nowISO();
  db.prepare(`
    INSERT INTO user_channels (user_id, platform, platform_user_id, push_token, is_primary, created_at)
    VALUES (?, 'mobile', ?, ?, 0, ?)
  `).run(userId, pushToken, pushToken, now);
}

export function removePushToken(
  db: Database.Database,
  userId: string,
  pushToken: string
): void {
  db.prepare(`
    DELETE FROM user_channels
    WHERE user_id = ? AND platform = 'mobile' AND push_token = ?
  `).run(userId, pushToken);
}

export function removeStaleTokens(
  db: Database.Database,
  tokens: string[]
): void {
  if (tokens.length === 0) return;
  const placeholders = tokens.map(() => '?').join(',');
  db.prepare(`
    DELETE FROM user_channels
    WHERE platform = 'mobile' AND push_token IN (${placeholders})
  `).run(...tokens);
}
