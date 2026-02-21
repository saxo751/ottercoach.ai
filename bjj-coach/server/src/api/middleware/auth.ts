import type { Request, Response, NextFunction } from 'express';
import type Database from 'better-sqlite3';
import { verifyToken } from '../../utils/jwt.js';
import { getUserById } from '../../db/queries/users.js';

export function createAuthMiddleware(db: Database.Database) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }

    const payload = verifyToken(header.slice(7));
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const user = getUserById(db, payload.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    (req as any).userId = user.id;
    (req as any).user = user;
    next();
  };
}
