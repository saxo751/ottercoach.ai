import { Telegraf, Markup } from 'telegraf';
import type Database from 'better-sqlite3';
import type { ChannelAdapter, Button, MessageCallback, ButtonCallback } from './adapter.js';
import { createUserChannel } from '../db/queries/channels.js';

interface ManagedBot {
  bot: Telegraf;
  ownerUserId: string;
  linkedTelegramId: string | null;
  token: string;
}

export class TelegramBotManager implements ChannelAdapter {
  private bots = new Map<string, ManagedBot>();              // ownerUserId → bot
  private telegramIdToBot = new Map<string, ManagedBot>();   // telegramId → bot (direct ref)
  private messageCallbacks: MessageCallback[] = [];
  private buttonCallbacks: ButtonCallback[] = [];

  constructor(private db: Database.Database) {}

  onMessage(callback: MessageCallback): void {
    this.messageCallbacks.push(callback);
  }

  onButtonPress(callback: ButtonCallback): void {
    this.buttonCallbacks.push(callback);
  }

  async sendMessage(telegramUserId: string, text: string): Promise<void> {
    console.log(`[telegram] sendMessage to ${telegramUserId}: "${text.substring(0, 80)}..."`);

    const managed = this.telegramIdToBot.get(telegramUserId);
    if (!managed) {
      console.warn(`[telegram] No bot found for telegram user ${telegramUserId}`);
      console.warn(`[telegram] reverseMap size=${this.telegramIdToBot.size}, bots size=${this.bots.size}`);
      return;
    }

    try {
      const chunks = this.splitMessage(text, 4000);
      for (const chunk of chunks) {
        await managed.bot.telegram.sendMessage(telegramUserId, chunk);
      }
      console.log(`[telegram] ✓ Message sent`);
    } catch (err) {
      console.error(`[telegram] ✗ Failed to send message:`, (err as Error).message);
    }
  }

  async sendButtons(telegramUserId: string, text: string, buttons: Button[]): Promise<void> {
    console.log(`[telegram] sendButtons to ${telegramUserId}: "${text.substring(0, 80)}..."`);
    const managed = this.telegramIdToBot.get(telegramUserId);
    if (!managed) {
      console.warn(`[telegram] sendButtons: no bot found for telegram user ${telegramUserId}`);
      return;
    }

    const keyboard = buttons.map((b) =>
      Markup.button.callback(b.label, b.data)
    );
    const rows: typeof keyboard[] = [];
    for (let i = 0; i < keyboard.length; i += 2) {
      rows.push(keyboard.slice(i, i + 2));
    }
    await managed.bot.telegram.sendMessage(
      telegramUserId,
      text,
      Markup.inlineKeyboard(rows)
    );
  }

  /** Load all users with tokens from DB and start their bots. */
  async start(): Promise<void> {
    const rows = this.db.prepare(
      'SELECT id, telegram_bot_token FROM users WHERE telegram_bot_token IS NOT NULL'
    ).all() as { id: string; telegram_bot_token: string }[];

    console.log(`[telegram] Found ${rows.length} user(s) with bot tokens`);

    // Pre-populate linked Telegram IDs from existing user_channels
    const channels = this.db.prepare(
      "SELECT user_id, platform_user_id FROM user_channels WHERE platform = 'telegram'"
    ).all() as { user_id: string; platform_user_id: string }[];

    const channelMap = new Map<string, string>();
    for (const ch of channels) {
      channelMap.set(ch.user_id, ch.platform_user_id);
    }

    for (const row of rows) {
      const linkedTelegramId = channelMap.get(row.id) || null;
      try {
        await this.startBotForUser(row.id, row.telegram_bot_token, linkedTelegramId);
      } catch (err) {
        console.warn(`[telegram] Failed to start bot for user ${row.id}:`, (err as Error).message);
      }
    }

    const botCount = this.bots.size;
    console.log(`[telegram] Bot manager started (${botCount} bot${botCount !== 1 ? 's' : ''} active)`);
  }

