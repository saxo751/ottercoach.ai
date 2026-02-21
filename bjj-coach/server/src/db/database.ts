import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { runMigrations } from './migrations.js';

let instance: Database.Database | null = null;

export function initDatabase(dbPath?: string): Database.Database {
  if (instance) return instance;

  const path = dbPath || process.env.DATABASE_PATH || './data/bjj-coach.db';
  mkdirSync(dirname(path), { recursive: true });

  instance = new Database(path);
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');

  runMigrations(instance);
  return instance;
}

export function getDatabase(): Database.Database {
  if (!instance) throw new Error('Database not initialized — call initDatabase() first');
  return instance;
}
