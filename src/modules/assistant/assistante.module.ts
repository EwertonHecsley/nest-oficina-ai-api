import { Module } from '@nestjs/common';
import { LlmModule } from '../../infra/llm/llm.module';
import { CustomerModule } from '../customers/customer.module';
import { AssistantController } from './assistante.controller';
import { AssistantService } from './assistante.service';
import { ConversationsRepository } from './conversations.repository';

@Module({
  imports: [LlmModule, CustomerModule],
  providers: [AssistantService, ConversationsRepository],
  controllers: [AssistantController],
})
export class AssistantModule {}
