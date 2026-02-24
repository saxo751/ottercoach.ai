import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, ConversationMessage, AIProviderOptions, AIResponse } from './provider.js';

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
  ): Promise<AIResponse> {
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
    const text = block.type === 'text' ? block.text : '';

    return {
      text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_creation_input_tokens: (response.usage as any).cache_creation_input_tokens ?? undefined,
        cache_read_input_tokens: (response.usage as any).cache_read_input_tokens ?? undefined,
      },
    };
  }
}
