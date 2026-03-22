import type { ChannelAdapter, MessageCallback, ButtonCallback, Button } from './adapter.js';
import type { Platform } from '../utils/constants.js';
import type Database from 'better-sqlite3';
import { getUserPushTokens, removeStaleTokens } from '../db/queries/channels.js';
import { sendPushToMultiple, type PushPayload } from '../push/push-service.js';
import type { WebAdapter } from './web.js';

export class ChannelManager {
  private adapters = new Map<Platform, ChannelAdapter>();
  private db: Database.Database | null = null;

  setDatabase(db: Database.Database): void {
    this.db = db;
  }

  registerAdapter(platform: Platform, adapter: ChannelAdapter): void {
    this.adapters.set(platform, adapter);
  }

  /** Register a message callback on all adapters. */
  onMessage(callback: MessageCallback): void {
    for (const adapter of this.adapters.values()) {
      adapter.onMessage(callback);
    }
  }

  /** Register a button callback on all adapters. */
  onButtonPress(callback: ButtonCallback): void {
    for (const adapter of this.adapters.values()) {
      adapter.onButtonPress(callback);
    }
  }

  /** Send a text message through a specific platform adapter. */
  async sendMessage(platform: Platform, userId: string, text: string): Promise<void> {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      console.warn(`[channels] No adapter for platform: ${platform}`);
      return;
    }
    await adapter.sendMessage(userId, text);
  }

  /** Send a system confirmation message through a specific platform adapter. */
  async sendSystemMessage(platform: Platform, userId: string, text: string, link?: string): Promise<void> {
    const adapter = this.adapters.get(platform);
    if (!adapter) return;
    await adapter.sendSystemMessage(userId, text, link);
  }

  /** Send a message with buttons through a specific platform adapter. */
  async sendButtons(platform: Platform, userId: string, text: string, buttons: Button[]): Promise<void> {
    const adapter = this.adapters.get(platform);
    if (!adapter) return;
    await adapter.sendButtons(userId, text, buttons);
  }

  /**
   * Send a message to a user, auto-resolving delivery channel.
   * Checks WebSocket connectivity first — only sends push if not connected.
   */
  async sendToUser(
    userId: string,
    text: string,
    pushPayload?: PushPayload
  ): Promise<void> {
    // Check if user has an active WebSocket connection
    const webAdapter = this.adapters.get('web') as WebAdapter | undefined;
    const isConnected = webAdapter?.isClientConnected(userId) ?? false;

    if (isConnected && webAdapter) {
      // User is connected via WebSocket — send there, no push needed
      await webAdapter.sendMessage(userId, text);
      return;
    }

    // User not connected — send push notification
    if (this.db && pushPayload) {
      const tokens = getUserPushTokens(this.db, userId);
      if (tokens.length > 0) {
        const stale = await sendPushToMultiple(tokens, pushPayload);
        if (stale.length > 0) {
          removeStaleTokens(this.db, stale);
        }
      }
    }
  }

  async startAll(): Promise<void> {
    for (const [platform, adapter] of this.adapters) {
      console.log(`[channels] Starting ${platform} adapter...`);
      try {
        await adapter.start();
        console.log(`[channels] ${platform} adapter started`);
      } catch (err) {
        console.warn(`[channels] ${platform} adapter failed to start — skipping:`, (err as Error).message);
        this.adapters.delete(platform);
      }
    }
  }

  async stopAll(): Promise<void> {
    for (const [platform, adapter] of this.adapters) {
      console.log(`[channels] Stopping ${platform} adapter...`);
      await adapter.stop();
    }
  }
}
