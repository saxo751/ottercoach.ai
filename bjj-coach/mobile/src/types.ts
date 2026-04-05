export interface User {
  id: string;
  email: string | null;
  name: string | null;
  belt_rank: string | null;
  experience_months: number | null;
  training_start_month: string | null;
  preferred_game_style: string | null;
  training_days: string | null;
  typical_training_time: string | null;
  injuries_limitations: string | null;
  current_focus_area: string | null;
  goals: string | null;
  timezone: string;
  conversation_mode: string;
  onboarding_complete: number;
  profile_picture?: string | null;
  is_admin?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  belt_rank: string | null;
  onboarding_complete: number;
  profile_picture?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  link?: string;
  created_at?: string;
}

export interface ChatButton {
  label: string;
  data: string;
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

export interface FocusPeriodWithDays extends FocusPeriod {
  days_active: number;
  session_count: number;
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
