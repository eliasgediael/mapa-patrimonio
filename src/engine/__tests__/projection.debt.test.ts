import { describe, expect, it } from 'vitest';
import { project } from '../projection';
import { account, input } from './helpers';

describe('projeção: dívidas', () => {
  it('juros incidem antes da parcela, e a parcela sai do caixa', () => {
    const p = project(
      input({
        accounts: [
          account({ type: 'cash', balance: 500_000 }),
          account({ type: 'debt', balance: 1_000_000, annualRate: 0.12, monthlyPayment: 100_000 }),
        ],
      }),
    );
    // 1.000.000 × (1 + 0,94888%) − 100.000 = 909.488,79
    expect(p[1].debts).toBe(909_489);
    expect(p[1].cash).toBe(400_000);
  });

  it('dívida quitada não fica negativa e para de cobrar parcela', () => {
    const p = project(
      input({ accounts: [account({ type: 'debt', balance: 150_000, monthlyPayment: 100_000 })] }),
    );
    expect(p[1]).toMatchObject({ debts: 50_000, cash: -100_000 });
    expect(p[2]).toMatchObject({ debts: 0, cash: -150_000 });
    expect(p[3]).toMatchObject({ debts: 0, cash: -150_000 });
  });

  it('pagar dívida sem juros não muda o patrimônio líquido', () => {
    const p = project(
      input({
        accounts: [
          account({ type: 'cash', balance: 300_000 }),
          account({ type: 'debt', balance: 200_000, monthlyPayment: 50_000 }),
        ],
      }),
    );
    expect(p[0].netWorth).toBe(100_000);
    expect(p[4].netWorth).toBe(100_000);
  });
});
