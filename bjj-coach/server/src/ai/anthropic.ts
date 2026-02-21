import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, ConversationMessage, AIProviderOptions } from './provider.js';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || 'claude-sonnet-4-20250514';
  }

  async sendMessage(
    systemPrompt: string,
    messages: ConversationMessage[],
    options: AIProviderOptions = {}
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const block = response.content[0];
    if (block.type === 'text') return block.text;
    return '';
  }
}
