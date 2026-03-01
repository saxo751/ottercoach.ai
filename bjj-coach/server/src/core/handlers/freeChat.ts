import type Database from 'better-sqlite3';
import type { AIProvider, ConversationMessage, TokenUsage } from '../../ai/provider.js';
import type { User } from '../../db/types.js';
import { buildFreeChatPrompt } from '../../ai/prompts.js';
import { parseAIResponse } from '../../ai/parser.js';
import { getRecentMessages } from '../../db/queries/conversations.js';
import { getPositionsByUserId } from '../../db/queries/positions.js';
import { getTechniquesByUserId } from '../../db/queries/techniques.js';
import { getRecentSessionsByUserId, createSession } from '../../db/queries/sessions.js';
import { getActiveFocusPeriod } from '../../db/queries/focusPeriods.js';
import { getAllGoals } from '../../db/queries/goals.js';
import { updateUser } from '../../db/queries/users.js';
import { getMemoriesForPrompt, processMemoryExtraction } from '../../db/queries/memories.js';
import { getRecentDailyLogs } from '../../db/queries/dailyLogs.js';
import { logTokenUsage } from '../../db/queries/tokenUsage.js';
import { getUserLocalDate } from '../../utils/time.js';
import type { SessionType } from '../../utils/constants.js';
import { SESSION_TYPES } from '../../utils/constants.js';
import type { HandlerResult, SystemMessage } from './types.js';

export async function handleFreeChat(
  db: Database.Database,
  ai: AIProvider,
  user: User,
  userMessage: string
): Promise<HandlerResult> {
  // Gather full context
  const positions = getPositionsByUserId(db, user.id);
  const techniques = getTechniquesByUserId(db, user.id);
  const recentSessions = getRecentSessionsByUserId(db, user.id, 10);
  const activeFocus = getActiveFocusPeriod(db, user.id);
  const goals = getAllGoals(db, user.id);
  const memories = getMemoriesForPrompt(db, user.id);
  const dailyLogs = getRecentDailyLogs(db, user.id, 3);

  // Build system prompt with all context including memories
  const systemPrompt = buildFreeChatPrompt({
    user,
    positions,
    techniques,
    recentSessions,
    activeFocus,
    goals,
    memories,
    dailyLogs,
  });

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

  // Get AI response — now with DATA extraction
  const { text: raw, usage } = await ai.sendMessage(systemPrompt, messages);
  if (usage) logTokenUsage(db, user.id, 'free_chat', usage);
  const { text, data } = parseAIResponse(raw);

  // Process extracted data
  const systemMessages: SystemMessage[] = [];

  if (data) {
    // Memory extraction
    processMemoryExtraction(db, user.id, data, 'free_chat');

    // Session logging — capture training reported during free chat
    if (data.session && typeof data.session === 'object') {
      const s = data.session as Record<string, unknown>;
      const today = getUserLocalDate(user.timezone || 'America/New_York');
      const sessionType = SESSION_TYPES.includes(s.session_type as SessionType) ? (s.session_type as SessionType) : null;
      const durationMin = typeof s.duration_minutes === 'number' ? s.duration_minutes : null;

      createSession(db, user.id, today, {
        session_type: sessionType,
        duration_minutes: durationMin,
        positions_worked: (s.positions_worked as string) || null,
        techniques_worked: s.techniques_worked && typeof s.techniques_worked === 'object' ? JSON.stringify(s.techniques_worked) : (s.techniques_worked as string) || null,
        wins: (s.wins as string) || null,
        struggles: (s.struggles as string) || null,
        new_techniques_learned: (s.new_techniques_learned as string) || null,
        focus_period_id: activeFocus?.id ?? null,
      });
      console.log(`[free_chat] Session logged for user ${user.id} (${user.name}) on ${today}`);

      const parts: string[] = [];
      if (sessionType) parts.push(sessionType);
      if (durationMin) parts.push(`${durationMin}min`);
      systemMessages.push({ text: `Session logged${parts.length ? ' — ' + parts.join(', ') : ''}`, link: '/dashboard' });
    }

    // Profile updates — capture schedule changes, goal updates, etc.
    if (data.profile_updates && typeof data.profile_updates === 'object') {
      const p = data.profile_updates as Record<string, unknown>;
      const updates: Partial<User> = {};

      if (p.training_schedule && typeof p.training_schedule === 'object' && !Array.isArray(p.training_schedule)) {
        updates.training_days = JSON.stringify(p.training_schedule);
      }
      if (p.goals && typeof p.goals === 'string') updates.goals = p.goals;
      if (p.injuries_limitations && typeof p.injuries_limitations === 'string') updates.injuries_limitations = p.injuries_limitations;
      if (p.preferred_game_style && typeof p.preferred_game_style === 'string') updates.preferred_game_style = p.preferred_game_style;
      if (p.current_focus_area && typeof p.current_focus_area === 'string') updates.current_focus_area = p.current_focus_area;

      if (Object.keys(updates).length > 0) {
        updateUser(db, user.id, updates);
        const fieldNames = Object.keys(updates).map(k => k.replace(/_/g, ' '));
        systemMessages.push({ text: `Profile updated — ${fieldNames.join(', ')}`, link: '/profile' });
        console.log(`[free_chat] Profile updated for user ${user.id} (${user.name}):`, Object.keys(updates));
      }
    }
  }

  return { text: text.trim(), systemMessages };
}
