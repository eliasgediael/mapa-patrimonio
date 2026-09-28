import { describe, expect, it } from 'vitest';
import type { Account, Goal, RecurringItem } from '../../engine';
import { initialState, reducer, type AppState } from '../store';
import {
  currentYearMonth,
  goalProgress,
  holdings,
  monthlySurplus,
  netWorthOf,
  waypointHistory,
} from '../selectors';

const cash: Account = { id: 'c', name: 'Conta corrente', type: 'cash', balance: 1_000_000 };
const inv: Account = { id: 'i', name: 'Tesouro', type: 'investment', balance: 3_000_000 };
const home: Account = { id: 'h', name: 'Casa', type: 'asset', balance: 6_000_000 };
const loan: Account = { id: 'd', name: 'Financiamento', type: 'debt', balance: 2_000_000, monthlyPayment: 150_000 };

function withAccounts(...accounts: Account[]): AppState {
  return accounts.reduce((s, account) => reducer(s, { type: 'account/add', account }), initialState);
}

describe('store: contas', () => {
  it('adiciona, edita e remove contas', () => {
    let s = withAccounts(cash, inv);
    s = reducer(s, { type: 'account/update', account: { ...cash, name: 'Nubank' } });
    s = reducer(s, { type: 'account/remove', id: 'i' });
    expect(s.accounts).toEqual([{ ...cash, name: 'Nubank' }]);
  });
});

describe('store: check-in (waypoint)', () => {
  it('atualiza os saldos e registra um waypoint com o patrimônio do momento', () => {
    let s = withAccounts(cash, inv, loan);
    s = reducer(s, {
      type: 'checkin',
      id: 'w1',
      date: '2026-10-20T10:00:00.000Z',
      balances: { c: 1_200_000, i: 3_100_000, d: 1_850_000 },
    });
    expect(s.accounts.map((a) => a.balance)).toEqual([1_200_000, 3_100_000, 1_850_000]);
    expect(s.waypoints).toEqual([
      {
        id: 'w1',
        date: '2026-10-20T10:00:00.000Z',
        netWorth: 2_450_000,
        balances: { c: 1_200_000, i: 3_100_000, d: 1_850_000 },
      },
    ]);
  });

  it('contas não informadas no check-in mantêm o saldo', () => {
    let s = withAccounts(cash, inv);
    s = reducer(s, { type: 'checkin', id: 'w1', date: '2026-10-20T10:00:00.000Z', balances: { c: 0 } });
    expect(s.accounts.find((a) => a.id === 'i')?.balance).toBe(3_000_000);
    expect(s.waypoints[0].netWorth).toBe(3_000_000);
  });

  it('histórico mostra a variação entre um check-in e o anterior (mais recente primeiro)', () => {
    let s = withAccounts(cash);
    s = reducer(s, { type: 'checkin', id: 'w1', date: '2026-09-01T10:00:00.000Z', balances: { c: 1_000_000 } });
    s = reducer(s, { type: 'checkin', id: 'w2', date: '2026-10-01T10:00:00.000Z', balances: { c: 1_427_400 } });
    expect(waypointHistory(s).map((w) => [w.id, w.change])).toEqual([
      ['w2', 427_400],
      ['w1', null],
    ]);
  });
});

describe('store: itens, metas e ajustes', () => {
  it('adiciona e remove receitas/despesas e metas', () => {
    const salario: RecurringItem = {
      id: 's',
      name: 'Salário',
      amount: 800_000,
      kind: 'income',
      frequency: 'monthly',
      startMonth: '2026-10',
      adjustsWithInflation: true,
    };
    const meta: Goal = { id: 'g', name: 'R$ 500 mil', metric: 'netWorth', targetAmount: 50_000_000 };
    let s = reducer(initialState, { type: 'item/add', item: salario });
    s = reducer(s, { type: 'goal/add', goal: meta });
    expect(s.items).toEqual([salario]);
    expect(s.goals).toEqual([meta]);
    s = reducer(s, { type: 'item/remove', id: 's' });
    s = reducer(s, { type: 'goal/remove', id: 'g' });
    expect(s.items).toEqual([]);
    expect(s.goals).toEqual([]);
  });

  it('atualiza as premissas', () => {
    const s = reducer(initialState, { type: 'settings/update', settings: { annualInflation: 0.05 } });
    expect(s.settings.annualInflation).toBe(0.05);
    expect(s.settings.defaultInvestmentReturn).toBe(initialState.settings.defaultInvestmentReturn);
  });
});

describe('selectors', () => {
  it('patrimônio líquido das contas atuais', () => {
    expect(netWorthOf([cash, inv, home, loan])).toBe(8_000_000);
  });

  it('sobra mensal = receitas − despesas − parcelas; itens anuais entram como 1/12', () => {
    let s = withAccounts(cash, loan);
    const base = { frequency: 'monthly' as const, startMonth: '2026-01', adjustsWithInflation: false };
    s = reducer(s, { type: 'item/add', item: { ...base, id: 'a', name: 'Salário', amount: 800_000, kind: 'income' } });
    s = reducer(s, { type: 'item/add', item: { ...base, id: 'b', name: 'Mercado', amount: 200_000, kind: 'expense' } });
    s = reducer(s, {
      type: 'item/add',
      item: { ...base, id: 'c', name: 'IPVA', amount: 240_000, kind: 'expense', frequency: 'yearly' },
    });
    s = reducer(s, {
      type: 'item/add',
      item: { ...base, id: 'd', name: 'Antigo', amount: 999_999, kind: 'expense', endMonth: '2026-05' },
    });
    // 8.000 − 2.000 − 200 (IPVA/12) − 1.500 (parcela) = 4.300
    expect(monthlySurplus(s, '2026-10')).toBe(430_000);
  });

  it('o que você tem: bens em ordem de valor com a fatia de cada um (sem dívidas)', () => {
    const h = holdings([cash, inv, home, loan]);
    expect(h.map((x) => [x.account.id, Math.round(x.share * 100)])).toEqual([
      ['h', 60],
      ['i', 30],
      ['c', 10],
    ]);
  });

  it('progresso da meta usa o valor atual e a data calculada pela projeção', () => {
    const s = reducer(withAccounts(cash), { type: 'settings/update', settings: { annualInflation: 0 } }); // R$ 10.000
    const meta: Goal = { id: 'g', name: 'R$ 40 mil', metric: 'netWorth', targetAmount: 4_000_000 };
    const withIncome = reducer(s, {
      type: 'item/add',
      item: {
        id: 'x',
        name: 'Salário',
        amount: 1_000_000,
        kind: 'income',
        frequency: 'monthly',
        startMonth: '2026-01',
        adjustsWithInflation: true,
      },
    });
    const g = goalProgress(withIncome, meta, new Date('2026-10-15T12:00:00'));
    expect(g.progress).toBeCloseTo(0.25);
    expect(g.eta?.monthsFromNow).toBe(3);
  });

  it('mês atual no formato AAAA-MM', () => {
    expect(currentYearMonth(new Date('2026-01-05T12:00:00'))).toBe('2026-01');
  });
});
