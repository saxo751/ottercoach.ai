import type Database from 'better-sqlite3';
import type { AIProvider, ConversationMessage } from '../../ai/provider.js';
import type { User } from '../../db/types.js';
import { buildOnboardingPrompt } from '../../ai/prompts.js';
import { parseAIResponse } from '../../ai/parser.js';
import { getUserById, updateUser } from '../../db/queries/users.js';
import { getRecentMessages } from '../../db/queries/conversations.js';
import { createGoal } from '../../db/queries/goals.js';
import { CONVERSATION_MODES } from '../../utils/constants.js';

export async function handleOnboarding(
  db: Database.Database,
  ai: AIProvider,
  user: User,
  userMessage: string
): Promise<string> {
  // Build system prompt with current profile state
  const systemPrompt = buildOnboardingPrompt({ user });

  // Get conversation history
  const history = getRecentMessages(db, user.id, 30);
  const messages: ConversationMessage[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Add current message
  messages.push({ role: 'user', content: userMessage });

  // Get AI response
  const raw = await ai.sendMessage(systemPrompt, messages);
  const { text, data } = parseAIResponse(raw);

  // Apply extracted data to user profile
  if (data) {
    const updates: Partial<User> = {};

    if (data.name && typeof data.name === 'string') updates.name = data.name;
    if (data.belt_rank && typeof data.belt_rank === 'string') {
      updates.belt_rank = data.belt_rank as any; // includes "none" for no-gi only
    }
    if (data.experience_months != null && typeof data.experience_months === 'number') {
      updates.experience_months = data.experience_months;
    }
    if (data.preferred_game_style && typeof data.preferred_game_style === 'string') {
      updates.preferred_game_style = data.preferred_game_style;
    }
    // training_schedule: {"monday":"06:00","wednesday":"20:00"} — stored in training_days column
    if (data.training_schedule && typeof data.training_schedule === 'object' && !Array.isArray(data.training_schedule)) {
      updates.training_days = JSON.stringify(data.training_schedule);
    }
    // Legacy fallback: training_days as array
    if (Array.isArray(data.training_days)) {
      updates.training_days = JSON.stringify(data.training_days);
    }
    if (data.injuries_limitations && typeof data.injuries_limitations === 'string') {
      updates.injuries_limitations = data.injuries_limitations;
    }
    // Goals: save to goals table + keep summary on user for quick access
    if (data.goals && typeof data.goals === 'string') {
      updates.goals = data.goals;
      createGoal(db, user.id, data.goals);
      console.log(`[onboarding] Created goal for ${user.id}: "${data.goals}"`);
    }

    // Check if onboarding is complete
    if (data.onboarding_complete === true) {
      updates.onboarding_complete = 1;
      updates.conversation_mode = CONVERSATION_MODES.IDLE;
      console.log(`[onboarding] Complete for user ${user.id} (${updates.name || user.name})`);
    }

    if (Object.keys(updates).length > 0) {
      updateUser(db, user.id, updates);
    }
  }

  return text;
}
