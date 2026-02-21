import { Telegraf, Markup } from 'telegraf';
import type { ChannelAdapter, Button, MessageCallback, ButtonCallback } from './adapter.js';

export class TelegramAdapter implements ChannelAdapter {
  private bot: Telegraf;
  private messageCallbacks: MessageCallback[] = [];
  private buttonCallbacks: ButtonCallback[] = [];

  constructor(token: string) {
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');
    this.bot = new Telegraf(token);
  }

  onMessage(callback: MessageCallback): void {
    this.messageCallbacks.push(callback);
  }

  onButtonPress(callback: ButtonCallback): void {
    this.buttonCallbacks.push(callback);
  }

  async sendMessage(userId: string, text: string): Promise<void> {
    // Break long messages into chunks (Telegram limit ~4096 chars)
    const chunks = this.splitMessage(text, 4000);
    for (const chunk of chunks) {
      await this.bot.telegram.sendMessage(userId, chunk);
    }
  }

  async sendButtons(userId: string, text: string, buttons: Button[]): Promise<void> {
    const keyboard = buttons.map((b) =>
      Markup.button.callback(b.label, b.data)
    );
    // Arrange in rows of 2
    const rows: typeof keyboard[] = [];
    for (let i = 0; i < keyboard.length; i += 2) {
      rows.push(keyboard.slice(i, i + 2));
    }
    await this.bot.telegram.sendMessage(
      userId,
      text,
      Markup.inlineKeyboard(rows)
    );
  }

  async start(): Promise<void> {
    // Handle /start command
    this.bot.start((ctx) => {
      const userId = String(ctx.from.id);
      for (const cb of this.messageCallbacks) {
        cb(userId, '/start', 'telegram');
      }
    });

    // Handle text messages
    this.bot.on('text', (ctx) => {
      const userId = String(ctx.from.id);
      const text = ctx.message.text;
      for (const cb of this.messageCallbacks) {
        cb(userId, text, 'telegram');
      }
    });

    // Handle inline keyboard callbacks
    this.bot.on('callback_query', (ctx) => {
      if (!('data' in ctx.callbackQuery)) return;
      const userId = String(ctx.from.id);
      const data = ctx.callbackQuery.data;

      ctx.answerCbQuery(); // dismiss loading state

      // Treat button presses like text messages too
      for (const cb of this.buttonCallbacks) {
        cb(userId, data, 'telegram');
      }
      for (const cb of this.messageCallbacks) {
        cb(userId, data, 'telegram');
      }
    });

    // Long polling
    await this.bot.launch();
    console.log('[telegram] Bot started (long polling)');
  }

  async stop(): Promise<void> {
    this.bot.stop('shutdown');
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
      // Try to split at last newline before maxLen
      let splitAt = remaining.lastIndexOf('\n', maxLen);
      if (splitAt <= 0) splitAt = maxLen;
      chunks.push(remaining.slice(0, splitAt));
      remaining = remaining.slice(splitAt).trimStart();
    }
    return chunks;
  }
}
