import type Database from 'better-sqlite3';
import type { AIProvider } from '../../ai/provider.js';
import type { User } from '../../db/types.js';
import { buildBriefingPrompt } from '../../ai/prompts.js';
import { getRecentMessages } from '../../db/queries/conversations.js';
import { getPositionsByUserId } from '../../db/queries/positions.js';
import { getTechniquesByUserId } from '../../db/queries/techniques.js';
import { getRecentSessionsByUserId } from '../../db/queries/sessions.js';
import { getActiveFocusPeriod } from '../../db/queries/focusPeriods.js';
import { getAllGoals } from '../../db/queries/goals.js';
import { prepareMessagesForAI } from './messageUtils.js';

/**
 * Pre-session briefing handler.
 *
 * - Empty userMessage → system-triggered proactive message (scheduler fires this)
 * - Non-empty userMessage → user responding to the briefing (e.g. "yes" or "rest day")
 */
export async function handleBriefing(
  db: Database.Database,
  ai: AIProvider,
  user: User,
  userMessage: string
): Promise<string> {
  // Gather full context
  const positions = getPositionsByUserId(db, user.id);
  const techniques = getTechniquesByUserId(db, user.id);
  const recentSessions = getRecentSessionsByUserId(db, user.id, 10);
  const activeFocus = getActiveFocusPeriod(db, user.id);
  const goals = getAllGoals(db, user.id);

  const systemPrompt = buildBriefingPrompt({
    user,
    positions,
    techniques,
    recentSessions,
    activeFocus,
    goals,
  });

  // Get conversation history and prepare for AI
  const history = getRecentMessages(db, user.id, 30);
  const messages = prepareMessagesForAI(history, userMessage);

  const response = await ai.sendMessage(systemPrompt, messages);
  return response.trim();
}
