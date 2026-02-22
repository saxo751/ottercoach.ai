import { Router } from 'express';
import type Database from 'better-sqlite3';

export function createAdminRouter(db: Database.Database): Router {
  const router = Router();

  // Simple secret check — set ADMIN_SECRET in Railway env vars
  router.use((req, res, next) => {
    const secret = req.query.secret || req.headers['x-admin-secret'];
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  });

  // List all tables
  router.get('/tables', (_req, res) => {
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all();
    res.json(tables);
  });

  // Browse a table: GET /api/admin/table/:name?limit=50&offset=0
  router.get('/table/:name', (req, res) => {
    const tableName = req.params.name;
    // Validate table name to prevent SQL injection
    const validTables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all().map((t: any) => t.name);

    if (!validTables.includes(tableName)) {
      res.status(404).json({ error: `Table "${tableName}" not found` });
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const offset = Number(req.query.offset) || 0;

    const rows = db.prepare(`SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`).all(limit, offset);
    const count = (db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get() as any).count;

    res.json({ table: tableName, count, limit, offset, rows });
  });

  return router;
}
