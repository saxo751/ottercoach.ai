import cron from 'node-cron';
import type Database from 'better-sqlite3';
import type { AIProvider } from '../ai/provider.js';
import type { ChannelManager } from '../channels/manager.js';
import type { Platform } from '../utils/constants.js';
import type { User } from '../db/types.js';
import { CONVERSATION_MODES } from '../utils/constants.js';
import { getOnboardedUsers, setScheduledAction, setConversationMode } from '../db/queries/users.js';
import { getPrimaryChannel } from '../db/queries/channels.js';
import { addMessage } from '../db/queries/conversations.js';
import { getUserLocalTime, getUserLocalDate } from '../utils/time.js';
import { handleBriefing } from '../core/handlers/briefing.js';
import { handleDebrief } from '../core/handlers/debrief.js';

/**
 * Scheduler runs a cron job every 10 minutes to check if any users
 * need a pre-session briefing or post-session debrief message.
 *
 * Two touchpoints per training day:
 *  1. Pre-session: ~30 min before training time → send briefing
 *  2. Post-session: ~1 hr after training time → send debrief
 */
export class Scheduler {
  private task: cron.ScheduledTask | null = null;

  constructor(
    private db: Database.Database,
    private ai: AIProvider,
    private channels: ChannelManager
  ) {}

  start(): void {
    // Run every 10 minutes
    this.task = cron.schedule('*/10 * * * *', () => {
      this.tick().catch((err) => {
        console.error('[scheduler] Tick error:', err);
      });
    });

    console.log('[scheduler] Started (ticking every 10 min)');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('[scheduler] Stopped');
    }
  }

  private async tick(): Promise<void> {
    const users = getOnboardedUsers(this.db);
    if (users.length === 0) return;

    for (const user of users) {
      try {
        await this.processUser(user);
      } catch (err) {
        console.error(`[scheduler] Error processing user ${user.id}:`, err);
      }
    }
  }

  private async processUser(user: User): Promise<void> {
    // Parse training schedule
    const schedule = this.parseTrainingSchedule(user.training_days);
    if (!schedule) return;

    const timezone = user.timezone || 'America/New_York';
    const localTime = getUserLocalTime(timezone);
    const localDate = getUserLocalDate(timezone);

    // Is today a training day?
    const todayTime = schedule[localTime.dayName];
    if (!todayTime) return; // Not a training day

    // Parse the training time (e.g. "19:00" → { hour: 19, minute: 0 })
    const trainingTime = this.parseTime(todayTime);
    if (!trainingTime) return;

    // Current time in minutes since midnight
    const nowMinutes = localTime.hour * 60 + localTime.minute;
    const trainingMinutes = trainingTime.hour * 60 + trainingTime.minute;

    // Determine what's been sent today
    const alreadySentToday = user.last_scheduled_date === localDate;
    const lastAction = alreadySentToday ? user.last_scheduled_action : null;

    // PRE-SESSION WINDOW: 20–40 min before training time
    // Sends if nothing has been sent today yet
    const preLow = trainingMinutes - 40;
    const preHigh = trainingMinutes - 20;

    if (!lastAction && nowMinutes >= preLow && nowMinutes <= preHigh) {
      await this.sendBriefing(user, localDate);
      return;
    }

    // POST-SESSION WINDOW: 50–80 min after training time
    // Sends if briefing was already sent today
    const postLow = trainingMinutes + 50;
    const postHigh = trainingMinutes + 80;

    if (lastAction === 'briefing' && nowMinutes >= postLow && nowMinutes <= postHigh) {
      await this.sendDebrief(user, localDate);
      return;
    }
  }

  private async sendBriefing(user: User, localDate: string): Promise<void> {
    const channel = getPrimaryChannel(this.db, user.id);
    if (!channel) {
      console.warn(`[scheduler] No channel for user ${user.id}, skipping briefing`);
      return;
    }

    console.log(`[scheduler] Sending briefing to ${user.name || user.id}`);

    // Set mode to BRIEFING
    setConversationMode(this.db, user.id, CONVERSATION_MODES.BRIEFING);

    // Generate the proactive message (empty user message = system-triggered)
    const response = await handleBriefing(this.db, this.ai, user, '');

    // Store in conversation history and send
    addMessage(this.db, user.id, 'assistant', response, channel.platform as Platform);
    await this.channels.sendMessage(channel.platform as Platform, channel.platform_user_id, response);

    // Track that briefing was sent today
    setScheduledAction(this.db, user.id, 'briefing', localDate);
  }

  private async sendDebrief(user: User, localDate: string): Promise<void> {
    const channel = getPrimaryChannel(this.db, user.id);
    if (!channel) {
      console.warn(`[scheduler] No channel for user ${user.id}, skipping debrief`);
      return;
    }

    console.log(`[scheduler] Sending debrief to ${user.name || user.id}`);

    // Set mode to DEBRIEF
    setConversationMode(this.db, user.id, CONVERSATION_MODES.DEBRIEF);

    // Generate the proactive message (empty user message = system-triggered)
    const response = await handleDebrief(this.db, this.ai, user, '');

    // Store in conversation history and send
    addMessage(this.db, user.id, 'assistant', response, channel.platform as Platform);
    await this.channels.sendMessage(channel.platform as Platform, channel.platform_user_id, response);

    // Track that debrief was sent today
    setScheduledAction(this.db, user.id, 'debrief', localDate);
  }

  private parseTrainingSchedule(trainingDays: string | null): Record<string, string> | null {
    if (!trainingDays) return null;

    try {
      const parsed = JSON.parse(trainingDays);

      // New format: {"monday":"19:00","wednesday":"20:00"}
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }

      // Legacy format: ["monday","wednesday"] — can't schedule without times
      return null;
    } catch {
      return null;
    }
  }

  private parseTime(time: string): { hour: number; minute: number } | null {
    if (!time || time === 'unknown') return null;

    const parts = time.split(':');
    if (parts.length < 2) return null;

    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);

    if (isNaN(hour) || isNaN(minute)) return null;
    return { hour, minute };
  }
}
