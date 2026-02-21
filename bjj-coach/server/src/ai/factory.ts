import type { AIProvider } from './provider.js';
import { AnthropicProvider } from './anthropic.js';

export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'anthropic';

  switch (provider) {
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic');
      return new AnthropicProvider(key, process.env.AI_MODEL);
    }
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}. Supported: anthropic`);
  }
}
