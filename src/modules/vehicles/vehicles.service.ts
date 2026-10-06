import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VehiclesRepository } from './vehicles.repository';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { CustomerService } from '../customers/customer.service';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly repo: VehiclesRepository,
    private readonly customers: CustomerService,
  ) {}

  async create(dto: CreateVehicleDto) {
    await this.customers.findById(dto.customerId);
    const plate = dto.plate.toUpperCase();
    if (await this.repo.findByPlate(plate)) {
      throw new ConflictException(`Já existe veículo com a placa ${plate}`);
    }
    return this.repo.insert({ ...dto, plate });
  }

  async getByPlate(plate: string) {
    const vehicle = await this.repo.findByPlate(plate.toUpperCase());
    if (!vehicle)
      throw new NotFoundException(`Veículo ${plate} não encontrado`);
    return vehicle;
  }

  listByCustomer(customerId: string) {
    return this.repo.findByCustomer(customerId);
  }
}
