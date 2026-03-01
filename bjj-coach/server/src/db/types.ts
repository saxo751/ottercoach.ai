import type { ConversationMode, BeltRank, Platform, TechniqueType, SessionType, PositionCategory } from '../utils/constants.js';

export interface User {
  id: string;
  email: string | null;
  password_hash: string | null;
  name: string | null;
  belt_rank: BeltRank | null;
  experience_months: number | null;
  preferred_game_style: string | null;
  training_days: string | null;        // JSON array: ["monday","wednesday","friday"]
  typical_training_time: string | null; // "19:00"
  injuries_limitations: string | null;
  current_focus_area: string | null;
  goals: string | null;
  timezone: string;
  conversation_mode: ConversationMode;
  onboarding_complete: number;          // SQLite boolean: 0 or 1
  last_scheduled_action: string | null; // 'briefing' | 'debrief' | null
  last_scheduled_date: string | null;   // 'YYYY-MM-DD' — resets daily
  telegram_bot_token: string | null;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
}

export interface MagicLinkToken {
  id: number;
  user_id: string;
  token: string;
  expires_at: string;
  used: number;       // SQLite boolean: 0 or 1
  created_at: string;
}

export interface UserChannel {
  id: number;
  user_id: string;
  platform: Platform;
  platform_user_id: string;
  is_primary: number;
  created_at: string;
}

export interface Position {
  id: number;
  user_id: string;
  name: string;
  category: PositionCategory;
  confidence_level: number;   // 1-5
  last_trained_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Technique {
  id: number;
  user_id: string;
  name: string;
  position_from: number | null;
  position_to: number | null;
  technique_type: TechniqueType;
  confidence_level: number;   // 1-5
  times_drilled: number;
  times_hit_in_rolling: number;
  last_trained_at: string | null;
  video_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: number;
  user_id: string;
  date: string;
  duration_minutes: number | null;
  session_type: SessionType | null;
  positions_worked: string | null;    // JSON array
  techniques_worked: string | null;   // JSON array
  rolling_notes: string | null;
  wins: string | null;
  struggles: string | null;
  new_techniques_learned: string | null;
  energy_level: number | null;        // 1-5
  raw_conversation: string | null;
  focus_period_id: number | null;
  created_at: string;
}

export interface FocusPeriod {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  focus_positions: string | null;     // JSON array
  focus_techniques: string | null;    // JSON array
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

export interface Goal {
  id: number;
  user_id: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  progress_notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ConversationEntry {
  id: number;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  platform: Platform;
  created_at: string;
}

export interface LibraryTechnique {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  starting_position: string;
  youtube_url: string | null;
  youtube_search_url: string;
  description: string | null;
  created_at: string;
}

export interface FeatureIdea {
  id: number;
  user_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureIdeaVote {
  id: number;
  idea_id: number;
  user_id: string;
  created_at: string;
}

export interface FeatureIdeaComment {
  id: number;
  idea_id: number;
  user_id: string;
  content: string;
  created_at: string;
}

export interface UserMemory {
  id: number;
  user_id: string;
  category: string;
  content: string;
  source_mode: string | null;
  confidence: number;
  status: string;
  superseded_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserDailyLog {
  id: number;
  user_id: string;
  log_date: string;
  entry_type: string;
  content: string;
  source_mode: string | null;
  created_at: string;
}

export interface TokenUsageRecord {
  id: number;
  user_id: string;
  mode: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number | null;
  cache_read_input_tokens: number | null;
  created_at: string;
}
