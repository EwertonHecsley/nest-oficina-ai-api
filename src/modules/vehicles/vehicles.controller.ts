import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Post() create(@Body() dto: CreateVehicleDto) {
    return this.service.create(dto);
  }
  @Get('plate/:plate') getByPlate(@Param('plate') plate: string) {
    return this.service.getByPlate(plate);
  }
  @Get('customer/:customerId') list(
    @Param('customerId', ParseUUIDPipe) id: string,
  ) {
    return this.service.listByCustomer(id);
  }
}
