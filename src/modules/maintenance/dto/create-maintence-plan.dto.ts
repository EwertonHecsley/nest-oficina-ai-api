import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMaintenancePlanDto {
  @ApiProperty() @IsUUID() vehicleId: string;

  @ApiProperty({ example: 'Filtro de óleo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  item: string;

  @ApiPropertyOptional({ example: 10000, description: 'Intervalo em km' })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalKm?: number;

  @ApiPropertyOptional({ example: 180, description: 'Intervalo em dias' })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number;

  @ApiPropertyOptional({
    description: 'Km da última execução (padrão: km atual do veículo)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lastDoneKm?: number;

  @ApiPropertyOptional({
    example: '2026-03-10',
    description: 'Data da última execução (padrão: hoje)',
  })
  @IsOptional()
  @IsDateString()
  lastDoneAt?: string;
}
