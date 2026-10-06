import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_DUE_OPTIONS,
  DueOptions,
  DueStatus,
  evaluateDue,
} from './maintenance-due';
import { MaintenancePlan, MaintenanceRepository } from './maintence.repository';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CustomerService } from '../customers/customer.service';
import { CreateMaintenancePlanDto } from './dto/create-maintence-plan.dto';
import { Vehicle } from '../vehicles/vehicles.repository';

export interface DueItem {
  planId: string;
  vehicleId: string;
  plate: string;
  item: string;
  status: DueStatus;
  remainingKm: number | null;
  remainingDays: number | null;
}

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly repo: MaintenanceRepository,
    private readonly vehicles: VehiclesService,
    private readonly customers: CustomerService,
  ) {}

  async create(dto: CreateMaintenancePlanDto) {
    if (dto.intervalKm === undefined && dto.intervalDays === undefined) {
      throw new BadRequestException(
        'Informe intervalKm, intervalDays ou ambos',
      );
    }

    const vehicle = await this.vehicles.getById(dto.vehicleId);

    if (dto.lastDoneKm !== undefined && dto.lastDoneKm > vehicle.currentKm) {
      throw new BadRequestException(
        'lastDoneKm não pode ser maior que o km atual do veículo',
      );
    }

    return this.repo.insert({
      vehicleId: dto.vehicleId,
      item: dto.item,
      intervalKm: dto.intervalKm ?? null,
      intervalDays: dto.intervalDays ?? null,
      lastDoneKm: dto.lastDoneKm ?? vehicle.currentKm,
      lastDoneAt: dto.lastDoneAt ? new Date(dto.lastDoneAt) : new Date(),
    });
  }

  async listByVehicle(vehicleId: string) {
    await this.vehicles.getById(vehicleId);
    return this.repo.findByVehicle(vehicleId);
  }

  async complete(planId: string) {
    const plan = await this.repo.findById(planId);
    if (!plan) throw new NotFoundException(`Plano ${planId} não encontrado`);

    const vehicle = await this.vehicles.getById(plan.vehicleId);
    return this.repo.markDone(planId, vehicle.currentKm, new Date());
  }

  async listDueByVehicle(
    vehicleId: string,
    options: DueOptions = DEFAULT_DUE_OPTIONS,
    now = new Date(),
  ) {
    const vehicle = await this.vehicles.getById(vehicleId);
    const plans = await this.repo.findByVehicle(vehicleId);
    return this.onlyDue(this.evaluate(vehicle, plans, options, now));
  }

  async listDueByCustomer(
    customerId: string,
    options: DueOptions = DEFAULT_DUE_OPTIONS,
    now = new Date(),
  ) {
    await this.customers.findById(customerId);
    const fleet = await this.vehicles.listByCustomer(customerId);
    const plans = await this.repo.findByVehicleIds(fleet.map((v) => v.id));

    const items = fleet.flatMap((vehicle) =>
      this.evaluate(
        vehicle,
        plans.filter((p) => p.vehicleId === vehicle.id),
        options,
        now,
      ),
    );
    return this.onlyDue(items);
  }

  private evaluate(
    vehicle: Vehicle,
    plans: MaintenancePlan[],
    options: DueOptions,
    now: Date,
  ): DueItem[] {
    return plans.map((plan) => ({
      planId: plan.id,
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      item: plan.item,
      ...evaluateDue(plan, vehicle.currentKm, now, options),
    }));
  }

  private onlyDue(items: DueItem[]): DueItem[] {
    const order: Record<DueStatus, number> = { OVERDUE: 0, DUE_SOON: 1, OK: 2 };
    return items
      .filter((i) => i.status !== 'OK')
      .sort((a, b) => order[a.status] - order[b.status]);
  }
}
