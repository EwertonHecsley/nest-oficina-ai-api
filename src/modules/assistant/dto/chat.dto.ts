import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class ChatDto {
  @ApiProperty() @IsUUID() customerId: string;

  @ApiPropertyOptional({ description: 'Omita para iniciar uma nova conversa' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiProperty({
    example:
      'Qual a periodicidade de troca do óleo do motor em um caminhão pesado?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;
}
