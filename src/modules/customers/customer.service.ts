import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerDto } from './dto/create.customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly repository: CustomerRepository) {}

  async create(dto: CreateCustomerDto) {
    return this.repository.insert(dto);
  }

  async findById(id: string) {
    const customer = await this.repository.findById(id);
    if (!customer)
      throw new NotFoundException(`Cliente: ${id} não encontrado.`);
    return customer;
  }
}
