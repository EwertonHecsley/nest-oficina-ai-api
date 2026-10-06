import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import {
  ServiceOrderStatus,
  ServiceOrdersRepository,
} from './service-orders.repository';

// Regra de negócio: de onde se pode ir para onde
const ALLOWED_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['DONE'],
  DONE: [],
};

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly repo: ServiceOrdersRepository,
    private readonly vehicles: VehiclesService,
  ) {}

  async open(dto: CreateServiceOrderDto) {
    await this.vehicles.getById(dto.vehicleId);

    const order = await this.repo.openWithKmUpdate({
      vehicleId: dto.vehicleId,
      description: dto.description,
      kmAtService: dto.kmAtService,
      cost: dto.cost,
    });

    if (!order) {
      throw new ConflictException(
        'O km informado é menor que o km atual do veículo',
      );
    }
    return order;
  }

  async listByVehicle(vehicleId: string) {
    await this.vehicles.getById(vehicleId);
    return this.repo.findByVehicle(vehicleId);
  }

  async changeStatus(id: string, to: ServiceOrderStatus) {
    const current = await this.repo.findById(id);
    if (!current)
      throw new NotFoundException(`Ordem de serviço ${id} não encontrada`);

    if (!ALLOWED_TRANSITIONS[current.status].includes(to)) {
      throw new ConflictException(
        `Transição inválida: ${current.status} -> ${to}`,
      );
    }

    const updated = await this.repo.transition(id, current.status, to);
    if (!updated) {
      throw new ConflictException(
        'A ordem de serviço foi alterada por outra requisição, tente novamente',
      );
    }
    return updated;
  }
}
