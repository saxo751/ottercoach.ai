import type Database from 'better-sqlite3';
import type { AIProvider, ConversationMessage } from '../../ai/provider.js';
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
): Promise<string> {
  // Gather context (lighter than briefing — no positions/techniques needed)
  const recentSessions = getRecentSessionsByUserId(db, user.id, 5);
  const activeFocus = getActiveFocusPeriod(db, user.id);
  const goals = getAllGoals(db, user.id);

  const systemPrompt = buildCheckInPrompt({
    user,
    recentSessions,
    activeFocus,
    goals,
  });

  // Get conversation history and prepare for AI
  const history = getRecentMessages(db, user.id, 30);
  const messages = prepareMessagesForAI(history, userMessage);

  const raw = await ai.sendMessage(systemPrompt, messages);
  const { text, data } = parseAIResponse(raw);

  // Process extracted check-in data
  if (data) {
    if (data.checkin_complete === true) {
      console.log(`[checkin] Complete for user ${user.id} (${user.name}) — training: ${data.training_confirmed}, rest: ${data.rest_day}`);

      // Transition back to idle so briefing can fire
      setConversationMode(db, user.id, CONVERSATION_MODES.IDLE);
    }
  }

  return text;
}
