import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

describe('CustomerController', () => {
  let controller: CustomerController;
  let service: { create: jest.Mock; findById: jest.Mock };

  beforeEach(async () => {
    service = { create: jest.fn(), findById: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [{ provide: CustomerService, useValue: service }],
    }).compile();
    controller = module.get(CustomerController);
  });

  it('create delega', () => {
    const dto = { name: 'x' } as any;
    void controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('getById delega', () => {
    void controller.getById('id1' as any);
    expect(service.findById).toHaveBeenCalledWith('id1');
  });
});
