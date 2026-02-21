import type { ConversationMode, BeltRank, Platform, TechniqueType, SessionType, PositionCategory } from '../utils/constants.js';

export interface User {
  id: string;
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
  created_at: string;
  updated_at: string;
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
  role: 'user' | 'assistant';
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
  created_at: string;
}
