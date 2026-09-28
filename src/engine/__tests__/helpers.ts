import type { Account, Assumptions, ProjectionInput, RecurringItem } from '../types';

export const START = '2026-10';

/** Premissas "limpas" para testes: sem inflação, valores nominais, 40 anos. */
export function assumptions(overrides: Partial<Assumptions> = {}): Assumptions {
  return {
    annualInflation: 0,
    defaultInvestmentReturn: 0,
    horizonMonths: 480,
    startMonth: START,
    valueMode: 'nominal',
    ...overrides,
  };
}

export function input(overrides: Partial<ProjectionInput> = {}): ProjectionInput {
  return {
    accounts: [],
    items: [],
    scenarios: [],
    assumptions: assumptions(),
    ...overrides,
  };
}

let seq = 0;

export function account(a: Omit<Account, 'id' | 'name'> & Partial<Pick<Account, 'id' | 'name'>>): Account {
  seq += 1;
  return { id: `acc${seq}`, name: `Conta ${seq}`, ...a };
}

export function item(
  i: Omit<RecurringItem, 'id' | 'name' | 'frequency' | 'startMonth' | 'adjustsWithInflation'> &
    Partial<RecurringItem>,
): RecurringItem {
  seq += 1;
  return {
    id: `item${seq}`,
    name: `Item ${seq}`,
    frequency: 'monthly',
    startMonth: START,
    adjustsWithInflation: false,
    ...i,
  };
}
