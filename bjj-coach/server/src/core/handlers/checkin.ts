import type Database from 'better-sqlite3';
import type { AIProvider, ConversationMessage, TokenUsage } from '../../ai/provider.js';
import type { User } from '../../db/types.js';
import { buildCheckInPrompt } from '../../ai/prompts.js';
import { parseAIResponse } from '../../ai/parser.js';
import { getRecentMessages } from '../../db/queries/conversations.js';
import { getRecentSessionsByUserId } from '../../db/queries/sessions.js';
import { getActiveFocusPeriod } from '../../db/queries/focusPeriods.js';
import { getAllGoals } from '../../db/queries/goals.js';
import { setConversationMode } from '../../db/queries/users.js';
import { CONVERSATION_MODES } from '../../utils/constants.js';
import { prepareMessagesForAI } from './messageUtils.js';
import type { HandlerResult, SystemMessage } from './types.js';
import { getMemoriesForPrompt, processMemoryExtraction } from '../../db/queries/memories.js';
import { getRecentDailyLogs } from '../../db/queries/dailyLogs.js';
import { logTokenUsage } from '../../db/queries/tokenUsage.js';

/**
 * Morning check-in handler.
 *
 * - Empty userMessage → system-triggered proactive message (scheduler fires this)
 * - Non-empty userMessage → user responding to the check-in
 *
 * Uses ---DATA--- extraction. When checkin_complete is true, transitions
 * user back to idle so the briefing can fire later.
 */
export async function handleCheckIn(
  db: Database.Database,
  ai: AIProvider,
  user: User,
  userMessage: string
): Promise<HandlerResult> {
  // Gather context (lighter than briefing — no positions/techniques needed)
  const recentSessions = getRecentSessionsByUserId(db, user.id, 5);
  const activeFocus = getActiveFocusPeriod(db, user.id);
  const goals = getAllGoals(db, user.id);
  const memories = getMemoriesForPrompt(db, user.id);
  const dailyLogs = getRecentDailyLogs(db, user.id, 3);

  const systemPrompt = buildCheckInPrompt({
    user,
    recentSessions,
    activeFocus,
    goals,
    memories,
    dailyLogs,
  });

  // Get conversation history and prepare for AI
  const history = getRecentMessages(db, user.id, 30);
  const messages = prepareMessagesForAI(history, userMessage);

  const { text: raw, usage } = await ai.sendMessage(systemPrompt, messages);
  if (usage) logTokenUsage(db, user.id, 'check_in', usage);
  const { text, data } = parseAIResponse(raw);

  // Process extracted check-in data
  const systemMessages: SystemMessage[] = [];

  if (data) {
    // Process memory extraction
    processMemoryExtraction(db, user.id, data, 'check_in');

    if (data.checkin_complete === true) {
      console.log(`[checkin] Complete for user ${user.id} (${user.name}) — training: ${data.training_confirmed}, rest: ${data.rest_day}`);

      systemMessages.push({ text: 'Check-in noted', link: '/dashboard' });

      // Transition back to idle so briefing can fire
      setConversationMode(db, user.id, CONVERSATION_MODES.IDLE);
    }
  }

  return { text, systemMessages };
}
