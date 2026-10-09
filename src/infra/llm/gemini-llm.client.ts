import { ApiError, GoogleGenAI } from '@google/genai';
import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LlmChatParams,
  LlmChatResult,
  LlmClient,
  LlmStopReason,
} from './llm-client';

@Injectable()
export class GeminiLlmClient extends LlmClient {
  private readonly logger = new Logger(GeminiLlmClient.name);
  private readonly ai: GoogleGenAI;
  private readonly model: string;
  private readonly defaultMaxTokens: number;

  constructor(config: ConfigService) {
    super();
    this.ai = new GoogleGenAI({
      apiKey: config.getOrThrow<string>('GEMINI_API_KEY'),
    });
    this.model = config.getOrThrow<string>('GEMINI_MODEL'); // sem default: o nome muda com o tempo
    this.defaultMaxTokens = Number(config.get('LLM_MAX_TOKENS', 1024));
  }

  async chat(params: LlmChatParams): Promise<LlmChatResult> {
    const response = await this.call(params);

    const text = response.text ?? '';
    const finishReason = response.candidates?.[0]?.finishReason;

    // Resposta vazia (ex.: bloqueada por filtro de segurança) não pode virar mensagem do histórico
    if (!text.trim()) {
      this.logger.warn(
        `Resposta vazia do Gemini (finishReason=${finishReason ?? 'desconhecido'})`,
      );
      throw new BadGatewayException('O provedor de IA não devolveu texto');
    }

    return {
      text,
      model: response.modelVersion ?? this.model,
      stopReason: this.mapStopReason(finishReason),
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }

  private async call(params: LlmChatParams) {
    try {
      return await this.ai.models.generateContent({
        model: this.model,
        // No Gemini o papel do assistente se chama 'model'
        contents: params.messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        config: {
          systemInstruction: params.system,
          maxOutputTokens: params.maxTokens ?? this.defaultMaxTokens,
        },
      });
    } catch (error) {
      throw this.translateError(error);
    }
  }

  private mapStopReason(finishReason: string | undefined): LlmStopReason {
    if (finishReason === 'STOP') return 'end_turn';
    if (finishReason === 'MAX_TOKENS') return 'max_tokens';
    return 'other';
  }

  private translateError(error: unknown): HttpException {
    this.logger.error('Falha ao chamar a API do Gemini', error);

    if (error instanceof ApiError && error.status === 429) {
      return new HttpException(
        'Limite de uso do provedor de IA atingido, tente em instantes',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return new BadGatewayException('Falha ao consultar o provedor de IA');
  }
}
