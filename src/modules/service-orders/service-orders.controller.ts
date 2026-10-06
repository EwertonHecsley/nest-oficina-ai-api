import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ServiceOrdersService } from './service-orders.service';

@ApiTags('service-orders')
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly service: ServiceOrdersService) {}

  @Post()
  open(@Body() dto: CreateServiceOrderDto) {
    return this.service.open(dto);
  }

  @Get('vehicle/:vehicleId')
  listByVehicle(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.service.listByVehicle(vehicleId);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.service.changeStatus(id, dto.status);
  }
}
