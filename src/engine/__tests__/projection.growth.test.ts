import { describe, expect, it } from 'vitest';
import { project } from '../projection';
import { account, assumptions, input } from './helpers';

describe('projeção: rendimento (juros compostos)', () => {
  it('R$ 10.000 investidos a 12% a.a. viram R$ 11.200 em 12 meses', () => {
    const p = project(input({ accounts: [account({ type: 'investment', balance: 1_000_000, annualRate: 0.12 })] }));
    expect(p[12].investments).toBe(1_120_000);
  });

  it('10 anos a 10% a.a. multiplicam o valor por ~2,5937', () => {
    const p = project(input({ accounts: [account({ type: 'investment', balance: 1_000_000, annualRate: 0.1 })] }));
    expect(p[120].investments).toBe(2_593_742);
  });

  it('investimento sem taxa própria usa o rendimento padrão das premissas', () => {
    const p = project(
      input({
        accounts: [account({ type: 'investment', balance: 1_000_000 })],
        assumptions: assumptions({ defaultInvestmentReturn: 0.12 }),
      }),
    );
    expect(p[12].investments).toBe(1_120_000);
  });

  it('imóvel valoriza pela própria taxa', () => {
    const p = project(input({ accounts: [account({ type: 'asset', balance: 50_000_000, annualRate: 0.05 })] }));
    expect(p[12].assets).toBe(52_500_000);
  });

  it('caixa sem taxa não rende', () => {
    const p = project(
      input({
        accounts: [account({ type: 'cash', balance: 1_000_000 })],
        assumptions: assumptions({ defaultInvestmentReturn: 0.12 }),
      }),
    );
    expect(p[12].cash).toBe(1_000_000);
  });
});
