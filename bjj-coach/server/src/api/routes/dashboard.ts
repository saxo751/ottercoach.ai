import { Router } from 'express';
import { Telegraf } from 'telegraf';
import type Database from 'better-sqlite3';
import { findUserByPlatformId } from '../../db/queries/channels.js';
import { verifyToken } from '../../utils/jwt.js';
import { getUserById, updateUser } from '../../db/queries/users.js';
import { getPositionsByUserId } from '../../db/queries/positions.js';
import { getTechniquesByUserId } from '../../db/queries/techniques.js';
import { getRecentSessionsByUserId } from '../../db/queries/sessions.js';
import { getActiveFocusPeriod } from '../../db/queries/focusPeriods.js';
import { getAllGoals } from '../../db/queries/goals.js';
import { getAllLibraryTechniques, getLibraryByCategory, searchLibrary } from '../../db/queries/techniqueLibrary.js';
import type { TelegramBotManager } from '../../channels/telegram.js';

export function createDashboardRouter(db: Database.Database, telegramManager?: TelegramBotManager): Router {
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
      'current_focus_area', 'goals', 'timezone',
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

    if (Object.keys(fields).length === 0) {
      res.status(400).json({ error: 'No valid fields provided' });
      return;
    }

    updateUser(db, userId, fields);
    const updated = getUserById(db, userId);
    res.json(updated);
  });

  router.get('/sessions', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const sessions = getRecentSessionsByUserId(db, (req as any).userId, limit);
    res.json(sessions);
  });

  router.get('/positions', (req, res) => {
    const positions = getPositionsByUserId(db, (req as any).userId);
    res.json(positions);
  });

  router.get('/techniques', (req, res) => {
    const techniques = getTechniquesByUserId(db, (req as any).userId);
    res.json(techniques);
  });

  router.get('/focus', (req, res) => {
    const focus = getActiveFocusPeriod(db, (req as any).userId);
    res.json(focus || null);
  });

  router.get('/goals', (req, res) => {
    const goals = getAllGoals(db, (req as any).userId);
    res.json(goals);
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
