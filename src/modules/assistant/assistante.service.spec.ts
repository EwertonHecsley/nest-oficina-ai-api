import { NotFoundException } from '@nestjs/common';
import { LlmClient } from '../../infra/llm/llm-client';
import { ConversationsRepository, Message } from './conversations.repository';
import { AssistantService } from './assistante.service';
import { CustomerService } from '../customers/customer.service';
import { SYSTEM_PROMPT } from './assistant-prompts';

describe('AssistantService', () => {
  let service: AssistantService;
  let llm: { chat: jest.Mock };
  let repo: jest.Mocked<ConversationsRepository>;
  let customers: { findById: jest.Mock };

  const llmResult = {
    text: 'Resposta do modelo',
    model: 'modelo-teste',
    stopReason: 'end_turn',
    usage: { inputTokens: 100, outputTokens: 20 },
  };

  const msg = (role: 'user' | 'assistant', content: string) =>
    ({ role, content }) as Message;

  beforeEach(() => {
    llm = { chat: jest.fn().mockResolvedValue(llmResult) };
    repo = {
      findOwned: jest.fn(),
      recentMessages: jest.fn(),
      saveExchange: jest.fn().mockResolvedValue('conv-1'),
    } as unknown as jest.Mocked<ConversationsRepository>;
    customers = { findById: jest.fn().mockResolvedValue({ id: 'c-1' }) };

    service = new AssistantService(
      llm as unknown as LlmClient,
      repo,
      customers as unknown as CustomerService,
    );
  });

  it('conversa nova: manda só o system prompt e a pergunta, e cria a conversa ao salvar', async () => {
    const out = await service.chat({ customerId: 'c-1', message: 'Olá' });

    expect(llm.chat).toHaveBeenCalledWith({
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: 'Olá' }],
    });
    expect(repo.recentMessages).not.toHaveBeenCalled();
    expect(repo.saveExchange).toHaveBeenCalledWith(
      'c-1',
      null,
      expect.objectContaining({
        userContent: 'Olá',
        assistantContent: 'Resposta do modelo',
        inputTokens: 100,
        outputTokens: 20,
      }),
    );
    expect(out).toEqual({
      conversationId: 'conv-1',
      reply: 'Resposta do modelo',
      usage: { inputTokens: 100, outputTokens: 20 },
      truncated: false,
    });
  });

  it('conversa existente: envia o histórico em ordem, seguido da pergunta nova', async () => {
    repo.findOwned.mockResolvedValue({ id: 'conv-1' } as never);
    repo.recentMessages.mockResolvedValue([
      msg('user', 'Pergunta 1'),
      msg('assistant', 'Resposta 1'),
    ]);

    await service.chat({
      customerId: 'c-1',
      conversationId: 'conv-1',
      message: 'Pergunta 2',
    });

    expect(llm.chat).toHaveBeenCalledWith({
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: 'Pergunta 1' },
        { role: 'assistant', content: 'Resposta 1' },
        { role: 'user', content: 'Pergunta 2' },
      ],
    });
    expect(repo.saveExchange).toHaveBeenCalledWith(
      'c-1',
      'conv-1',
      expect.anything(),
    );
  });

  it('404 quando a conversa não pertence ao cliente, sem chamar o modelo', async () => {
    repo.findOwned.mockResolvedValue(undefined);

    await expect(
      service.chat({
        customerId: 'c-1',
        conversationId: 'conv-de-outro',
        message: 'Oi',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(llm.chat).not.toHaveBeenCalled();
    expect(repo.saveExchange).not.toHaveBeenCalled();
  });

  it('não grava nada se o modelo falhar', async () => {
    llm.chat.mockRejectedValue(new Error('falha do provedor'));

    await expect(
      service.chat({ customerId: 'c-1', message: 'Oi' }),
    ).rejects.toThrow('falha do provedor');
    expect(repo.saveExchange).not.toHaveBeenCalled();
  });

  it('sinaliza resposta cortada quando stop_reason é max_tokens', async () => {
    llm.chat.mockResolvedValue({ ...llmResult, stopReason: 'max_tokens' });

    const out = await service.chat({ customerId: 'c-1', message: 'Oi' });
    expect(out.truncated).toBe(true);
  });

  it('propaga 404 de cliente inexistente antes de qualquer outra coisa', async () => {
    customers.findById.mockRejectedValue(new NotFoundException());

    await expect(
      service.chat({ customerId: 'x', message: 'Oi' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(llm.chat).not.toHaveBeenCalled();
  });
});
