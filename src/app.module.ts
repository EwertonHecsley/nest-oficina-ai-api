import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './env.validation';
import { DatabaseModule } from './infra/database/database.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { CustomerModule } from './modules/customers/customer.module';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    DatabaseModule,
    CustomerModule,
    VehiclesModule,
    ServiceOrdersModule,
    MaintenanceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
