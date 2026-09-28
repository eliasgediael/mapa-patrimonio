import { describe, expect, it } from 'vitest';
import { project } from '../projection';
import { goalDate, splitYearsMonths } from '../goals';
import type { Goal } from '../types';
import { account, input, item, START } from './helpers';

const milhao: Goal = { id: 'g1', name: 'Primeiro milhão', metric: 'netWorth', targetAmount: 100_000_000 };

describe('metas (North Star)', () => {
  it('meta já atingida retorna o mês atual', () => {
    const p = project(input({ accounts: [account({ type: 'cash', balance: 100_000_000 })] }));
    expect(goalDate(p, milhao)).toEqual({ month: START, monthsFromNow: 0 });
  });

  it('meta atingida no 37º mês retorna a data certa', () => {
    // 36 meses × 2.702.703 = 97.297.308 (falta) ; 37 meses = 100.000.011 (atinge)
    const p = project(input({ items: [item({ kind: 'income', amount: 2_702_703 })] }));
    expect(goalDate(p, milhao)).toEqual({ month: '2029-11', monthsFromNow: 37 });
  });

  it('meta inalcançável em 40 anos retorna null', () => {
    const p = project(input({ accounts: [account({ type: 'cash', balance: 100 })] }));
    expect(goalDate(p, milhao)).toBeNull();
  });

  it('meta pode olhar só para os investimentos', () => {
    const p = project(
      input({
        accounts: [
          account({ type: 'asset', balance: 200_000_000 }),
          account({ type: 'investment', balance: 50_000_000, annualRate: 0.12 }),
        ],
      }),
    );
    const meta: Goal = { id: 'g2', name: 'Investimentos 1 mi', metric: 'investments', targetAmount: 100_000_000 };
    // 500 mil a 12% a.a. dobra em pouco mais de 6 anos
    expect(goalDate(p, meta)?.monthsFromNow).toBe(74);
  });

  it('converte meses em anos e meses para a contagem regressiva', () => {
    expect(splitYearsMonths(74)).toEqual({ years: 6, months: 2 });
    expect(splitYearsMonths(0)).toEqual({ years: 0, months: 0 });
  });
});
