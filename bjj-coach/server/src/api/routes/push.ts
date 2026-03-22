import { Router } from 'express';
import type Database from 'better-sqlite3';
import { registerPushToken, removePushToken } from '../../db/queries/channels.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function createPushRouter(db: Database.Database): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(db);

  // POST /api/push/register
  router.post('/register', requireAuth, (req, res) => {
    const userId = (req as any).userId as string;
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Push token is required' });
      return;
    }

    registerPushToken(db, userId, token);
    res.json({ success: true });
  });

  // POST /api/push/unregister
  router.post('/unregister', requireAuth, (req, res) => {
    const userId = (req as any).userId as string;
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Push token is required' });
      return;
    }

    removePushToken(db, userId, token);
    res.json({ success: true });
  });

  return router;
}
