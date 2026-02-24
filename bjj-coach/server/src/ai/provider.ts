export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIProviderOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface AIResponse {
  text: string;
  usage?: TokenUsage;
}

export interface AIProvider {
  sendMessage(
    systemPrompt: string,
    messages: ConversationMessage[],
    options?: AIProviderOptions
  ): Promise<AIResponse>;
}
