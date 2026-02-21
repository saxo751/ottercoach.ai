import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import apiRouter from './api/router.js';
import { createDashboardRouter } from './api/routes/dashboard.js';
import { initDatabase } from './db/database.js';
import { createAIProvider } from './ai/factory.js';
import { ChannelManager } from './channels/manager.js';
import { TelegramAdapter } from './channels/telegram.js';
import { WebAdapter } from './channels/web.js';
import { CoachingEngine } from './core/engine.js';
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
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  app.use('/api', apiRouter);
  app.use('/api/dashboard', createDashboardRouter(db));

  const server = createServer(app);

  // 4. Channel adapters
  const channelManager = new ChannelManager();

  if (process.env.TELEGRAM_ENABLED === 'true') {
    const telegram = new TelegramAdapter(process.env.TELEGRAM_BOT_TOKEN!);
    channelManager.registerAdapter('telegram', telegram);
  }

  if (process.env.WEB_ENABLED === 'true') {
    const webAdapter = new WebAdapter(server, db);
    channelManager.registerAdapter('web', webAdapter);
  }

  // 5. Core coaching engine
  const engine = new CoachingEngine(db, ai, channelManager);
  engine.start();

  // 6. Start channel adapters (begins listening for messages)
  await channelManager.startAll();

  server.listen(PORT, () => {
    console.log(`[api] Listening on http://localhost:${PORT}`);
  });

  console.log('[boot] BJJ Coach Bot is running');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[shutdown] Shutting down...');
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
