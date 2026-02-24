import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Telegraf } from 'telegraf';
import type Database from 'better-sqlite3';
import { createUser, getUserById } from '../../db/queries/users.js';
import { createUserChannel } from '../../db/queries/channels.js';
import { findUserByEmail } from '../../db/queries/auth.js';
import { signToken } from '../../utils/jwt.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import type { TelegramBotManager } from '../../channels/telegram.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10;

export function createAuthRouter(db: Database.Database, telegramManager?: TelegramBotManager): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(db);

  // POST /api/auth/signup
  router.post('/signup', async (req, res) => {
    try {
      const { email, password, name, belt_rank, experience_months, training_days, goals, telegram_bot_token } = req.body;

      if (!email || !EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: 'Valid email is required' });
        return;
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }

      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const existing = findUserByEmail(db, email.toLowerCase());
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Validate Telegram bot token if provided
      let validatedTelegramToken: string | null = null;
      let telegramBotUsername: string | undefined;
      if (telegram_bot_token && typeof telegram_bot_token === 'string') {
        try {
          const tempBot = new Telegraf(telegram_bot_token.trim());
          const me = await tempBot.telegram.getMe();
          validatedTelegramToken = telegram_bot_token.trim();
          telegramBotUsername = me.username;
        } catch {
          // Invalid token — don't block signup, just skip it
        }
      }

      const user = createUser(db, {
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: name.trim(),
        belt_rank: belt_rank || null,
        experience_months: experience_months != null ? Number(experience_months) : null,
        training_days: training_days || null,
        goals: goals || null,
        telegram_bot_token: validatedTelegramToken,
        conversation_mode: 'onboarding',
        onboarding_complete: 0,
      });

      // Create web channel mapping using user's internal ID
      createUserChannel(db, user.id, 'web', user.id);

      // Start Telegram bot if token was provided and valid
      if (validatedTelegramToken && telegramManager) {
        try {
          await telegramManager.startBotForUser(user.id, validatedTelegramToken);
        } catch (err) {
          console.warn('[auth] Failed to start Telegram bot for new user:', (err as Error).message);
        }
      }

      const jwt = signToken({ userId: user.id, email: user.email! });

      res.status(201).json({
        token: jwt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          belt_rank: user.belt_rank,
          onboarding_complete: user.onboarding_complete,
        },
      });
    } catch (err: any) {
      console.error('[auth] Signup error:', err.message);
      res.status(500).json({ error: 'Failed to create account' });
    }
  });

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: 'Valid email is required' });
        return;
      }

      if (!password) {
        res.status(400).json({ error: 'Password is required' });
        return;
      }

      const user = findUserByEmail(db, email.toLowerCase());
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      if (!user.password_hash) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const jwt = signToken({ userId: user.id, email: user.email! });

      res.json({
        token: jwt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          belt_rank: user.belt_rank,
          onboarding_complete: user.onboarding_complete,
        },
      });
    } catch (err: any) {
      console.error('[auth] Login error:', err.message);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // POST /api/auth/validate-telegram (unauthenticated — for signup wizard)
  router.post('/validate-telegram', async (req, res) => {
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

  // GET /api/auth/me (protected)
  router.get('/me', authMiddleware, (req, res) => {
    const user = (req as any).user;
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      belt_rank: user.belt_rank,
      onboarding_complete: user.onboarding_complete,
    });
  });

  return router;
}
