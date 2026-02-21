import type { ChannelAdapter, MessageCallback, ButtonCallback, Button } from './adapter.js';
import type { Platform } from '../utils/constants.js';

export class ChannelManager {
  private adapters = new Map<Platform, ChannelAdapter>();

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

  /** Send a message with buttons through a specific platform adapter. */
  async sendButtons(platform: Platform, userId: string, text: string, buttons: Button[]): Promise<void> {
    const adapter = this.adapters.get(platform);
    if (!adapter) return;
    await adapter.sendButtons(userId, text, buttons);
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
