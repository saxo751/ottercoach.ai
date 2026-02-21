export const CONVERSATION_MODES = {
  ONBOARDING: 'onboarding',
  IDLE: 'idle',
  CHECK_IN: 'check_in',
  BRIEFING: 'briefing',
  DEBRIEF: 'debrief',
  FREE_CHAT: 'free_chat',
} as const;

export type ConversationMode = typeof CONVERSATION_MODES[keyof typeof CONVERSATION_MODES];

export const BELT_RANKS = ['white', 'blue', 'purple', 'brown', 'black', 'none'] as const;
export type BeltRank = typeof BELT_RANKS[number];

export const PLATFORMS = ['telegram', 'whatsapp', 'web'] as const;
export type Platform = typeof PLATFORMS[number];

export const TECHNIQUE_TYPES = [
  'sweep', 'pass', 'submission', 'escape', 'transition', 'takedown',
] as const;
export type TechniqueType = typeof TECHNIQUE_TYPES[number];

export const SESSION_TYPES = ['gi', 'nogi', 'open_mat', 'competition', 'private'] as const;
export type SessionType = typeof SESSION_TYPES[number];

export const POSITION_CATEGORIES = ['guard', 'top_control', 'bottom', 'transition'] as const;
export type PositionCategory = typeof POSITION_CATEGORIES[number];

export const DATA_DELIMITER = '---DATA---';
