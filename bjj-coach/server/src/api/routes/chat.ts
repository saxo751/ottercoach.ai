import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { AIProvider } from '../../ai/provider.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { getMessagesSince, getRecentMessages, addMessage } from '../../db/queries/conversations.js';
import { getUserById, setConversationMode } from '../../db/queries/users.js';
import { CONVERSATION_MODES } from '../../utils/constants.js';
import { handleFreeChat } from '../../core/handlers/freeChat.js';
import { handleOnboarding } from '../../core/handlers/onboarding.js';
import { handleBriefing } from '../../core/handlers/briefing.js';
import { handleDebrief } from '../../core/handlers/debrief.js';
import { handleCheckIn } from '../../core/handlers/checkin.js';

export function createChatRouter(db: Database.Database, ai: AIProvider): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(db);
  router.use(requireAuth);

  // GET /api/chat/history?since=ISO8601&limit=100
  router.get('/history', (req, res) => {
    const userId = (req as any).userId as string;
    const since = req.query.since as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;

    let messages;
    if (since) {
      messages = getMessagesSince(db, userId, since, limit);
    } else {
      messages = getRecentMessages(db, userId, limit);
    }

    res.json({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      })),
    });
  });

  // POST /api/chat/messages — REST fallback for sending messages when WebSocket is down
  router.post('/messages', async (req, res) => {
    const userId = (req as any).userId as string;
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const user = getUserById(db, userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Store user message
    addMessage(db, userId, 'user', text, 'mobile');

    // Route by conversation mode (mirrors CoachingEngine.handleIncoming)
    let result;
    const currentUser = getUserById(db, userId)!;

    if (text === '/start' && !currentUser.onboarding_complete) {
      setConversationMode(db, userId, CONVERSATION_MODES.ONBOARDING);
      const freshUser = getUserById(db, userId)!;
      result = await handleOnboarding(db, ai, freshUser, text);
    } else {
      switch (currentUser.conversation_mode) {
        case CONVERSATION_MODES.ONBOARDING:
          result = await handleOnboarding(db, ai, currentUser, text);
          break;
        case CONVERSATION_MODES.IDLE:
          setConversationMode(db, userId, CONVERSATION_MODES.FREE_CHAT);
          result = await handleFreeChat(db, ai, getUserById(db, userId)!, text);
          break;
        case CONVERSATION_MODES.FREE_CHAT:
          result = await handleFreeChat(db, ai, currentUser, text);
          break;
        case CONVERSATION_MODES.CHECK_IN:
          result = await handleCheckIn(db, ai, currentUser, text);
          break;
        case CONVERSATION_MODES.BRIEFING:
          result = await handleBriefing(db, ai, currentUser, text);
          break;
        case CONVERSATION_MODES.DEBRIEF:
          result = await handleDebrief(db, ai, currentUser, text);
          break;
        default:
          result = await handleFreeChat(db, ai, currentUser, text);
      }
    }

    // Store AI response
    addMessage(db, userId, 'assistant', result.text, 'mobile');

    // Store system messages
    if (result.systemMessages?.length) {
      for (const sysMsg of result.systemMessages) {
        addMessage(db, userId, 'system', sysMsg.text, 'mobile');
      }
    }

    res.json({
      text: result.text,
      systemMessages: result.systemMessages || [],
    });
  });

  return router;
}
