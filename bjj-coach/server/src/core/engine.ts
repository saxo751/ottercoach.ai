import type Database from 'better-sqlite3';
import type { AIProvider } from '../ai/provider.js';
import type { ChannelManager } from '../channels/manager.js';
import type { Platform } from '../utils/constants.js';
import { CONVERSATION_MODES } from '../utils/constants.js';
import { findOrCreateUser } from '../db/queries/channels.js';
import { getUserById, setConversationMode } from '../db/queries/users.js';
import { addMessage } from '../db/queries/conversations.js';
import { handleOnboarding } from './handlers/onboarding.js';
import { handleFreeChat } from './handlers/freeChat.js';
import { handleCheckIn } from './handlers/checkin.js';
import { handleBriefing } from './handlers/briefing.js';
import { handleDebrief } from './handlers/debrief.js';
import type { HandlerResult } from './handlers/types.js';

export class CoachingEngine {
  constructor(
    private db: Database.Database,
    private ai: AIProvider,
    private channels: ChannelManager
  ) {}

  start(): void {
    this.channels.onMessage((platformUserId, text, platform) => {
      this.handleIncoming(platformUserId, text, platform).catch((err) => {
        console.error(`[engine] Error handling message from ${platformUserId}:`, err);
        this.channels.sendMessage(platform, platformUserId,
          "Sorry, I hit a snag. Give me a sec and try again."
        ).catch(() => {});
      });
    });
  }

  private async handleIncoming(
    platformUserId: string,
    text: string,
    platform: Platform
  ): Promise<void> {
    // 1. Find or create user
    const { user, isNew } = findOrCreateUser(this.db, platform, platformUserId);

    // 2. Store incoming message
    addMessage(this.db, user.id, 'user', text, platform);

    // 3. Re-fetch user to get latest state (might have been updated)
    const currentUser = getUserById(this.db, user.id)!;

    // 4. Route by conversation mode
    let result: HandlerResult;

    // Handle /start — always go to onboarding if not complete
    if (text === '/start' && !currentUser.onboarding_complete) {
      setConversationMode(this.db, user.id, CONVERSATION_MODES.ONBOARDING);
      const freshUser = getUserById(this.db, user.id)!;
      result = await handleOnboarding(this.db, this.ai, freshUser, text);
    } else {
      switch (currentUser.conversation_mode) {
        case CONVERSATION_MODES.ONBOARDING:
          result = await handleOnboarding(this.db, this.ai, currentUser, text);
          break;

        case CONVERSATION_MODES.IDLE:
          // Transition to free chat
          setConversationMode(this.db, user.id, CONVERSATION_MODES.FREE_CHAT);
          result = await handleFreeChat(this.db, this.ai, getUserById(this.db, user.id)!, text);
          break;

        case CONVERSATION_MODES.FREE_CHAT:
          result = await handleFreeChat(this.db, this.ai, currentUser, text);
          break;

        case CONVERSATION_MODES.CHECK_IN:
          result = await handleCheckIn(this.db, this.ai, currentUser, text);
          break;

        case CONVERSATION_MODES.BRIEFING:
          result = await handleBriefing(this.db, this.ai, currentUser, text);
          break;

        case CONVERSATION_MODES.DEBRIEF:
          result = await handleDebrief(this.db, this.ai, currentUser, text);
          break;

        default:
          result = await handleFreeChat(this.db, this.ai, currentUser, text);
      }
    }

    // 5. Store AI response
    addMessage(this.db, user.id, 'assistant', result.text, platform);

    // 6. Send response back through channel
    await this.channels.sendMessage(platform, platformUserId, result.text);

    // 7. Send system confirmation messages
    if (result.systemMessages?.length) {
      for (const sysMsg of result.systemMessages) {
        addMessage(this.db, user.id, 'system', sysMsg.text, platform);
        await this.channels.sendSystemMessage(platform, platformUserId, sysMsg.text, sysMsg.link);
      }
    }
  }
}
