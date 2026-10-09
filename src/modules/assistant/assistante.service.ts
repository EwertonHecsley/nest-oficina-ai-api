import { Injectable, NotFoundException } from '@nestjs/common';
import { LlmClient } from '../../infra/llm/llm-client';
import { ConversationsRepository } from './conversations.repository';
import { CustomerService } from '../customers/customer.service';
import { ChatDto } from './dto/chat.dto';
import { SYSTEM_PROMPT } from './assistant-prompts';

// Número PAR, para a janela sempre começar numa mensagem do usuário
const HISTORY_LIMIT = 20;

@Injectable()
export class AssistantService {
  constructor(
    private readonly llm: LlmClient,
    private readonly conversations: ConversationsRepository,
    private readonly customers: CustomerService,
  ) {}

  async chat(dto: ChatDto) {
    await this.customers.findById(dto.customerId);

    // 1. Histórico (vazio se for conversa nova)
    let history: { role: 'user' | 'assistant'; content: string }[] = [];
    if (dto.conversationId) {
      const conversation = await this.conversations.findOwned(
        dto.conversationId,
        dto.customerId,
      );
      if (!conversation) throw new NotFoundException('Conversa não encontrada');

      const recent = await this.conversations.recentMessages(
        conversation.id,
        HISTORY_LIMIT,
      );
      history = recent.map((m) => ({ role: m.role, content: m.content }));
    }

    // 2. Chamada ao modelo: system + histórico + pergunta nova
    const userSentAt = new Date();
    const result = await this.llm.chat({
      system: SYSTEM_PROMPT,
      messages: [...history, { role: 'user', content: dto.message }],
    });

    // 3. Só persiste depois do sucesso (se o modelo falhar, nada é gravado)
    const conversationId = await this.conversations.saveExchange(
      dto.customerId,
      dto.conversationId ?? null,
      {
        userContent: dto.message,
        userSentAt,
        assistantContent: result.text,
        assistantSentAt: new Date(),
        model: result.model,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      },
    );

    return {
      conversationId,
      reply: result.text,
      usage: result.usage,
      truncated: result.stopReason === 'max_tokens', // resposta cortada pelo limite
    };
  }

  async getMessages(conversationId: string, customerId: string) {
    const conversation = await this.conversations.findOwned(
      conversationId,
      customerId,
    );
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    return this.conversations.recentMessages(conversationId, 500);
  }
}
