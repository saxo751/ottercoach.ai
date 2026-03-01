import type Database from 'better-sqlite3';
import type { AIProvider, ConversationMessage, TokenUsage } from '../../ai/provider.js';
import type { User } from '../../db/types.js';
import { buildOnboardingPrompt } from '../../ai/prompts.js';
import { parseAIResponse } from '../../ai/parser.js';
import { getUserById, updateUser } from '../../db/queries/users.js';
import { getRecentMessages } from '../../db/queries/conversations.js';
import { createGoal } from '../../db/queries/goals.js';
import { CONVERSATION_MODES } from '../../utils/constants.js';
import { getMemoriesForPrompt, processMemoryExtraction } from '../../db/queries/memories.js';
import { getRecentDailyLogs } from '../../db/queries/dailyLogs.js';
import { logTokenUsage } from '../../db/queries/tokenUsage.js';
import type { HandlerResult, SystemMessage } from './types.js';

export async function handleOnboarding(
  db: Database.Database,
  ai: AIProvider,
  user: User,
  userMessage: string
): Promise<HandlerResult> {
  // Load memories for context
  const memories = getMemoriesForPrompt(db, user.id);
  const dailyLogs = getRecentDailyLogs(db, user.id, 3);

  // Build system prompt with current profile state
  const systemPrompt = buildOnboardingPrompt({ user, memories, dailyLogs });

  // Get conversation history (filter out system messages for the AI)
  const history = getRecentMessages(db, user.id, 30);
  const messages: ConversationMessage[] = history
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  // Add current message
  messages.push({ role: 'user', content: userMessage });

  // Get AI response
  const { text: raw, usage } = await ai.sendMessage(systemPrompt, messages);
  if (usage) logTokenUsage(db, user.id, 'onboarding', usage);
  const { text, data } = parseAIResponse(raw);

  // Apply extracted data to user profile
  const systemMessages: SystemMessage[] = [];

  if (data) {
    // Process memory extraction
    processMemoryExtraction(db, user.id, data, 'onboarding');

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
    const isComplete = data.onboarding_complete === true;
    if (isComplete) {
      updates.onboarding_complete = 1;
      updates.conversation_mode = CONVERSATION_MODES.IDLE;
      console.log(`[onboarding] Complete for user ${user.id} (${updates.name || user.name})`);
    }

    if (Object.keys(updates).length > 0) {
      updateUser(db, user.id, updates);

      // Build profile update system message (exclude internal fields)
      const displayFields = Object.keys(updates)
        .filter(k => k !== 'onboarding_complete' && k !== 'conversation_mode')
        .map(k => k.replace(/_/g, ' '));
      if (displayFields.length > 0) {
        systemMessages.push({ text: `Profile updated — ${displayFields.join(', ')}`, link: '/profile' });
      }
    }

    if (isComplete) {
      systemMessages.push({ text: "Onboarding complete — let's train!", link: '/dashboard' });
    }
  }

  return { text, systemMessages };
}
