export type DueStatus = 'OK' | 'DUE_SOON' | 'OVERDUE';

export interface PlanInput {
  intervalKm: number | null;
  intervalDays: number | null;
  lastDoneKm: number | null;
  lastDoneAt: Date | null;
}

export interface DueOptions {
  soonKm: number; // "vencendo" quando faltam até X km
  soonDays: number; // ou até X dias
}

export interface DueEvaluation {
  status: DueStatus;
  remainingKm: number | null; // negativo = já passou
  remainingDays: number | null; // negativo = já passou
}

export const DEFAULT_DUE_OPTIONS: DueOptions = { soonKm: 1000, soonDays: 30 };

const DAY_MS = 24 * 60 * 60 * 1000;
const SEVERITY: Record<DueStatus, number> = { OK: 0, DUE_SOON: 1, OVERDUE: 2 };

function classify(remaining: number | null, soonThreshold: number): DueStatus {
  if (remaining === null) return 'OK'; // critério não se aplica a este plano
  if (remaining <= 0) return 'OVERDUE'; // bateu o intervalo: está na hora
  if (remaining <= soonThreshold) return 'DUE_SOON';
  return 'OK';
}

export function evaluateDue(
  plan: PlanInput,
  currentKm: number,
  now: Date,
  options: DueOptions = DEFAULT_DUE_OPTIONS,
): DueEvaluation {
  const remainingKm =
    plan.intervalKm !== null && plan.lastDoneKm !== null
      ? plan.lastDoneKm + plan.intervalKm - currentKm
      : null;

  const remainingDays =
    plan.intervalDays !== null && plan.lastDoneAt !== null
      ? // "|| 0" evita o valor -0 que Math.ceil pode devolver
        Math.ceil(
          (plan.lastDoneAt.getTime() +
            plan.intervalDays * DAY_MS -
            now.getTime()) /
            DAY_MS,
        ) || 0
      : null;

  const byKm = classify(remainingKm, options.soonKm);
  const byDays = classify(remainingDays, options.soonDays);

  // vale o pior dos dois critérios: o que vencer primeiro manda
  const status = SEVERITY[byKm] >= SEVERITY[byDays] ? byKm : byDays;

  return { status, remainingKm, remainingDays };
}
