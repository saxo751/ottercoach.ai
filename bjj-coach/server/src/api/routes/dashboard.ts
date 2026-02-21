import { Router } from 'express';
import type Database from 'better-sqlite3';
import { findUserByPlatformId } from '../../db/queries/channels.js';
import { getPositionsByUserId } from '../../db/queries/positions.js';
import { getTechniquesByUserId } from '../../db/queries/techniques.js';
import { getRecentSessionsByUserId } from '../../db/queries/sessions.js';
import { getActiveFocusPeriod } from '../../db/queries/focusPeriods.js';
import { getAllGoals } from '../../db/queries/goals.js';
import { getAllLibraryTechniques, getLibraryByCategory, searchLibrary } from '../../db/queries/techniqueLibrary.js';

export function createDashboardRouter(db: Database.Database): Router {
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

  // Middleware: resolve session ID → user
  router.use((req, res, next) => {
    const sid = req.query.sid as string;
    if (!sid) {
      res.status(400).json({ error: 'Missing sid query parameter' });
      return;
    }

    const user = findUserByPlatformId(db, 'web', sid);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    (req as any).userId = user.id;
    (req as any).user = user;
    next();
  });

  router.get('/profile', (req, res) => {
    res.json((req as any).user);
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

  return router;
}
