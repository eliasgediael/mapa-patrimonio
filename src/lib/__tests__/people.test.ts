import { describe, expect, it } from 'vitest';
import { project } from '../../engine';
import {
  groupByCard,
  installmentAmounts,
  installmentProgress,
  installmentsDue,
  peopleAccounts,
  personBalance,
  type SharedEntry,
} from '../people';
import { initialState, reducer, type AppState } from '../store';
import { allAccounts, monthlySurplus, netWorthOf } from '../selectors';

const mae = { id: 'mae', name: 'Mãe' };
const tio = { id: 'tio', name: 'Tio' };

function entry(e: Partial<SharedEntry> & Pick<SharedEntry, 'id' | 'personId' | 'kind' | 'total'>): SharedEntry {
  return { description: e.id, installments: 1, firstMonth: '2026-10', ...e };
}

// Geladeira de R$ 1.200 em 6x no Nubank da mãe, a partir de out/2026
const geladeira = entry({ id: 'g', personId: 'mae', kind: 'boughtOnTheirCard', total: 120_000, installments: 6, bank: 'nubank' });
// Tio comprou R$ 300 em 3x no meu PicPay
const tioCompra = entry({ id: 't', personId: 'tio', kind: 'boughtOnMyCard', total: 30_000, installments: 3, bank: 'picpay' });

describe('parcelas', () => {
  it('divide o total e joga os centavos que sobram na última', () => {
    expect(installmentAmounts(120_000, 6)).toEqual([20_000, 20_000, 20_000, 20_000, 20_000, 20_000]);
    expect(installmentAmounts(10_000, 3)).toEqual([3_333, 3_333, 3_334]);
    expect(installmentAmounts(5_000, 1)).toEqual([5_000]);
  });

  it('sabe em qual parcela está', () => {
    expect(installmentProgress(geladeira, '2026-09')).toEqual({ paid: 0, left: 6 });
    expect(installmentProgress(geladeira, '2026-10')).toEqual({ paid: 1, left: 5 });
    expect(installmentProgress(geladeira, '2027-03')).toEqual({ paid: 6, left: 0 });
    expect(installmentProgress(geladeira, '2028-01')).toEqual({ paid: 6, left: 0 });
  });

  it('lista as parcelas que vencem no mês', () => {
    const due = installmentsDue([geladeira, tioCompra], '2026-12');
    expect(due.map((d) => [d.entry.id, d.number, d.amount])).toEqual([
      ['g', 3, 20_000],
      ['t', 3, 10_000],
    ]);
    expect(installmentsDue([geladeira, tioCompra], '2027-04')).toEqual([]);
  });
});

describe('saldo com cada pessoa', () => {
  it('compra no cartão dela soma inteira; o que você passa abate', () => {
    const pix = entry({ id: 'p', personId: 'mae', kind: 'iPaid', total: 20_000 });
    expect(personBalance([geladeira, pix], 'mae')).toBe(100_000);
  });

  it('compra no seu cartão vira dinheiro a receber', () => {
    const pagou = entry({ id: 'x', personId: 'tio', kind: 'theyPaid', total: 10_000 });
    expect(personBalance([tioCompra, pagou], 'tio')).toBe(-20_000);
  });

  it('passar dinheiro sem dever faz a pessoa te dever', () => {
    expect(personBalance([entry({ id: 'e', personId: 'tio', kind: 'iPaid', total: 50_000 })], 'tio')).toBe(-50_000);
  });
});

describe('agrupamento por cartão', () => {
  it('separa por dono e banco e soma o que vence no mês', () => {
    const outra = entry({ id: 'o', personId: 'mae', kind: 'boughtOnTheirCard', total: 9_000, installments: 3, bank: 'nubank' });
    const groups = groupByCard([geladeira, outra, tioCompra], '2026-10');
    expect(groups.map((g) => [g.key, g.entries.length, g.dueThisMonth])).toEqual([
      ['mae:nubank', 2, 23_000],
      ['me:picpay', 1, 10_000],
    ]);
  });
});

describe('na projeção', () => {
  it('o que você deve vira dívida paga pelas parcelas; o patrimônio não muda ao pagar', () => {
    const [acc] = peopleAccounts([mae], [geladeira], '2026-10');
    expect(acc).toMatchObject({ type: 'debt', balance: 120_000 });
    expect(acc.schedule).toHaveLength(6);

    const cash = { id: 'c', name: 'Conta', type: 'cash' as const, balance: 500_000 };
    const snaps = project({
      accounts: [cash, acc],
      items: [],
      scenarios: [],
      assumptions: { annualInflation: 0, defaultInvestmentReturn: 0, horizonMonths: 8, startMonth: '2026-10', valueMode: 'nominal' },
    });
    expect(snaps[0].netWorth).toBe(380_000);
    expect(snaps[1]).toMatchObject({ cash: 480_000, debts: 100_000, netWorth: 380_000 });
    expect(snaps[6]).toMatchObject({ cash: 380_000, debts: 0 });
    expect(snaps[8]).toMatchObject({ cash: 380_000, debts: 0 });
  });

  it('parcelas já vencidas não são cobradas de novo', () => {
    const [acc] = peopleAccounts([mae], [geladeira], '2027-02');
    expect(acc.schedule?.map((d) => d.month)).toEqual(['2027-02', '2027-03']);
  });

  it('entra no patrimônio e na sobra do mês', () => {
    let s: AppState = reducer(initialState, { type: 'account/add', account: { id: 'c', name: 'Conta', type: 'cash', balance: 500_000 } });
    s = reducer(s, { type: 'person/add', person: mae });
    s = reducer(s, { type: 'person/add', person: tio });
    s = reducer(s, { type: 'shared/add', entry: geladeira });
    s = reducer(s, { type: 'shared/add', entry: tioCompra });
    expect(netWorthOf(allAccounts(s, '2026-10'))).toBe(500_000 - 120_000 + 30_000);
    expect(monthlySurplus(s, '2026-10')).toBe(-20_000 + 10_000);
  });

  it('excluir a pessoa apaga os lançamentos dela', () => {
    let s: AppState = reducer(initialState, { type: 'person/add', person: mae });
    s = reducer(s, { type: 'shared/add', entry: geladeira });
    s = reducer(s, { type: 'person/remove', id: 'mae' });
    expect(s.sharedEntries).toEqual([]);
  });
});
