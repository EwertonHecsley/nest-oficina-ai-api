import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MaintenanceService } from './maintence.service';
import { CreateMaintenancePlanDto } from './dto/create-maintence-plan.dto';

@ApiTags('maintenance-plans')
@Controller('maintenance-plans')
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Post()
  create(@Body() dto: CreateMaintenancePlanDto) {
    return this.service.create(dto);
  }

  @Get('vehicle/:vehicleId')
  listByVehicle(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.service.listByVehicle(vehicleId);
  }

  @Get('vehicle/:vehicleId/due')
  dueByVehicle(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.service.listDueByVehicle(vehicleId);
  }

  @Get('customer/:customerId/due')
  dueByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.service.listDueByCustomer(customerId);
  }

  @Post(':id/complete')
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.complete(id);
  }
}
