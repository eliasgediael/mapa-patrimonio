import type { Goal, MonthSnapshot, YearMonth } from './types';

export interface GoalResult {
  month: YearMonth;
  monthsFromNow: number;
}

/** Primeiro mês da projeção em que a meta é atingida, ou null se não for dentro do horizonte. */
export function goalDate(projection: MonthSnapshot[], goal: Goal): GoalResult | null {
  const hit = projection.find((s) => s[goal.metric] >= goal.targetAmount);
  return hit ? { month: hit.month, monthsFromNow: hit.monthIndex } : null;
}

/** 74 meses => 6 anos e 2 meses (para a contagem regressiva). */
export function splitYearsMonths(totalMonths: number): { years: number; months: number } {
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}
