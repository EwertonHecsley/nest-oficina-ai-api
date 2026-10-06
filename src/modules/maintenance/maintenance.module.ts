import { Module } from '@nestjs/common';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { CustomerModule } from '../customers/customer.module';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintence.service';
import { MaintenanceRepository } from './maintence.repository';

@Module({
  imports: [VehiclesModule, CustomerModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceRepository],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
