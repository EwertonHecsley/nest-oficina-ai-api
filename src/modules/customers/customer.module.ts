import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerRepository } from './customer.repository';
import { CustomerController } from './customer.controller';

@Module({
  providers: [CustomerService, CustomerRepository],
  controllers: [CustomerController],
  exports: [CustomerService],
})
export class CustomerModule {}
