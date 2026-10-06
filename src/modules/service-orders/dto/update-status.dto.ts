import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { serviceOrderStatus } from '../../../infra/database/schema';

export class UpdateStatusDto {
  @ApiProperty({ enum: serviceOrderStatus.enumValues })
  @IsIn(serviceOrderStatus.enumValues)
  status: (typeof serviceOrderStatus.enumValues)[number];
}
