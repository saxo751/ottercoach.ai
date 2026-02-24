import type Database from 'better-sqlite3';

interface Migration {
  version: number;
  description: string;
  up: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Create all initial tables',
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        belt_rank TEXT,
        experience_months INTEGER,
        preferred_game_style TEXT,
        training_days TEXT,
        typical_training_time TEXT,
        injuries_limitations TEXT,
        current_focus_area TEXT,
        goals TEXT,
        timezone TEXT NOT NULL DEFAULT 'America/New_York',
        conversation_mode TEXT NOT NULL DEFAULT 'onboarding',
        onboarding_complete INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        platform_user_id TEXT NOT NULL,
        is_primary INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        UNIQUE(platform, platform_user_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        confidence_level INTEGER NOT NULL DEFAULT 1,
        last_trained_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS techniques (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        position_from INTEGER,
        position_to INTEGER,
        technique_type TEXT NOT NULL,
        confidence_level INTEGER NOT NULL DEFAULT 1,
        times_drilled INTEGER NOT NULL DEFAULT 0,
        times_hit_in_rolling INTEGER NOT NULL DEFAULT 0,
        last_trained_at TEXT,
        video_url TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (position_from) REFERENCES positions(id),
        FOREIGN KEY (position_to) REFERENCES positions(id)
      );

      CREATE TABLE IF NOT EXISTS training_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        duration_minutes INTEGER,
        session_type TEXT,
        positions_worked TEXT,
        techniques_worked TEXT,
        rolling_notes TEXT,
        wins TEXT,
        struggles TEXT,
        new_techniques_learned TEXT,
        energy_level INTEGER,
        raw_conversation TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS focus_periods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        focus_positions TEXT,
        focus_techniques TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS conversation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        platform TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_channels_platform ON user_channels(platform, platform_user_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_history_user ON conversation_history(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_training_sessions_user ON training_sessions(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);
      CREATE INDEX IF NOT EXISTS idx_techniques_user ON techniques(user_id);
      CREATE INDEX IF NOT EXISTS idx_focus_periods_user ON focus_periods(user_id, status);
    `,
  },
  {
    version: 2,
    description: 'Create goals table for goal history tracking',
    up: `
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        progress_notes TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id, status);
    `,
  },
  {
    version: 3,
    description: 'Create technique library reference table',
    up: `
      CREATE TABLE IF NOT EXISTS technique_library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT NOT NULL,
        starting_position TEXT NOT NULL,
        youtube_url TEXT,
        youtube_search_url TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_technique_library_category ON technique_library(category);
      CREATE INDEX IF NOT EXISTS idx_technique_library_subcategory ON technique_library(subcategory);
    `,
  },
  {
    version: 4,
    description: 'Add description column to technique library',
    up: `
      ALTER TABLE technique_library ADD COLUMN description TEXT;
    `,
  },
  {
    version: 5,
    description: 'Add email to users and create magic_link_tokens table',
    up: `
      ALTER TABLE users ADD COLUMN email TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

      CREATE TABLE IF NOT EXISTS magic_link_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_user ON magic_link_tokens(user_id);
    `,
  },
  {
    version: 6,
    description: 'Add password_hash column to users',
    up: `
      ALTER TABLE users ADD COLUMN password_hash TEXT;
    `,
  },
  {
    version: 7,
    description: 'Add scheduling tracking columns to users',
    up: `
      ALTER TABLE users ADD COLUMN last_scheduled_action TEXT;
      ALTER TABLE users ADD COLUMN last_scheduled_date TEXT;
    `,
  },
  {
    version: 8,
    description: 'Create feature ideas, votes, and comments tables',
    up: `
      CREATE TABLE IF NOT EXISTS feature_ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS feature_idea_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idea_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(idea_id, user_id),
        FOREIGN KEY (idea_id) REFERENCES feature_ideas(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS feature_idea_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idea_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (idea_id) REFERENCES feature_ideas(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_feature_ideas_user ON feature_ideas(user_id);
      CREATE INDEX IF NOT EXISTS idx_feature_ideas_status ON feature_ideas(status);
      CREATE INDEX IF NOT EXISTS idx_feature_idea_votes_idea ON feature_idea_votes(idea_id);
      CREATE INDEX IF NOT EXISTS idx_feature_idea_comments_idea ON feature_idea_comments(idea_id);
    `,
  },
  {
    version: 9,
    description: 'Create user_memories and user_daily_logs tables for LLM memory system',
    up: `
      CREATE TABLE IF NOT EXISTS user_memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        content TEXT NOT NULL,
        source_mode TEXT,
        confidence INTEGER NOT NULL DEFAULT 3,
        status TEXT NOT NULL DEFAULT 'active',
        superseded_by INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (superseded_by) REFERENCES user_memories(id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_memories_user_status ON user_memories(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_user_memories_user_cat_status ON user_memories(user_id, category, status);

      CREATE TABLE IF NOT EXISTS user_daily_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        log_date TEXT NOT NULL,
        entry_type TEXT NOT NULL,
        content TEXT NOT NULL,
        source_mode TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_daily_logs_user_date ON user_daily_logs(user_id, log_date DESC);
    `,
  },
  {
    version: 10,
    description: 'Create token_usage table for per-user AI token tracking',
    up: `
      CREATE TABLE IF NOT EXISTS token_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        cache_creation_input_tokens INTEGER,
        cache_read_input_tokens INTEGER,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_token_usage_user ON token_usage(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_token_usage_created ON token_usage(created_at);
    `,
  },
  {
    version: 11,
    description: 'Add telegram_bot_token column to users for per-user Telegram bots',
    up: `
      ALTER TABLE users ADD COLUMN telegram_bot_token TEXT;
    `,
  },
];

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all()
      .map((row: any) => row.version as number)
  );

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;

    console.log(`[db] Running migration v${migration.version}: ${migration.description}`);
    db.exec(migration.up);
    db.prepare(
      'INSERT INTO schema_migrations (version, description, applied_at) VALUES (?, ?, ?)'
    ).run(migration.version, migration.description, new Date().toISOString());
  }
}
