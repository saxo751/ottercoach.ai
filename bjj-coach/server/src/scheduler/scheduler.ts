import cron from 'node-cron';
import type Database from 'better-sqlite3';
import type { AIProvider } from '../ai/provider.js';
import type { ChannelManager } from '../channels/manager.js';
import type { Platform } from '../utils/constants.js';
import type { User } from '../db/types.js';
import { CONVERSATION_MODES } from '../utils/constants.js';
import { getOnboardedUsers, setScheduledAction, setConversationMode } from '../db/queries/users.js';
import { pruneOldDailyLogs } from '../db/queries/dailyLogs.js';
import { archiveStaleObservations } from '../db/queries/memories.js';
import { getPrimaryChannel } from '../db/queries/channels.js';
import { addMessage, getLastMessage } from '../db/queries/conversations.js';
import { getUserLocalTime, getUserLocalDate, parseTrainingSchedule, parseTime } from '../utils/time.js';
import { handleCheckIn } from '../core/handlers/checkin.js';
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
  private lastCleanupDate: string | null = null;

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
    // Daily memory cleanup (runs once per day)
    const today = new Date().toISOString().split('T')[0];
    if (this.lastCleanupDate !== today) {
      this.lastCleanupDate = today;
      try {
        const prunedLogs = pruneOldDailyLogs(this.db, 30);
        const archivedMems = archiveStaleObservations(this.db, 30);
        if (prunedLogs > 0 || archivedMems > 0) {
          console.log(`[scheduler] Daily cleanup: pruned ${prunedLogs} old daily logs, archived ${archivedMems} stale observations`);
        }
      } catch (err) {
        console.error('[scheduler] Memory cleanup error:', err);
      }
    }

    const users = getOnboardedUsers(this.db);
    if (users.length === 0) return;

    for (const user of users) {
      try {
        // Auto-complete stale debriefs (and check-ins) before processing schedule
        await this.timeoutStaleConversation(user);
        await this.processUser(user);
      } catch (err) {
        console.error(`[scheduler] Error processing user ${user.id}:`, err);
      }
    }
  }

  /**
   * If a user has been stuck in debrief or check-in mode with no new messages
   * for 30+ minutes, auto-wrap it by sending a final AI call that forces completion.
   */
  private async timeoutStaleConversation(user: User): Promise<void> {
    const mode = user.conversation_mode;
    if (mode !== CONVERSATION_MODES.DEBRIEF && mode !== CONVERSATION_MODES.CHECK_IN) return;

    const lastMsg = getLastMessage(this.db, user.id);
    if (!lastMsg) return;

    const ageMs = Date.now() - new Date(lastMsg.created_at).getTime();
    const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    if (ageMs < TIMEOUT_MS) return;

    console.log(`[scheduler] Timing out stale ${mode} for ${user.name || user.id} (${Math.round(ageMs / 60000)} min idle)`);

    const channel = getPrimaryChannel(this.db, user.id);

    if (mode === CONVERSATION_MODES.DEBRIEF) {
      // Send a wrap-up message through the debrief handler
      const wrapUpMessage = '[The user stopped responding. Wrap up the debrief now. Give a brief encouraging closing message and set debrief_complete to true with whatever information you have so far.]';
      const result = await handleDebrief(this.db, this.ai, user, wrapUpMessage);

      if (channel) {
        addMessage(this.db, user.id, 'assistant', result.text, channel.platform as Platform);
        await this.channels.sendMessage(channel.platform as Platform, channel.platform_user_id, result.text);
        if (result.systemMessages?.length) {
          for (const sysMsg of result.systemMessages) {
            addMessage(this.db, user.id, 'system', sysMsg.text, channel.platform as Platform);
            await this.channels.sendSystemMessage(channel.platform as Platform, channel.platform_user_id, sysMsg.text, sysMsg.link);
          }
        }
      }
    } else {
      // Check-in timed out — just go back to idle
      setConversationMode(this.db, user.id, CONVERSATION_MODES.IDLE);
    }
  }

  private async processUser(user: User): Promise<void> {
    // Parse training schedule
    const schedule = parseTrainingSchedule(user.training_days);
    if (!schedule) return;

    const timezone = user.timezone || 'America/New_York';
    const localTime = getUserLocalTime(timezone);
    const localDate = getUserLocalDate(timezone);

    // Is today a training day?
    const todayTime = schedule[localTime.dayName];
    if (!todayTime) return; // Not a training day

    // Parse the training time (e.g. "19:00" → { hour: 19, minute: 0 })
    const trainingTime = parseTime(todayTime);
    if (!trainingTime) return;

    // Current time in minutes since midnight
    const nowMinutes = localTime.hour * 60 + localTime.minute;
    const trainingMinutes = trainingTime.hour * 60 + trainingTime.minute;

    // Determine what's been sent today
    const alreadySentToday = user.last_scheduled_date === localDate;
    const lastAction = alreadySentToday ? user.last_scheduled_action : null;

    // MORNING CHECK-IN WINDOW: 7:50am–8:10am user local time
    // Skip if training is before 9am (go straight to briefing instead)
    const checkinLow = 7 * 60 + 50;   // 7:50am
    const checkinHigh = 8 * 60 + 10;   // 8:10am
    const earlyTraining = trainingMinutes < 9 * 60; // before 9am

    if (!lastAction && !earlyTraining && nowMinutes >= checkinLow && nowMinutes <= checkinHigh) {
      await this.sendCheckIn(user, localDate);
      return;
    }

    // PRE-SESSION WINDOW: 20–40 min before training time
    // Sends if check-in was sent or nothing was sent today
    const preLow = trainingMinutes - 40;
    const preHigh = trainingMinutes - 20;

    if ((!lastAction || lastAction === 'checkin') && nowMinutes >= preLow && nowMinutes <= preHigh) {
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

  private async sendCheckIn(user: User, localDate: string): Promise<void> {
    const channel = getPrimaryChannel(this.db, user.id);
    if (!channel) {
      console.warn(`[scheduler] No channel for user ${user.id}, skipping check-in`);
      return;
    }

    console.log(`[scheduler] Sending check-in to ${user.name || user.id}`);

    // Set mode to CHECK_IN
    setConversationMode(this.db, user.id, CONVERSATION_MODES.CHECK_IN);

    // Generate the proactive message (empty user message = system-triggered)
    const result = await handleCheckIn(this.db, this.ai, user, '');

    // Store in conversation history and send
    addMessage(this.db, user.id, 'assistant', result.text, channel.platform as Platform);
    await this.channels.sendMessage(channel.platform as Platform, channel.platform_user_id, result.text);

    // Track that check-in was sent today
    setScheduledAction(this.db, user.id, 'checkin', localDate);
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
    const result = await handleBriefing(this.db, this.ai, user, '');

    // Store in conversation history and send
    addMessage(this.db, user.id, 'assistant', result.text, channel.platform as Platform);
    await this.channels.sendMessage(channel.platform as Platform, channel.platform_user_id, result.text);

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
    const result = await handleDebrief(this.db, this.ai, user, '');

    // Store in conversation history and send
    addMessage(this.db, user.id, 'assistant', result.text, channel.platform as Platform);
    await this.channels.sendMessage(channel.platform as Platform, channel.platform_user_id, result.text);

    // Track that debrief was sent today
    setScheduledAction(this.db, user.id, 'debrief', localDate);
  }

}
