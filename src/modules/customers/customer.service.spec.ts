import { NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create.customer.dto';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let repository: { insert: jest.Mock; findById: jest.Mock };

  beforeEach(() => {
    repository = {
      insert: jest.fn(),
      findById: jest.fn(),
    };
    service = new CustomerService(repository as any);
  });

  it('create delega ao repository.insert', async () => {
    const dto = { name: 'João' } as CreateCustomerDto;
    const row = { id: 'c-1', name: 'João' };
    repository.insert.mockResolvedValue(row);

    const out = await service.create(dto);

    expect(repository.insert).toHaveBeenCalledWith(dto);
    expect(out).toBe(row);
  });

  it('findById retorna o cliente quando encontrado', async () => {
    const row = { id: 'c-1', name: 'João' };
    repository.findById.mockResolvedValue(row);

    const out = await service.findById('c-1');

    expect(repository.findById).toHaveBeenCalledWith('c-1');
    expect(out).toBe(row);
  });

  it('findById lança NotFoundException quando não encontrado', async () => {
    repository.findById.mockResolvedValue(undefined);

    await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
