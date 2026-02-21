import type Database from 'better-sqlite3';
import type { User } from '../types.js';
import type { ConversationMode } from '../../utils/constants.js';
import { v4 as uuid } from 'uuid';
import { nowISO } from '../../utils/time.js';

export function createUser(db: Database.Database, overrides: Partial<User> = {}): User {
  const now = nowISO();
  const user: User = {
    id: overrides.id || uuid(),
    name: overrides.name || null,
    belt_rank: overrides.belt_rank || null,
    experience_months: overrides.experience_months ?? null,
    preferred_game_style: overrides.preferred_game_style || null,
    training_days: overrides.training_days || null,
    typical_training_time: overrides.typical_training_time || null,
    injuries_limitations: overrides.injuries_limitations || null,
    current_focus_area: overrides.current_focus_area || null,
    goals: overrides.goals || null,
    timezone: overrides.timezone || process.env.DEFAULT_TIMEZONE || 'America/New_York',
    conversation_mode: overrides.conversation_mode || 'onboarding',
    onboarding_complete: overrides.onboarding_complete ?? 0,
    created_at: now,
    updated_at: now,
  };

  db.prepare(`
    INSERT INTO users (id, name, belt_rank, experience_months, preferred_game_style,
      training_days, typical_training_time, injuries_limitations, current_focus_area,
      goals, timezone, conversation_mode, onboarding_complete, created_at, updated_at)
    VALUES (@id, @name, @belt_rank, @experience_months, @preferred_game_style,
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
    'name', 'belt_rank', 'experience_months', 'preferred_game_style',
    'training_days', 'typical_training_time', 'injuries_limitations',
    'current_focus_area', 'goals', 'timezone', 'conversation_mode',
    'onboarding_complete',
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
