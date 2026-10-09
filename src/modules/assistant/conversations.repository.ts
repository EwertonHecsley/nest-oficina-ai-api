import { Inject, Injectable } from '@nestjs/common';
import { type Database, DRIZZLE } from '../../infra/database/database.module';
import { conversations, messages } from '../../infra/database/schema';
import { and, desc, eq } from 'drizzle-orm';

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export interface Exchange {
  userContent: string;
  userSentAt: Date;
  assistantContent: string;
  assistantSentAt: Date;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

@Injectable()
export class ConversationsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /** Só devolve a conversa se ela pertencer ao cliente informado. */
  async findOwned(
    id: string,
    customerId: string,
  ): Promise<Conversation | undefined> {
    const [row] = await this.db
      .select()
      .from(conversations)
      .where(
        and(eq(conversations.id, id), eq(conversations.customerId, customerId)),
      )
      .limit(1);
    return row;
  }

  /** Últimas N mensagens, já em ordem cronológica. */
  async recentMessages(
    conversationId: string,
    limit: number,
  ): Promise<Message[]> {
    const rows = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    return rows.reverse();
  }

  /**
   * Grava a troca (pergunta + resposta). Se conversationId for null,
   * cria a conversa na mesma transação.
   */
  async saveExchange(
    customerId: string,
    conversationId: string | null,
    exchange: Exchange,
  ): Promise<string> {
    return this.db.transaction(async (tx) => {
      let id = conversationId;
      if (!id) {
        const [created] = await tx
          .insert(conversations)
          .values({ customerId })
          .returning({ id: conversations.id });
        id = created.id;
      }

      await tx.insert(messages).values([
        {
          conversationId: id,
          role: 'user',
          content: exchange.userContent,
          createdAt: exchange.userSentAt,
        },
        {
          conversationId: id,
          role: 'assistant',
          content: exchange.assistantContent,
          model: exchange.model,
          inputTokens: exchange.inputTokens,
          outputTokens: exchange.outputTokens,
          createdAt: exchange.assistantSentAt,
        },
      ]);

      return id;
    });
  }
}
