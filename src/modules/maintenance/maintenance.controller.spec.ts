import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintence.service';

describe('MaintenanceController', () => {
  let controller: MaintenanceController;
  let service: { create: jest.Mock; listByVehicle: jest.Mock; listDueByVehicle: jest.Mock; listDueByCustomer: jest.Mock; complete: jest.Mock };

  beforeEach(async () => {
    service = { create: jest.fn(), listByVehicle: jest.fn(), listDueByVehicle: jest.fn(), listDueByCustomer: jest.fn(), complete: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceController],
      providers: [{ provide: MaintenanceService, useValue: service }],
    }).compile();
    controller = module.get(MaintenanceController);
  });

  it('create delega', () => { const dto = {} as any; controller.create(dto); expect(service.create).toHaveBeenCalledWith(dto); });
  it('listByVehicle delega', () => { controller.listByVehicle('v1' as any); expect(service.listByVehicle).toHaveBeenCalledWith('v1'); });
  it('dueByVehicle delega', () => { controller.dueByVehicle('v1' as any); expect(service.listDueByVehicle).toHaveBeenCalledWith('v1'); });
  it('dueByCustomer delega', () => { controller.dueByCustomer('c1' as any); expect(service.listDueByCustomer).toHaveBeenCalledWith('c1'); });
  it('complete delega', () => { controller.complete('id1' as any); expect(service.complete).toHaveBeenCalledWith('id1'); });
});
