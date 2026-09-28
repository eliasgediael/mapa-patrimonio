import { annualToMonthlyRate } from './money';
import { addMonths, monthsBetween } from './month';
import type { Account, MonthSnapshot, ProjectionInput, RecurringItem, YearMonth } from './types';

/**
 * Projeta o patrimônio mês a mês.
 *
 * Tudo é calculado em valores nominais e, se `valueMode` for 'real',
 * cada foto é dividida pela inflação acumulada (vira "dinheiro de hoje").
 *
 * Ordem dentro de cada mês:
 *   1. cada conta rende/valoriza/cobra juros sobre o saldo de abertura;
 *   2. parcelas de dívida saem do caixa e abatem a dívida; acertos agendados movem saldo ↔ caixa;
 *   3. receitas e despesas do mês entram/saem do caixa.
 */
export function project(input: ProjectionInput): MonthSnapshot[] {
  const { accounts, items, scenarios, assumptions } = input;
  const { horizonMonths, startMonth, annualInflation, defaultInvestmentReturn, valueMode } = assumptions;

  if (!Number.isInteger(horizonMonths) || horizonMonths < 0) {
    throw new Error(`horizonMonths inválido: ${horizonMonths}`);
  }
  monthsBetween(startMonth, startMonth); // valida o formato do mês

  const inflationMonthly = annualToMonthlyRate(annualInflation);
  const allItems = [...items, ...scenarios.filter((s) => s.active).flatMap((s) => s.modifiers)];

  const state = accounts.map((a) => ({
    account: a,
    balance: a.balance,
    monthlyRate: annualToMonthlyRate(rateFor(a, defaultInvestmentReturn)),
  }));
  // Receitas e despesas caem na primeira conta de caixa; sem nenhuma, num caixa implícito sem rendimento.
  let cashTarget = state.find((s) => s.account.type === 'cash');
  if (!cashTarget) {
    cashTarget = {
      account: { id: '__caixa', name: 'Caixa', type: 'cash', balance: 0 },
      balance: 0,
      monthlyRate: 0,
    };
    state.push(cashTarget);
  }

  const snapshots: MonthSnapshot[] = [snapshot(state, startMonth, 0, 1)];

  for (let i = 1; i <= horizonMonths; i++) {
    const month = addMonths(startMonth, i - 1); // mês sendo processado
    const inflationIndex = (1 + inflationMonthly) ** i;

    for (const s of state) s.balance *= 1 + s.monthlyRate;

    for (const s of state) {
      if (s.account.type !== 'debt' || !s.account.monthlyPayment) continue;
      const payment = Math.min(s.account.monthlyPayment, Math.max(s.balance, 0));
      s.balance -= payment;
      cashTarget.balance -= payment;
    }

    for (const s of state) {
      for (const due of s.account.schedule ?? []) {
        if (due.month !== month) continue;
        const amount = Math.min(due.amount, Math.max(s.balance, 0));
        s.balance -= amount;
        cashTarget.balance += s.account.type === 'debt' ? -amount : amount;
      }
    }

    for (const it of allItems) {
      if (!occursIn(it, month)) continue;
      const amount = it.adjustsWithInflation ? it.amount * inflationIndex : it.amount;
      cashTarget.balance += it.kind === 'income' ? amount : -amount;
    }

    const deflator = valueMode === 'real' ? inflationIndex : 1;
    snapshots.push(snapshot(state, addMonths(startMonth, i), i, deflator));
  }

  return snapshots;
}

function rateFor(a: Account, defaultInvestmentReturn: number): number {
  if (a.annualRate !== undefined) return a.annualRate;
  return a.type === 'investment' ? defaultInvestmentReturn : 0;
}

function occursIn(it: RecurringItem, month: YearMonth): boolean {
  const since = monthsBetween(it.startMonth, month);
  if (since < 0) return false;
  if (it.endMonth && monthsBetween(month, it.endMonth) < 0) return false;
  switch (it.frequency) {
    case 'once':
      return since === 0;
    case 'yearly':
      return since % 12 === 0;
    case 'monthly':
      return true;
  }
}

function snapshot(
  state: { account: Account; balance: number }[],
  month: YearMonth,
  monthIndex: number,
  deflator: number,
): MonthSnapshot {
  const totals = { cash: 0, investments: 0, assets: 0, debts: 0 };
  for (const s of state) {
    const key = ({ cash: 'cash', investment: 'investments', asset: 'assets', debt: 'debts' } as const)[s.account.type];
    totals[key] += s.balance;
  }
  // Arredonda só na saída; o cálculo interno mantém a precisão.
  const cash = Math.round(totals.cash / deflator);
  const investments = Math.round(totals.investments / deflator);
  const assets = Math.round(totals.assets / deflator);
  const debts = Math.round(totals.debts / deflator);
  return { month, monthIndex, cash, investments, assets, debts, netWorth: cash + investments + assets - debts };
}
