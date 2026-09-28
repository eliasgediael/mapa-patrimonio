import type { Cents } from './types';

/** Taxa mensal equivalente: (1 + anual)^(1/12) − 1. Nunca anual / 12. */
export function annualToMonthlyRate(annualRate: number): number {
  return (1 + annualRate) ** (1 / 12) - 1;
}

export function reaisToCents(reais: number): Cents {
  return Math.round(reais * 100);
}

export function centsToReais(cents: Cents): number {
  return cents / 100;
}
