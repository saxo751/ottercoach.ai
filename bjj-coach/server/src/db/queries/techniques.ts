import type Database from 'better-sqlite3';
import type { Technique } from '../types.js';
import type { TechniqueType } from '../../utils/constants.js';
import { nowISO } from '../../utils/time.js';

export function createTechnique(
  db: Database.Database,
  userId: string,
  name: string,
  techniqueType: TechniqueType,
  opts: Partial<Technique> = {}
): Technique {
  const now = nowISO();
  const result = db.prepare(`
    INSERT INTO techniques (user_id, name, position_from, position_to, technique_type,
      confidence_level, times_drilled, times_hit_in_rolling, video_url, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, name,
    opts.position_from ?? null, opts.position_to ?? null,
    techniqueType,
    opts.confidence_level ?? 1,
    opts.times_drilled ?? 0,
    opts.times_hit_in_rolling ?? 0,
    opts.video_url ?? null,
    opts.notes ?? null,
    now, now
  );

  return db.prepare('SELECT * FROM techniques WHERE id = ?').get(result.lastInsertRowid) as Technique;
}

export function getTechniquesByUserId(db: Database.Database, userId: string): Technique[] {
  return db.prepare('SELECT * FROM techniques WHERE user_id = ? ORDER BY name').all(userId) as Technique[];
}

export function updateTechnique(db: Database.Database, id: number, fields: Partial<Technique>): void {
  const allowed = [
    'name', 'position_from', 'position_to', 'technique_type',
    'confidence_level', 'times_drilled', 'times_hit_in_rolling',
    'last_trained_at', 'video_url', 'notes',
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
  db.prepare(`UPDATE techniques SET ${updates.join(', ')} WHERE id = @id`).run(values);
}
