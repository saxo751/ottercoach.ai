import type Database from 'better-sqlite3';
import type { AIProvider, ConversationMessage } from '../../ai/provider.js';
import type { User } from '../../db/types.js';
import { buildFreeChatPrompt } from '../../ai/prompts.js';
import { getRecentMessages } from '../../db/queries/conversations.js';
import { getPositionsByUserId } from '../../db/queries/positions.js';
import { getTechniquesByUserId } from '../../db/queries/techniques.js';
import { getRecentSessionsByUserId } from '../../db/queries/sessions.js';
import { getActiveFocusPeriod } from '../../db/queries/focusPeriods.js';
import { getAllGoals } from '../../db/queries/goals.js';

export async function handleFreeChat(
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

  // Build system prompt with all context
  const systemPrompt = buildFreeChatPrompt({
    user,
    positions,
    techniques,
    recentSessions,
    activeFocus,
    goals,
  });

  // Get conversation history
  const history = getRecentMessages(db, user.id, 30);
  const messages: ConversationMessage[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Add current message
  messages.push({ role: 'user', content: userMessage });

  // Get AI response (no data extraction in free chat)
  const response = await ai.sendMessage(systemPrompt, messages);
  return response.trim();
}
