export interface User {
  id: string;
  email: string | null;
  name: string | null;
  belt_rank: string | null;
  experience_months: number | null;
  preferred_game_style: string | null;
  training_days: string | null;
  typical_training_time: string | null;
  injuries_limitations: string | null;
  current_focus_area: string | null;
  goals: string | null;
  timezone: string;
  conversation_mode: string;
  onboarding_complete: number;
  telegram_bot_token?: string | null;
  has_telegram_bot?: boolean;
  profile_picture?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: number;
  user_id: string;
  name: string;
  category: string;
  confidence_level: number;
  last_trained_at: string | null;
  notes: string | null;
}

export interface Technique {
  id: number;
  user_id: string;
  name: string;
  position_from: number | null;
  position_to: number | null;
  technique_type: string;
  confidence_level: number;
  times_drilled: number;
  times_hit_in_rolling: number;
  last_trained_at: string | null;
  video_url: string | null;
  notes: string | null;
}

export interface TrainingSession {
  id: number;
  user_id: string;
  date: string;
  duration_minutes: number | null;
  session_type: string | null;
  positions_worked: string | null;
  techniques_worked: string | null;
  rolling_notes: string | null;
  wins: string | null;
  struggles: string | null;
  new_techniques_learned: string | null;
  energy_level: number | null;
  focus_period_id: number | null;
  focus_name: string | null;
  created_at: string;
}

export interface SessionStats {
  this_week: number;
  this_month: number;
  all_time: number;
}

export interface FocusPeriodWithDays extends FocusPeriod {
  days_active: number;
  session_count: number;
}

export interface FocusPeriod {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  focus_positions: string | null;
  focus_techniques: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
}

export interface Goal {
  id: number;
  user_id: string;
  description: string;
  status: string;
  progress_notes: string | null;
  created_at: string;
  completed_at: string | null;
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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface Button {
  label: string;
  data: string;
}

export interface FeatureIdea {
  id: number;
  user_id: string;
  title: string;
  description: string;
  status: string;
  author_name: string | null;
  vote_count: number;
  comment_count: number;
  user_has_voted: number;
  created_at: string;
  updated_at: string;
}

export interface FeatureIdeaComment {
  id: number;
  idea_id: number;
  user_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
}
