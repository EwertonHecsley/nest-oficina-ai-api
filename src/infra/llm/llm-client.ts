export type LlmStopReason = 'end_turn' | 'max_tokens' | 'other';

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmChatParams {
  system: string;
  messages: LlmMessage[];
  maxTokens?: number;
}

export interface LlmChatResult {
  text: string;
  model: string;
  stopReason: LlmStopReason;
  usage: { inputTokens: number; outputTokens: number };
}

// Classe abstrata como contrato E como token de injeção do Nest
export abstract class LlmClient {
  abstract chat(params: LlmChatParams): Promise<LlmChatResult>;
}
