import { Router } from 'express';
import type Database from 'better-sqlite3';
import { verifyToken } from '../../utils/jwt.js';
import { getUserById } from '../../db/queries/users.js';
import {
  createIdea,
  getAllIdeas,
  getIdeaById,
  toggleVote,
  createComment,
  getCommentsByIdeaId,
} from '../../db/queries/ideas.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function createIdeasRouter(db: Database.Database): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(db);

  // Optional auth: parse JWT if present, don't fail without it
  const optionalAuth = (req: any, _res: any, next: any) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const payload = verifyToken(header.slice(7));
      if (payload) {
        const user = getUserById(db, payload.userId);
        if (user) {
          req.userId = user.id;
        }
      }
    }
    next();
  };

  // GET /api/ideas?sort=newest|top
  router.get('/', optionalAuth, (req, res) => {
    const sort = req.query.sort === 'top' ? 'top' : 'newest';
    const ideas = getAllIdeas(db, sort, (req as any).userId);
    res.json(ideas);
  });

  // GET /api/ideas/:id/comments
  router.get('/:id/comments', (req, res) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid idea ID' });
      return;
    }
    const comments = getCommentsByIdeaId(db, id);
    res.json(comments);
  });

  // POST /api/ideas — auth required
  router.post('/', requireAuth, (req, res) => {
    const { title, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    if (title.length > 200) {
      res.status(400).json({ error: 'Title must be 200 characters or less' });
      return;
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      res.status(400).json({ error: 'Description is required' });
      return;
    }
    if (description.length > 2000) {
      res.status(400).json({ error: 'Description must be 2000 characters or less' });
      return;
    }

    const idea = createIdea(db, (req as any).userId, title.trim(), description.trim());
    res.status(201).json(idea);
  });

  // POST /api/ideas/:id/vote — auth required, toggles
  router.post('/:id/vote', requireAuth, (req, res) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid idea ID' });
      return;
    }

    const idea = getIdeaById(db, id);
    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    const result = toggleVote(db, id, (req as any).userId);
    res.json(result);
  });

  // POST /api/ideas/:id/comments — auth required
  router.post('/:id/comments', requireAuth, (req, res) => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid idea ID' });
      return;
    }

    const idea = getIdeaById(db, id);
    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'Comment content is required' });
      return;
    }
    if (content.length > 1000) {
      res.status(400).json({ error: 'Comment must be 1000 characters or less' });
      return;
    }

    const comment = createComment(db, id, (req as any).userId, content.trim());
    res.status(201).json(comment);
  });

  return router;
}
