import { Test, TestingModule } from '@nestjs/testing';
import { AssistantController } from './assistante.controller';
import { AssistantService } from './assistante.service';

describe('AssistantController', () => {
  let controller: AssistantController;
  let service: { chat: jest.Mock; getMessages: jest.Mock };

  beforeEach(async () => {
    service = { chat: jest.fn(), getMessages: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssistantController],
      providers: [{ provide: AssistantService, useValue: service }],
    }).compile();
    controller = module.get(AssistantController);
  });

  it('chat delega ao service', () => {
    const dto = { message: 'hi' } as any;
    controller.chat(dto);
    expect(service.chat).toHaveBeenCalledWith(dto);
  });

  it('messages delega ao service', () => {
    const query = { customerId: 'c1' } as any;
    controller.messages('conv-1' as any, query);
    expect(service.getMessages).toHaveBeenCalledWith('conv-1', 'c1');
  });
});
