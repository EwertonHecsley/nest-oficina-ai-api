import { Module } from '@nestjs/common';
import { LlmClient } from './llm-client';
import { GeminiLlmClient } from './gemini-llm.client';

@Module({
  providers: [{ provide: LlmClient, useClass: GeminiLlmClient }],
  exports: [LlmClient],
})
export class LlmModule {}
