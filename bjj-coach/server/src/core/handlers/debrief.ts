import type Database from 'better-sqlite3';
import type { AIProvider, TokenUsage } from '../../ai/provider.js';
import type { User } from '../../db/types.js';
import { buildDebriefPrompt } from '../../ai/prompts.js';
import { parseAIResponse } from '../../ai/parser.js';
import { getRecentMessages } from '../../db/queries/conversations.js';
import { getPositionsByUserId } from '../../db/queries/positions.js';
import { getTechniquesByUserId } from '../../db/queries/techniques.js';
import { getRecentSessionsByUserId, createSession } from '../../db/queries/sessions.js';
import { getActiveFocusPeriod } from '../../db/queries/focusPeriods.js';
import { getAllGoals } from '../../db/queries/goals.js';
import { setConversationMode } from '../../db/queries/users.js';
import { getUserLocalDate } from '../../utils/time.js';
import { CONVERSATION_MODES, SESSION_TYPES } from '../../utils/constants.js';
import type { SessionType } from '../../utils/constants.js';
import { prepareMessagesForAI } from './messageUtils.js';
import { getMemoriesForPrompt, processMemoryExtraction } from '../../db/queries/memories.js';
import { getRecentDailyLogs } from '../../db/queries/dailyLogs.js';
import { logTokenUsage } from '../../db/queries/tokenUsage.js';

/**
 * Post-session debrief handler.
 *
 * - Empty userMessage → system-triggered opening question (scheduler fires this)
 * - Non-empty userMessage → multi-turn conversation extracting session data
 *
 * Uses ---DATA--- extraction. When debrief_complete is true, creates a
 * training_sessions record and transitions user back to idle.
 */
export async function handleDebrief(
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
  const memories = getMemoriesForPrompt(db, user.id);
  const dailyLogs = getRecentDailyLogs(db, user.id, 3);

  const systemPrompt = buildDebriefPrompt({
    user,
    positions,
    techniques,
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
  if (usage) logTokenUsage(db, user.id, 'debrief', usage);
  const { text, data } = parseAIResponse(raw);

  console.log(`[debrief] AI response for ${user.name}: text=${text.length} chars, data=${data ? JSON.stringify(data) : 'null'}`);

  // Process extracted session data
  if (data) {
    // Process memory extraction
    processMemoryExtraction(db, user.id, data, 'debrief');

    if (data.debrief_complete === true) {
      // Create training session record
      const today = getUserLocalDate(user.timezone || 'America/New_York');
      createSession(db, user.id, today, {
        session_type: SESSION_TYPES.includes(data.session_type as SessionType) ? (data.session_type as SessionType) : null,
        duration_minutes: typeof data.duration_minutes === 'number' ? data.duration_minutes : null,
        positions_worked: (data.positions_worked as string) || null,
        techniques_worked: (data.techniques_worked as string) || null,
        wins: (data.wins as string) || null,
        struggles: (data.struggles as string) || null,
        new_techniques_learned: (data.new_techniques_learned as string) || null,
      });

      console.log(`[debrief] Session logged for user ${user.id} (${user.name}) on ${today}`);

      // Transition back to idle
      setConversationMode(db, user.id, CONVERSATION_MODES.IDLE);
    }
  }

  return text;
}
