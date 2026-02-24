import type { ConversationMessage } from '../../ai/provider.js';
import type { ConversationEntry } from '../../db/types.js';

/**
 * Prepares a messages array for the Anthropic API.
 *
 * The Anthropic API requires:
 *  1. Messages must start with a "user" role
 *  2. Roles must alternate (user, assistant, user, assistant, ...)
 *  3. For the model to generate a new response, the last message should be "user"
 *
 * For proactive messages (empty userMessage), the conversation history may end
 * with an assistant message. Without a user message at the end, the API treats
 * it as a "prefill" and continues the last assistant message — which produces
 * broken output (e.g. only a ---DATA--- block with no conversational text).
 *
 * This function:
 *  - Merges consecutive same-role messages to fix alternation
 *  - Prepends a synthetic user message if history starts with assistant
 *  - Appends the user message, or a proactive trigger if empty
 */
export function prepareMessagesForAI(
  history: ConversationEntry[],
  userMessage: string
): ConversationMessage[] {
  const messages: ConversationMessage[] = [];

  // Build from history, merging consecutive same-role messages
  for (const m of history) {
    const last = messages[messages.length - 1];
    if (last && last.role === m.role) {
      last.content += '\n\n' + m.content;
    } else {
      messages.push({ role: m.role as 'user' | 'assistant', content: m.content });
    }
  }

  // Ensure messages start with "user" (API requirement)
  if (messages.length > 0 && messages[0].role !== 'user') {
    messages.unshift({ role: 'user', content: '[conversation start]' });
  }

  // Add user message or proactive trigger
  if (userMessage) {
    const last = messages[messages.length - 1];
    if (last && last.role === 'user') {
      last.content += '\n\n' + userMessage;
    } else {
      messages.push({ role: 'user', content: userMessage });
    }
  } else {
    // Proactive: ensure we end with user so the AI generates a new message
    if (messages.length === 0 || messages[messages.length - 1].role === 'assistant') {
      messages.push({ role: 'user', content: '[Send your proactive message to the user now.]' });
    }
  }

  return messages;
}
