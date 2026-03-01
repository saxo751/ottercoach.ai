import { Router } from 'express';
import { Telegraf } from 'telegraf';
import type Database from 'better-sqlite3';
import { findUserByPlatformId } from '../../db/queries/channels.js';
import { verifyToken } from '../../utils/jwt.js';
import { getUserById, updateUser } from '../../db/queries/users.js';
import { getPositionsByUserId } from '../../db/queries/positions.js';
import { getTechniquesByUserId } from '../../db/queries/techniques.js';
import { createSession, getRecentSessionsByUserId, getSessionStats, updateSession, deleteSession } from '../../db/queries/sessions.js';
import { getActiveFocusPeriod, getAllFocusPeriods, createFocusPeriod, updateFocusPeriod, deleteFocusPeriod } from '../../db/queries/focusPeriods.js';
import { getAllGoals } from '../../db/queries/goals.js';
import { getAllLibraryTechniques, getLibraryByCategory, searchLibrary, getLibraryTechniqueNames } from '../../db/queries/techniqueLibrary.js';
import type { TelegramBotManager } from '../../channels/telegram.js';
import type { AIProvider } from '../../ai/provider.js';

export function createDashboardRouter(db: Database.Database, telegramManager?: TelegramBotManager, ai?: AIProvider): Router {
  const router = Router();

  // --- Public routes (no auth required) ---

  router.get('/library', (req, res) => {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    if (search) {
      res.json(searchLibrary(db, search));
    } else if (category) {
      res.json(getLibraryByCategory(db, category));
    } else {
      res.json(getAllLibraryTechniques(db));
    }
  });

  // --- Authenticated routes ---

  // Middleware: resolve user via JWT (preferred) or legacy session ID fallback
  router.use((req, res, next) => {
    // Try JWT first
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.slice(7));
      if (payload) {
        const user = getUserById(db, payload.userId);
        if (user) {
          (req as any).userId = user.id;
          (req as any).user = user;
          return next();
        }
      }
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Fallback to legacy session ID
    const sid = req.query.sid as string;
    if (sid) {
      const user = findUserByPlatformId(db, 'web', sid);
      if (user) {
        (req as any).userId = user.id;
        (req as any).user = user;
        return next();
      }
    }

    res.status(401).json({ error: 'Authentication required' });
  });

  router.get('/profile', (req, res) => {
    const user = { ...(req as any).user };
    // Mask telegram bot token — only expose last 4 chars
    if (user.telegram_bot_token) {
      user.telegram_bot_token = '...' + user.telegram_bot_token.slice(-4);
    }
    user.has_telegram_bot = !!(req as any).user.telegram_bot_token;
    res.json(user);
  });

  router.put('/profile', (req, res) => {
    const userId = (req as any).userId as string;
    const body = req.body || {};

    const allowed = [
      'name', 'email', 'belt_rank', 'experience_months', 'preferred_game_style',
      'training_days', 'typical_training_time', 'injuries_limitations',
      'current_focus_area', 'goals', 'timezone', 'profile_picture',
    ];

    const fields: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) {
        fields[key] = body[key];
      }
    }

    if ('name' in fields && (typeof fields.name !== 'string' || !(fields.name as string).trim())) {
      res.status(400).json({ error: 'Name must be a non-empty string' });
      return;
    }

    if ('email' in fields) {
      if (typeof fields.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email as string)) {
        res.status(400).json({ error: 'Invalid email address' });
        return;
      }
    }

    if ('profile_picture' in fields) {
      const pic = fields.profile_picture;
      if (pic !== null) {
        if (typeof pic !== 'string' || !pic.startsWith('data:image/')) {
          res.status(400).json({ error: 'Profile picture must be a data URL or null' });
          return;
        }
        if (pic.length > 300_000) {
          res.status(400).json({ error: 'Profile picture is too large (max ~200KB)' });
          return;
        }
      }
    }

    if (Object.keys(fields).length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    updateUser(db, userId, fields);
    const updated = { ...getUserById(db, userId) } as any;
    // Mask telegram bot token and add has_telegram_bot (same as GET /profile)
    updated.has_telegram_bot = !!updated.telegram_bot_token;
    if (updated.telegram_bot_token) {
      updated.telegram_bot_token = '...' + updated.telegram_bot_token.slice(-4);
    }
    res.json(updated);
  });

  router.get('/sessions', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const sessions = getRecentSessionsByUserId(db, (req as any).userId, limit);
    res.json(sessions);
  });

  router.post('/sessions', (req, res) => {
    const userId = (req as any).userId as string;
    const { date, session_type, duration_minutes, wins, struggles, rolling_notes, energy_level, focus_period_id, techniques_worked } = req.body || {};

    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'date is required' });
      return;
    }

    const session = createSession(db, userId, date, {
      session_type: session_type ?? null,
      duration_minutes: duration_minutes ?? null,
      wins: wins ?? null,
      struggles: struggles ?? null,
      rolling_notes: rolling_notes ?? null,
      energy_level: energy_level ?? null,
      focus_period_id: focus_period_id ?? null,
      techniques_worked: techniques_worked ?? null,
    });

    // Re-fetch with focus_name JOIN
    const sessions = getRecentSessionsByUserId(db, userId, 1);
    res.status(201).json(sessions[0] ?? session);
  });

  router.put('/sessions/:id', (req, res) => {
    const userId = (req as any).userId as string;
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      res.status(400).json({ error: 'Invalid session id' });
      return;
    }

    const updated = updateSession(db, sessionId, userId, req.body || {});
    if (!updated) {
      res.status(404).json({ error: 'Session not found or no fields to update' });
      return;
    }

    res.json(updated);
  });

  router.delete('/sessions/:id', (req, res) => {
    const userId = (req as any).userId as string;
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      res.status(400).json({ error: 'Invalid session id' });
      return;
    }

    const deleted = deleteSession(db, sessionId, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.status(204).send();
  });

  router.get('/positions', (req, res) => {
    const positions = getPositionsByUserId(db, (req as any).userId);
    res.json(positions);
  });

  router.get('/techniques', (req, res) => {
    const techniques = getTechniquesByUserId(db, (req as any).userId);
    res.json(techniques);
  });

  router.post('/techniques/identify', async (req, res) => {
    if (!ai) {
      res.status(503).json({ error: 'AI provider not available' });
      return;
    }

    const { description } = req.body || {};
    if (!description || typeof description !== 'string') {
      res.status(400).json({ error: 'description is required' });
      return;
    }

    const libraryNames = getLibraryTechniqueNames(db);
    const userTechniques = getTechniquesByUserId(db, (req as any).userId);
    const userNames = userTechniques.map(t => t.name);

    const systemPrompt = `You are a BJJ technique identification assistant. Given a natural language description of a technique, return the most likely matching technique names.

Available techniques from the library:
${libraryNames.join(', ')}

User's known techniques:
${userNames.join(', ')}

Return ONLY a JSON array of 1-5 matching technique names, most likely first. Pick names from the lists above when possible. If the description doesn't match anything, return the closest matches. Response must be valid JSON array, nothing else.`;

    try {
      const { text } = await ai.sendMessage(systemPrompt, [
        { role: 'user', content: description },
      ], { maxTokens: 256, temperature: 0 });

      const cleaned = text.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      const suggestions = JSON.parse(cleaned) as string[];
      res.json({ suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 5) : [] });
    } catch (err) {
      console.error('[techniques/identify] Error:', err);
      res.status(500).json({ error: 'Failed to identify technique' });
    }
  });

  router.get('/focus', (req, res) => {
    const focus = getActiveFocusPeriod(db, (req as any).userId);
    res.json(focus || null);
  });

  router.get('/goals', (req, res) => {
    const goals = getAllGoals(db, (req as any).userId);
    res.json(goals);
  });

  router.get('/stats', (req, res) => {
    const stats = getSessionStats(db, (req as any).userId);
    res.json(stats);
  });

  router.get('/focus/history', (req, res) => {
    const history = getAllFocusPeriods(db, (req as any).userId);
    res.json(history);
  });

  router.post('/focus', (req, res) => {
    const userId = (req as any).userId as string;
    const { name, description, focus_techniques, focus_positions } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    // Auto-complete any existing active focus period
    const active = getActiveFocusPeriod(db, userId);
    if (active) {
      const today = new Date().toISOString().slice(0, 10);
      updateFocusPeriod(db, active.id, userId, { status: 'completed', end_date: today });
    }

    const today = new Date().toISOString().slice(0, 10);
    const period = createFocusPeriod(db, userId, name.trim(), today, {
      description: description ?? null,
      focus_techniques: focus_techniques ?? null,
      focus_positions: focus_positions ?? null,
    });

    res.status(201).json(period);
  });

  router.put('/focus/:id', (req, res) => {
    const userId = (req as any).userId as string;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid focus period id' });
      return;
    }

    const fields: Record<string, unknown> = {};
    const allowed = ['name', 'description', 'focus_techniques', 'focus_positions', 'status'];
    for (const key of allowed) {
      if (key in (req.body || {})) {
        fields[key] = req.body[key];
      }
    }

    // When completing, auto-set end_date to today
    if (fields.status === 'completed' && !('end_date' in fields)) {
      fields.end_date = new Date().toISOString().slice(0, 10);
    }

    if (Object.keys(fields).length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    const updated = updateFocusPeriod(db, id, userId, fields);
    if (!updated) {
      res.status(404).json({ error: 'Focus period not found' });
      return;
    }

    res.json(updated);
  });

  router.delete('/focus/:id', (req, res) => {
    const userId = (req as any).userId as string;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid focus period id' });
      return;
    }

    const deleted = deleteFocusPeriod(db, id, userId);
    if (!deleted) {
      res.status(400).json({ error: 'Cannot delete: focus period not found or has linked sessions' });
      return;
    }

    res.status(204).send();
  });

  // --- Telegram bot management ---

  router.post('/telegram/validate', async (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ valid: false, error: 'Token is required' });
      return;
    }

    try {
      const tempBot = new Telegraf(token.trim());
      const me = await tempBot.telegram.getMe();
      res.json({ valid: true, bot_username: me.username });
    } catch (err: any) {
      res.json({ valid: false, error: 'Invalid bot token' });
    }
  });

  router.put('/telegram/token', async (req, res) => {
    const userId = (req as any).userId as string;
    const { token } = req.body;

    if (token === null || token === '') {
      // Disconnect: clear token and stop bot
      updateUser(db, userId, { telegram_bot_token: null } as any);
      if (telegramManager) {
        await telegramManager.stopBotForUser(userId);
      }
      res.json({ success: true });
      return;
    }

    if (typeof token !== 'string') {
      res.status(400).json({ error: 'Token must be a string' });
      return;
    }

    try {
      const tempBot = new Telegraf(token.trim());
      const me = await tempBot.telegram.getMe();

      updateUser(db, userId, { telegram_bot_token: token.trim() } as any);

      if (telegramManager) {
        await telegramManager.startBotForUser(userId, token.trim());
      }

      res.json({ success: true, bot_username: me.username });
    } catch (err: any) {
      res.status(400).json({ error: 'Invalid bot token' });
    }
  });

  return router;
}
