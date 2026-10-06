import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceOrderDto {
  @ApiProperty()
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ example: 'Troca de óleo e filtros' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ example: 12000 })
  @IsInt()
  @Min(0)
  kmAtService: number;

  // numeric no Drizzle trafega como string, para não perder precisão com dinheiro
  @ApiPropertyOptional({ example: '1250.50' })
  @IsOptional()
  @Matches(/^\d{1,10}(\.\d{1,2})?$/, {
    message: 'cost deve ser decimal com até 2 casas, ex.: 1250.50',
  })
  cost?: string;
}
