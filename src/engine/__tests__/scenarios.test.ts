import { describe, expect, it } from 'vitest';
import { project } from '../projection';
import { goalDate } from '../goals';
import type { Goal, Scenario } from '../types';
import { input, item } from './helpers';

const salario = item({ kind: 'income', amount: 1_000_000 });

function filho(active: boolean): Scenario {
  return { id: 'filho', name: 'Ter um filho', active, modifiers: [item({ kind: 'expense', amount: 200_000 })] };
}

describe('cenários "E se?"', () => {
  it('cenário desligado não altera a projeção', () => {
    const base = project(input({ items: [salario] }));
    const comCenario = project(input({ items: [salario], scenarios: [filho(false)] }));
    expect(comCenario).toEqual(base);
  });

  it('"Ter um filho" (−R$ 2.000/mês) reduz R$ 24.000 em 12 meses', () => {
    const base = project(input({ items: [salario] }));
    const comFilho = project(input({ items: [salario], scenarios: [filho(true)] }));
    expect(base[12].netWorth - comFilho[12].netWorth).toBe(2_400_000);
  });

  it('gasto inesperado de R$ 15.000 hoje adia a meta em 2 meses', () => {
    const meta: Goal = { id: 'm', name: 'R$ 120 mil', metric: 'netWorth', targetAmount: 12_000_000 };
    const gasto: Scenario = {
      id: 'g',
      name: 'Gasto inesperado',
      active: true,
      modifiers: [item({ kind: 'expense', amount: 1_500_000, frequency: 'once' })],
    };

    const antes = goalDate(project(input({ items: [salario] })), meta);
    const depois = goalDate(project(input({ items: [salario], scenarios: [gasto] })), meta);

    expect(antes?.monthsFromNow).toBe(12);
    expect(depois?.monthsFromNow).toBe(14);
  });
});
