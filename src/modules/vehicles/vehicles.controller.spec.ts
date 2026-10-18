import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: { create: jest.Mock; getByPlate: jest.Mock; listByCustomer: jest.Mock };

  beforeEach(async () => {
    service = { create: jest.fn(), getByPlate: jest.fn(), listByCustomer: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: service }],
    }).compile();
    controller = module.get(VehiclesController);
  });

  it('create delega', () => { const dto = {} as any; controller.create(dto); expect(service.create).toHaveBeenCalledWith(dto); });
  it('getByPlate delega', () => { controller.getByPlate('ABC' as any); expect(service.getByPlate).toHaveBeenCalledWith('ABC'); });
  it('list delega', () => { controller.list('c1' as any); expect(service.listByCustomer).toHaveBeenCalledWith('c1'); });
});
