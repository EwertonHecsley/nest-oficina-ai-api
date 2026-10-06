// src/modules/maintenance/maintenance.service.spec.ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Vehicle } from '../vehicles/vehicles.repository';
import { VehiclesService } from '../vehicles/vehicles.service';
import { MaintenancePlan, MaintenanceRepository } from './maintence.repository';
import { MaintenanceService } from './maintence.service';
import { CustomerService } from '../customers/customer.service';

const NOW = new Date('2026-06-01T00:00:00Z');

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: 'v-1',
  customerId: 'c-1',
  plate: 'ABC1D23',
  model: 'Actros 2651',
  year: 2022,
  currentKm: 12000,
  createdAt: NOW,
  ...overrides,
});

const makePlan = (
  overrides: Partial<MaintenancePlan> = {},
): MaintenancePlan => ({
  id: 'p-1',
  vehicleId: 'v-1',
  item: 'Filtro de óleo',
  intervalKm: 10000,
  intervalDays: null,
  lastDoneKm: 5000,
  lastDoneAt: null,
  createdAt: NOW,
  ...overrides,
});

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let repo: jest.Mocked<MaintenanceRepository>;
  let vehicles: { getById: jest.Mock; listByCustomer: jest.Mock };
  let customers: { findById: jest.Mock };

  beforeEach(() => {
    repo = {
      insert: jest.fn(),
      findById: jest.fn(),
      findByVehicle: jest.fn(),
      findByVehicleIds: jest.fn(),
      markDone: jest.fn(),
    } as unknown as jest.Mocked<MaintenanceRepository>;

    vehicles = {
      getById: jest.fn().mockResolvedValue(makeVehicle()),
      listByCustomer: jest.fn(),
    };

    customers = {
      findById: jest.fn().mockResolvedValue({ id: 'c-1' }),
    };

    service = new MaintenanceService(
      repo,
      vehicles as unknown as VehiclesService,
      customers as unknown as CustomerService,
    );
  });

  describe('create', () => {
    const dto = { vehicleId: 'v-1', item: 'Filtro de óleo', intervalKm: 10000 };

    it('lança 400 se nenhum intervalo for informado, sem tocar no veículo nem no banco', async () => {
      await expect(
        service.create({ vehicleId: 'v-1', item: 'Filtro de óleo' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(vehicles.getById).not.toHaveBeenCalled();
      expect(repo.insert).not.toHaveBeenCalled();
    });

    it('propaga 404 quando o veículo não existe', async () => {
      vehicles.getById.mockRejectedValue(new NotFoundException());

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.insert).not.toHaveBeenCalled();
    });

    it('lança 400 se lastDoneKm for maior que o km atual do veículo', async () => {
      await expect(
        service.create({ ...dto, lastDoneKm: 99999 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.insert).not.toHaveBeenCalled();
    });

    it('usa o km atual e a data de hoje como ponto de partida quando não informados', async () => {
      repo.insert.mockResolvedValue(makePlan());

      await service.create(dto);

      const [saved] = repo.insert.mock.calls[0];
      expect(saved).toMatchObject({
        vehicleId: 'v-1',
        item: 'Filtro de óleo',
        intervalKm: 10000,
        intervalDays: null,
        lastDoneKm: 12000, // km atual do veículo
      });
      expect(saved.lastDoneAt).toBeInstanceOf(Date);
      expect(
        Math.abs((saved.lastDoneAt as Date).getTime() - Date.now()),
      ).toBeLessThan(5000);
    });

    it('respeita lastDoneKm e lastDoneAt quando informados', async () => {
      repo.insert.mockResolvedValue(makePlan());

      await service.create({
        ...dto,
        lastDoneKm: 8000,
        lastDoneAt: '2026-03-10',
      });

      expect(repo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          lastDoneKm: 8000,
          lastDoneAt: new Date('2026-03-10'),
        }),
      );
    });
  });

  describe('listByVehicle', () => {
    it('propaga 404 e não consulta planos se o veículo não existe', async () => {
      vehicles.getById.mockRejectedValue(new NotFoundException());

      await expect(service.listByVehicle('v-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.findByVehicle).not.toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('lança 404 se o plano não existe', async () => {
      repo.findById.mockResolvedValue(undefined);

      await expect(service.complete('p-x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(vehicles.getById).not.toHaveBeenCalled();
      expect(repo.markDone).not.toHaveBeenCalled();
    });

    it('reinicia a contagem no km atual do veículo e na data de agora', async () => {
      repo.findById.mockResolvedValue(makePlan());
      repo.markDone.mockResolvedValue(makePlan({ lastDoneKm: 12000 }));

      await service.complete('p-1');

      expect(repo.markDone).toHaveBeenCalledWith(
        'p-1',
        12000,
        expect.any(Date),
      );
    });
  });

  describe('listDueByVehicle', () => {
    it('devolve só itens vencidos ou vencendo, com OVERDUE primeiro', async () => {
      repo.findByVehicle.mockResolvedValue([
        makePlan({ id: 'p-ok', lastDoneKm: 5000 }), // vence em 15.000 -> faltam 3000 (OK)
        makePlan({ id: 'p-soon', lastDoneKm: 2500 }), // vence em 12.500 -> faltam 500 (DUE_SOON)
        makePlan({ id: 'p-over', lastDoneKm: 1000 }), // venceu em 11.000 -> -1000 (OVERDUE)
      ]);

      const result = await service.listDueByVehicle('v-1', undefined, NOW);

      expect(result.map((i) => i.planId)).toEqual(['p-over', 'p-soon']);
      expect(result[0]).toMatchObject({
        planId: 'p-over',
        vehicleId: 'v-1',
        plate: 'ABC1D23',
        item: 'Filtro de óleo',
        status: 'OVERDUE',
        remainingKm: -1000,
      });
      expect(result[1]).toMatchObject({ status: 'DUE_SOON', remainingKm: 500 });
    });

    it('devolve lista vazia quando o veículo não tem planos', async () => {
      repo.findByVehicle.mockResolvedValue([]);

      await expect(
        service.listDueByVehicle('v-1', undefined, NOW),
      ).resolves.toEqual([]);
    });

    it('repassa opções customizadas de janela para a regra de vencimento', async () => {
      repo.findByVehicle.mockResolvedValue([makePlan({ lastDoneKm: 5000 })]); // faltam 3000 km

      const padrao = await service.listDueByVehicle('v-1', undefined, NOW);
      const comJanelaMaior = await service.listDueByVehicle(
        'v-1',
        { soonKm: 5000, soonDays: 30 },
        NOW,
      );

      expect(padrao).toEqual([]);
      expect(comJanelaMaior).toHaveLength(1);
      expect(comJanelaMaior[0].status).toBe('DUE_SOON');
    });
  });

  describe('listDueByCustomer', () => {
    it('propaga 404 e não busca a frota se o cliente não existe', async () => {
      customers.findById.mockRejectedValue(new NotFoundException());

      await expect(
        service.listDueByCustomer('c-x', undefined, NOW),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(vehicles.listByCustomer).not.toHaveBeenCalled();
      expect(repo.findByVehicleIds).not.toHaveBeenCalled();
    });

    it('devolve lista vazia para cliente sem veículos', async () => {
      vehicles.listByCustomer.mockResolvedValue([]);
      repo.findByVehicleIds.mockResolvedValue([]);

      await expect(
        service.listDueByCustomer('c-1', undefined, NOW),
      ).resolves.toEqual([]);
      // o curto-circuito do IN () vazio é responsabilidade do repository
      expect(repo.findByVehicleIds).toHaveBeenCalledWith([]);
    });

    it('avalia cada plano com o km do seu próprio veículo e ordena a frota inteira', async () => {
      const v1 = makeVehicle({ id: 'v-1', plate: 'ABC1D23', currentKm: 12000 });
      const v2 = makeVehicle({ id: 'v-2', plate: 'XYZ9K88', currentKm: 50000 });
      vehicles.listByCustomer.mockResolvedValue([v1, v2]);

      repo.findByVehicleIds.mockResolvedValue([
        makePlan({ id: 'p-a', vehicleId: 'v-1', lastDoneKm: 2500 }), // 12.500 - 12.000 = 500 (DUE_SOON)
        makePlan({ id: 'p-b', vehicleId: 'v-2', lastDoneKm: 38000 }), // 48.000 - 50.000 = -2000 (OVERDUE)
        makePlan({ id: 'p-c', vehicleId: 'v-2', lastDoneKm: 45000 }), // 55.000 - 50.000 = 5000 (OK)
      ]);

      const result = await service.listDueByCustomer('c-1', undefined, NOW);

      // OVERDUE do v-2 vem antes do DUE_SOON do v-1, mesmo v-1 aparecendo primeiro na frota
      expect(result.map((i) => i.planId)).toEqual(['p-b', 'p-a']);
      expect(result[0]).toMatchObject({
        plate: 'XYZ9K88',
        status: 'OVERDUE',
        remainingKm: -2000,
      });
      expect(result[1]).toMatchObject({
        plate: 'ABC1D23',
        status: 'DUE_SOON',
        remainingKm: 500,
      });
    });

    it('faz uma única consulta de planos para a frota toda (sem N+1)', async () => {
      vehicles.listByCustomer.mockResolvedValue([
        makeVehicle({ id: 'v-1' }),
        makeVehicle({ id: 'v-2', plate: 'XYZ9K88' }),
      ]);
      repo.findByVehicleIds.mockResolvedValue([]);

      await service.listDueByCustomer('c-1', undefined, NOW);

      expect(repo.findByVehicleIds).toHaveBeenCalledTimes(1);
      expect(repo.findByVehicleIds).toHaveBeenCalledWith(['v-1', 'v-2']);
      expect(repo.findByVehicle).not.toHaveBeenCalled();
    });
  });
});
