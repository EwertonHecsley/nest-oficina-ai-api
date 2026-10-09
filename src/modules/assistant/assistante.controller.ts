import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatDto } from './dto/chat.dto';
import { AssistantService } from './assistante.service';
import { GetMessagesQuery } from './dto/get-messages.query.dto';

@ApiTags('assistant')
@Controller('assistant')
export class AssistantController {
  constructor(private readonly service: AssistantService) {}

  @Post('chat')
  chat(@Body() dto: ChatDto) {
    return this.service.chat(dto);
  }

  @Get('conversations/:conversationId/messages')
  messages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: GetMessagesQuery,
  ) {
    return this.service.getMessages(conversationId, query.customerId);
  }
}
