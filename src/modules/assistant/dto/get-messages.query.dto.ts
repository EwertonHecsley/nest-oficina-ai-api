import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetMessagesQuery {
  @ApiProperty() @IsUUID() customerId: string;
}
