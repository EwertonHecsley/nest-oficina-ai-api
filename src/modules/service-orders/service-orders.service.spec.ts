import { ConflictException, NotFoundException } from '@nestjs/common';
import { VehiclesService } from '../vehicles/vehicles.service';
import {
  ServiceOrder,
  ServiceOrdersRepository,
} from './service-orders.repository';
import { ServiceOrdersService } from './service-orders.service';

describe('ServiceOrdersService', () => {
  let service: ServiceOrdersService;
  let repo: jest.Mocked<ServiceOrdersRepository>;
  let vehicles: { getById: jest.Mock };

  const dto = {
    vehicleId: 'v-1',
    description: 'Troca de óleo',
    kmAtService: 12000,
  };
  const order = (status: ServiceOrder['status']) =>
    ({ id: 'o-1', status }) as ServiceOrder;

  beforeEach(() => {
    repo = {
      openWithKmUpdate: jest.fn(),
      findById: jest.fn(),
      findByVehicle: jest.fn(),
      transition: jest.fn(),
    } as unknown as jest.Mocked<ServiceOrdersRepository>;
    vehicles = { getById: jest.fn().mockResolvedValue({ id: 'v-1' }) };
    service = new ServiceOrdersService(
      repo,
      vehicles as unknown as VehiclesService,
    );
  });

  it('abre a OS quando o km é válido', async () => {
    repo.openWithKmUpdate.mockResolvedValue(order('OPEN'));
    await expect(service.open(dto)).resolves.toMatchObject({ status: 'OPEN' });
  });

  it('lança 409 quando o km é menor que o atual', async () => {
    repo.openWithKmUpdate.mockResolvedValue(null);
    await expect(service.open(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('propaga 404 e não chega ao repository se o veículo não existe', async () => {
    vehicles.getById.mockRejectedValue(new NotFoundException());
    await expect(service.open(dto)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.openWithKmUpdate).not.toHaveBeenCalled();
  });

  it('rejeita a transição OPEN -> DONE', async () => {
    repo.findById.mockResolvedValue(order('OPEN'));
    await expect(service.changeStatus('o-1', 'DONE')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repo.transition).not.toHaveBeenCalled();
  });

  it('aceita a transição OPEN -> IN_PROGRESS', async () => {
    repo.findById.mockResolvedValue(order('OPEN'));
    repo.transition.mockResolvedValue(order('IN_PROGRESS'));
    await expect(
      service.changeStatus('o-1', 'IN_PROGRESS'),
    ).resolves.toMatchObject({ status: 'IN_PROGRESS' });
  });
});
