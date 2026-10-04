import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Matches, Max, Min, MaxLength } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty() @IsUUID() customerId: string;

  @ApiProperty({ example: 'ABC1D23' })
  @Matches(/^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$/, { message: 'Placa inválida' }) // antiga ou Mercosul
  plate: string;

  @ApiProperty() @IsString() @MaxLength(120) model: string;
  @ApiProperty() @IsInt() @Min(1980) @Max(new Date().getFullYear() + 1) year: number;
  @ApiProperty() @IsInt() @Min(0) currentKm: number;
}