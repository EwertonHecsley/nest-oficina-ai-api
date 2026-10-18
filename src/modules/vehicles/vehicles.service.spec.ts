import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repo: {
    insert: jest.Mock;
    findByPlate: jest.Mock;
    findByCustomer: jest.Mock;
    findById: jest.Mock;
  };
  let customers: { findById: jest.Mock };

  beforeEach(() => {
    repo = {
      insert: jest.fn(),
      findByPlate: jest.fn(),
      findByCustomer: jest.fn(),
      findById: jest.fn(),
    };
    customers = { findById: jest.fn().mockResolvedValue({ id: 'c-1' }) };
    service = new VehiclesService(repo as any, customers as any);
  });

  it('create verifica cliente e conflito de placa', async () => {
    repo.findByPlate.mockResolvedValue(undefined);
    const dto = { customerId: 'c-1', plate: 'abc1234' } as CreateVehicleDto;
    repo.insert.mockResolvedValue({ id: 'v-1', plate: 'ABC1234' });

    const out = await service.create(dto);

    expect(customers.findById).toHaveBeenCalledWith('c-1');
    expect(repo.findByPlate).toHaveBeenCalledWith('ABC1234');
    expect(repo.insert).toHaveBeenCalled();
    expect(out).toEqual({ id: 'v-1', plate: 'ABC1234' });
  });

  it('create lança ConflictException se placa existir', async () => {
    repo.findByPlate.mockResolvedValue({ id: 'v-0' });
    await expect(
      service.create({
        customerId: 'c-1',
        plate: 'abc1234',
      } as CreateVehicleDto),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('getByPlate retorna veículo', async () => {
    const v = { id: 'v-1', plate: 'ABC1234' };
    repo.findByPlate.mockResolvedValue(v);
    expect(await service.getByPlate('abc1234')).toBe(v);
  });

  it('getByPlate lança NotFoundException', async () => {
    repo.findByPlate.mockResolvedValue(undefined);
    await expect(service.getByPlate('abc')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getById retorna veículo', async () => {
    const v = { id: 'v-1' };
    repo.findById.mockResolvedValue(v);
    expect(await service.getById('v-1')).toBe(v);
  });

  it('getById lança NotFoundException', async () => {
    repo.findById.mockResolvedValue(undefined);
    await expect(service.getById('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('listByCustomer delega ao repo', async () => {
    repo.findByCustomer.mockResolvedValue([{ id: 'v-1' }]);
    expect(await service.listByCustomer('c-1')).toEqual([{ id: 'v-1' }]);
  });
});
