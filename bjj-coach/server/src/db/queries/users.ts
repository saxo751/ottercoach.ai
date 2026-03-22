import type Database from 'better-sqlite3';
import type { User } from '../types.js';
import type { ConversationMode } from '../../utils/constants.js';
import { v4 as uuid } from 'uuid';
import { nowISO } from '../../utils/time.js';

export function createUser(db: Database.Database, overrides: Partial<User> = {}): User {
  const now = nowISO();
  const user: User = {
    id: overrides.id || uuid(),
    email: overrides.email || null,
    password_hash: overrides.password_hash || null,
    name: overrides.name || null,
    belt_rank: overrides.belt_rank || null,
    experience_months: overrides.experience_months ?? null,
    training_start_month: overrides.training_start_month || null,
    preferred_game_style: overrides.preferred_game_style || null,
    training_days: overrides.training_days || null,
    typical_training_time: overrides.typical_training_time || null,
    injuries_limitations: overrides.injuries_limitations || null,
    current_focus_area: overrides.current_focus_area || null,
    goals: overrides.goals || null,
    timezone: overrides.timezone || process.env.DEFAULT_TIMEZONE || 'America/New_York',
    conversation_mode: overrides.conversation_mode || 'onboarding',
    onboarding_complete: overrides.onboarding_complete ?? 0,
    last_scheduled_action: overrides.last_scheduled_action || null,
    last_scheduled_date: overrides.last_scheduled_date || null,
    profile_picture: overrides.profile_picture || null,
    is_admin: overrides.is_admin ?? 0,
    created_at: now,
    updated_at: now,
  };

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, belt_rank, experience_months, training_start_month, preferred_game_style,
      training_days, typical_training_time, injuries_limitations, current_focus_area,
      goals, timezone, conversation_mode, onboarding_complete, created_at, updated_at)
    VALUES (@id, @email, @password_hash, @name, @belt_rank, @experience_months, @training_start_month, @preferred_game_style,
      @training_days, @typical_training_time, @injuries_limitations, @current_focus_area,
      @goals, @timezone, @conversation_mode, @onboarding_complete, @created_at, @updated_at)
  `).run(user);

  return user;
}

export function getUserById(db: Database.Database, id: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function updateUser(db: Database.Database, id: string, fields: Partial<User>): void {
  const allowed = [
    'email', 'password_hash', 'name', 'belt_rank', 'experience_months', 'training_start_month', 'preferred_game_style',
    'training_days', 'typical_training_time', 'injuries_limitations',
    'current_focus_area', 'goals', 'timezone', 'conversation_mode',
    'onboarding_complete', 'last_scheduled_action', 'last_scheduled_date', 'profile_picture',
    'is_admin',
  ];

  const updates: string[] = [];
  const values: Record<string, unknown> = { id };

  for (const key of allowed) {
    if (key in fields) {
      updates.push(`${key} = @${key}`);
      values[key] = (fields as any)[key];
    }
  }

  if (updates.length === 0) return;

  updates.push('updated_at = @updated_at');
  values.updated_at = nowISO();

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = @id`).run(values);
}

export function setConversationMode(db: Database.Database, id: string, mode: ConversationMode): void {
  updateUser(db, id, { conversation_mode: mode });
}

export function getOnboardedUsers(db: Database.Database): User[] {
  return db.prepare(
    'SELECT * FROM users WHERE onboarding_complete = 1 AND training_days IS NOT NULL'
  ).all() as User[];
}

export function setScheduledAction(db: Database.Database, id: string, action: string | null, date: string): void {
  db.prepare(
    'UPDATE users SET last_scheduled_action = ?, last_scheduled_date = ? WHERE id = ?'
  ).run(action, date, id);
}

export function getAllUsers(db: Database.Database): Pick<User, 'id' | 'email' | 'name' | 'is_admin' | 'created_at'>[] {
  return db.prepare('SELECT id, email, name, is_admin, created_at FROM users ORDER BY created_at').all() as any[];
}

export function ensureSuperAdmin(db: Database.Database, email: string): void {
  const result = db.prepare('UPDATE users SET is_admin = 1 WHERE email = ? AND is_admin = 0').run(email);
  if (result.changes > 0) {
    console.log(`[db] Promoted ${email} to admin`);
  }
}