  /** Start a bot for a specific user. */
  async startBotForUser(userId: string, token: string, linkedTelegramId?: string | null): Promise<void> {
    // Stop existing bot for this user if any
    if (this.bots.has(userId)) {
      await this.stopBotForUser(userId);
    }

    const bot = new Telegraf(token);
    const managed: ManagedBot = {
      bot,
      ownerUserId: userId,
      linkedTelegramId: linkedTelegramId ?? null,
      token,
    };

    // Pre-populate reverse map if already linked
    if (managed.linkedTelegramId) {
      this.telegramIdToBot.set(managed.linkedTelegramId, managed);
    }

    // Handle /start command
    bot.start((ctx) => {
      const telegramId = String(ctx.from.id);
      this.handleIncomingMessage(managed, telegramId, '/start', ctx);
    });

    // Handle text messages
    bot.on('text', (ctx) => {
      const telegramId = String(ctx.from.id);
      const text = ctx.message.text;
      this.handleIncomingMessage(managed, telegramId, text, ctx);
    });

    // Handle inline keyboard callbacks
    bot.on('callback_query', (ctx) => {
      if (!('data' in ctx.callbackQuery)) return;
      const telegramId = String(ctx.from.id);
      const data = ctx.callbackQuery.data;

      ctx.answerCbQuery();

      if (!this.isAuthorized(managed, telegramId)) {
        ctx.reply('This is a private coaching bot.');
        return;
      }

      for (const cb of this.buttonCallbacks) {
        cb(telegramId, data, 'telegram');
      }
      for (const cb of this.messageCallbacks) {
        cb(telegramId, data, 'telegram');
      }
    });

    // Launch polling
    await bot.launch();
    this.bots.set(userId, managed);

    console.log(`[telegram] Bot started for user ${userId}${managed.linkedTelegramId ? ' (linked to ' + managed.linkedTelegramId + ')' : ' (awaiting /start)'} (${this.messageCallbacks.length} callbacks)`);
  }

  /** Stop a user's bot and clean up maps. */
  async stopBotForUser(userId: string): Promise<void> {
    const managed = this.bots.get(userId);
    if (!managed) return;

    managed.bot.stop('shutdown');
    this.bots.delete(userId);

    if (managed.linkedTelegramId) {
      this.telegramIdToBot.delete(managed.linkedTelegramId);
    }

    console.log(`[telegram] Bot stopped for user ${userId}`);
  }

  /** Stop and restart a user's bot with a new token. */
  async restartBotForUser(userId: string, token: string): Promise<void> {
    // Preserve linked telegram ID from existing bot
    const existing = this.bots.get(userId);
    const linkedTelegramId = existing?.linkedTelegramId || null;

    await this.stopBotForUser(userId);
    await this.startBotForUser(userId, token, linkedTelegramId);
  }

  /** Check if a user has an active bot. */
  hasBotForUser(userId: string): boolean {
    return this.bots.has(userId);
  }

  async stop(): Promise<void> {
    for (const [userId, managed] of this.bots) {
      managed.bot.stop('shutdown');
      console.log(`[telegram] Bot stopped for user ${userId}`);
    }
    this.bots.clear();
    this.telegramIdToBot.clear();
  }

  /** Handle incoming message with authorization/linking logic. */
  private handleIncomingMessage(managed: ManagedBot, telegramId: string, text: string, ctx: any): void {
    console.log(`[telegram] 📩 Incoming from ${telegramId}: "${text}" (owner=${managed.ownerUserId}, linked=${managed.linkedTelegramId})`);

    // If not yet linked, link this telegram ID as the owner
    if (!managed.linkedTelegramId) {
      managed.linkedTelegramId = telegramId;
      this.telegramIdToBot.set(telegramId, managed);

      // Create user_channels mapping
      try {
        createUserChannel(this.db, managed.ownerUserId, 'telegram', telegramId);
      } catch (err: any) {
        // UNIQUE constraint — already exists
        if (!err.message?.includes('UNIQUE')) {
          console.error('[telegram] Failed to create channel:', err.message);
        }
      }

      // Set telegram as primary channel (so scheduler sends there)
      this.db.prepare(
        "UPDATE user_channels SET is_primary = 0 WHERE user_id = ? AND platform != 'telegram'"
      ).run(managed.ownerUserId);
      this.db.prepare(
        "UPDATE user_channels SET is_primary = 1 WHERE user_id = ? AND platform = 'telegram'"
      ).run(managed.ownerUserId);

      console.log(`[telegram] Linked telegram user ${telegramId} to user ${managed.ownerUserId}`);
    }

    // Reject unauthorized users
    if (!this.isAuthorized(managed, telegramId)) {
      console.log(`[telegram] ✗ Rejected unauthorized user ${telegramId}`);
      ctx.reply('This is a private coaching bot.');
      return;
    }

    // Fire callbacks
    console.log(`[telegram] 💬 Firing ${this.messageCallbacks.length} callbacks for ${telegramId}`);
    for (const cb of this.messageCallbacks) {
      try {
        cb(telegramId, text, 'telegram');
      } catch (err) {
        console.error(`[telegram] Callback error:`, (err as Error).message);
      }
    }
  }

  /** Check if telegram user is the owner of this bot. */
  private isAuthorized(managed: ManagedBot, telegramId: string): boolean {
    return managed.linkedTelegramId === telegramId;
  }

  private splitMessage(text: string, maxLen: number): string[] {
    if (text.length <= maxLen) return [text];
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= maxLen) {
        chunks.push(remaining);
        break;
      }
      let splitAt = remaining.lastIndexOf('\n', maxLen);
      if (splitAt <= 0) splitAt = maxLen;
      chunks.push(remaining.slice(0, splitAt));
      remaining = remaining.slice(splitAt).trimStart();
    }
    return chunks;
  }
}
