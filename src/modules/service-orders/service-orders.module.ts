import { Module } from '@nestjs/common';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersRepository } from './service-orders.repository';
import { ServiceOrdersService } from './service-orders.service';

@Module({
  imports: [VehiclesModule],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService, ServiceOrdersRepository],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
