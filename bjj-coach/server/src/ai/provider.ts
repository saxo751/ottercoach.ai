export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIProviderOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  sendMessage(
    systemPrompt: string,
    messages: ConversationMessage[],
    options?: AIProviderOptions
  ): Promise<string>;
}
