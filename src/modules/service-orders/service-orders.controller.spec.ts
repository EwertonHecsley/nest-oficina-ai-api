import { Test, TestingModule } from '@nestjs/testing';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';

describe('ServiceOrdersController', () => {
  let controller: ServiceOrdersController;
  let service: {
    open: jest.Mock;
    listByVehicle: jest.Mock;
    changeStatus: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      open: jest.fn(),
      listByVehicle: jest.fn(),
      changeStatus: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceOrdersController],
      providers: [{ provide: ServiceOrdersService, useValue: service }],
    }).compile();
    controller = module.get(ServiceOrdersController);
  });

  it('open delega', () => {
    const dto = {} as any;
    void controller.open(dto);
    expect(service.open).toHaveBeenCalledWith(dto);
  });
  it('listByVehicle delega', () => {
    void controller.listByVehicle('v1' as any);
    expect(service.listByVehicle).toHaveBeenCalledWith('v1');
  });
  it('changeStatus delega', () => {
    const dto = { status: 'done' } as any;
    void controller.changeStatus('id1' as any, dto);
    expect(service.changeStatus).toHaveBeenCalledWith('id1', 'done');
  });
});
