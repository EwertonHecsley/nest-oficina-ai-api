import { evaluateDue, PlanInput } from './maintenance-due';

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

const byKm = (lastDoneKm: number, intervalKm = 10000): PlanInput => ({
  intervalKm,
  intervalDays: null,
  lastDoneKm,
  lastDoneAt: null,
});

describe('evaluateDue', () => {
  const now = utc('2026-06-01');

  it('OK quando falta bastante km', () => {
    expect(evaluateDue(byKm(10000), 12000, now)).toEqual({
      status: 'OK',
      remainingKm: 8000,
      remainingDays: null,
    });
  });

  it('DUE_SOON quando falta menos que a janela de km', () => {
    expect(evaluateDue(byKm(10000), 19500, now).status).toBe('DUE_SOON');
  });

  it('OVERDUE quando passou do km', () => {
    expect(evaluateDue(byKm(10000), 20500, now)).toMatchObject({
      status: 'OVERDUE',
      remainingKm: -500,
    });
  });

  it('OVERDUE quando bate exatamente o intervalo', () => {
    expect(evaluateDue(byKm(10000), 20000, now)).toMatchObject({
      status: 'OVERDUE',
      remainingKm: 0,
    });
  });

  it('OVERDUE por dias (90 dias desde 01/01 vencem em 01/04)', () => {
    const plan: PlanInput = {
      intervalKm: null,
      intervalDays: 90,
      lastDoneKm: null,
      lastDoneAt: utc('2026-01-01'),
    };
    expect(evaluateDue(plan, 0, now)).toMatchObject({
      status: 'OVERDUE',
      remainingDays: -61,
    });
  });

  it('vale o pior critério: km OK, mas prazo se aproximando', () => {
    const plan: PlanInput = {
      intervalKm: 10000,
      intervalDays: 90,
      lastDoneKm: 10000,
      lastDoneAt: utc('2026-01-01'),
    };
    expect(evaluateDue(plan, 12000, utc('2026-03-15'))).toEqual({
      status: 'DUE_SOON',
      remainingKm: 8000,
      remainingDays: 17,
    });
  });

  it('respeita opções customizadas de janela', () => {
    expect(
      evaluateDue(byKm(10000), 17000, now, { soonKm: 5000, soonDays: 30 })
        .status,
    ).toBe('DUE_SOON');
  });

  it('plano sem nenhum critério avaliável fica OK', () => {
    const plan: PlanInput = {
      intervalKm: null,
      intervalDays: null,
      lastDoneKm: null,
      lastDoneAt: null,
    };
    expect(evaluateDue(plan, 5000, now)).toEqual({
      status: 'OK',
      remainingKm: null,
      remainingDays: null,
    });
  });
});
