import { describe, expect, it } from 'vitest';
import { project } from '../projection';
import { account, assumptions, input, START } from './helpers';

describe('projeção: básico', () => {
  it('sem contas e sem fluxos, patrimônio é zero em todos os meses', () => {
    const p = project(input());
    expect(p.every((s) => s.netWorth === 0)).toBe(true);
  });

  it('retorna o check-in + horizonMonths meses, começando no mês do check-in', () => {
    const p = project(input());
    expect(p).toHaveLength(481);
    expect(p[0].month).toBe(START);
    expect(p[0].monthIndex).toBe(0);
    expect(p[480].month).toBe('2066-10');
  });

  it('só caixa, sem fluxo, mantém o saldo constante', () => {
    const p = project(input({ accounts: [account({ type: 'cash', balance: 500_000 })] }));
    expect(p[0].cash).toBe(500_000);
    expect(p[480].cash).toBe(500_000);
  });

  it('patrimônio líquido = caixa + investimentos + bens − dívidas', () => {
    const p = project(
      input({
        accounts: [
          account({ type: 'cash', balance: 100_000 }),
          account({ type: 'investment', balance: 200_000 }),
          account({ type: 'asset', balance: 300_000 }),
          account({ type: 'debt', balance: 50_000 }),
        ],
      }),
    );
    expect(p[0]).toMatchObject({ cash: 100_000, investments: 200_000, assets: 300_000, debts: 50_000 });
    expect(p[0].netWorth).toBe(550_000);
  });

  it('soma várias contas do mesmo tipo', () => {
    const p = project(
      input({
        accounts: [account({ type: 'cash', balance: 100_000 }), account({ type: 'cash', balance: 25_000 })],
      }),
    );
    expect(p[0].cash).toBe(125_000);
  });

  it('rejeita horizonte inválido', () => {
    expect(() => project(input({ assumptions: assumptions({ horizonMonths: -1 }) }))).toThrow();
  });
});
