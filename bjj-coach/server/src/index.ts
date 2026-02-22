import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import apiRouter from './api/router.js';
import { createDashboardRouter } from './api/routes/dashboard.js';
import { createAuthRouter } from './api/routes/auth.js';
import { createIdeasRouter } from './api/routes/ideas.js';
import { createAdminRouter } from './api/routes/admin.js';
import { initDatabase } from './db/database.js';
import { createAIProvider } from './ai/factory.js';
import { ChannelManager } from './channels/manager.js';
import { TelegramAdapter } from './channels/telegram.js';
import { WebAdapter } from './channels/web.js';
import { CoachingEngine } from './core/engine.js';
import { Scheduler } from './scheduler/scheduler.js';
import { seedTechniqueLibrary } from './db/seed/techniqueLibrary.js';

const PORT = parseInt(process.env.WEB_PORT || '3000', 10);

async function main() {
  // 1. Database
  const db = initDatabase();
  seedTechniqueLibrary(db);
  console.log('[db] SQLite initialized');

  // 2. AI Provider
  const ai = createAIProvider();
  console.log(`[ai] Provider ready (${process.env.AI_PROVIDER || 'anthropic'})`);

  // 3. Express + HTTP server (shared with WebSocket)
  const app = express();
  app.use(express.json());

  // CORS for Angular dev server
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use('/api', apiRouter);
  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/dashboard', createDashboardRouter(db));
  app.use('/api/ideas', createIdeasRouter(db));
  app.use('/api/admin', createAdminRouter(db));

  const server = createServer(app);

  // 4. Channel adapters
  const channelManager = new ChannelManager();

  if (process.env.WEB_ENABLED === 'true') {
    const webAdapter = new WebAdapter(server, db);
    channelManager.registerAdapter('web', webAdapter);
  }

  if (process.env.TELEGRAM_ENABLED === 'true') {
    const telegram = new TelegramAdapter(process.env.TELEGRAM_BOT_TOKEN!);
    channelManager.registerAdapter('telegram', telegram);
  }

  // 5. Core coaching engine
  const engine = new CoachingEngine(db, ai, channelManager);
  engine.start();

  // 6. Scheduler (pre-session briefings + post-session debriefs)
  const scheduler = new Scheduler(db, ai, channelManager);
  scheduler.start();

  // 7. Start HTTP server first (so Railway sees a listening port)
  server.listen(PORT, () => {
    console.log(`[api] Listening on http://localhost:${PORT}`);
  });

  // 8. Start channel adapters (begins listening for messages)
  await channelManager.startAll();

  console.log('[boot] BJJ Coach Bot is running');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[shutdown] Shutting down...');
    scheduler.stop();
    await channelManager.stopAll();
    server.close();
    db.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
