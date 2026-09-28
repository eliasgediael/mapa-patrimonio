import { describe, expect, it } from 'vitest';
import { project } from '../projection';
import { account, assumptions, input, item } from './helpers';

const real = assumptions({ annualInflation: 0.045, valueMode: 'real' });
const nominal = assumptions({ annualInflation: 0.045, valueMode: 'nominal' });

describe('projeção: inflação e dinheiro de hoje', () => {
  it('investimento que rende igual à inflação fica constante em dinheiro de hoje', () => {
    const p = project(
      input({ accounts: [account({ type: 'investment', balance: 1_000_000, annualRate: 0.045 })], assumptions: real }),
    );
    expect(p[120].investments).toBe(1_000_000);
  });

  it('dinheiro parado perde valor real com a inflação', () => {
    const p = project(input({ accounts: [account({ type: 'cash', balance: 1_000_000 })], assumptions: real }));
    // 1.000.000 / 1,045
    expect(p[12].cash).toBe(956_938);
  });

  it('em valores nominais, dinheiro parado fica igual', () => {
    const p = project(input({ accounts: [account({ type: 'cash', balance: 1_000_000 })], assumptions: nominal }));
    expect(p[12].cash).toBe(1_000_000);
  });

  it('receita reajustada sobe com a inflação em valor nominal (R$ 5.000 → R$ 5.225 em 1 ano)', () => {
    const p = project(
      input({ items: [item({ kind: 'income', amount: 500_000, adjustsWithInflation: true })], assumptions: nominal }),
    );
    expect(p[12].cash - p[11].cash).toBe(522_500);
  });

  it('receita sem reajuste fica igual em valor nominal', () => {
    const p = project(
      input({ items: [item({ kind: 'income', amount: 500_000, adjustsWithInflation: false })], assumptions: nominal }),
    );
    expect(p[12].cash - p[11].cash).toBe(500_000);
  });

  it('em dinheiro de hoje, receita reajustada guardada rendendo a inflação soma exatamente R$ 5.000/mês', () => {
    const p = project(
      input({
        accounts: [account({ type: 'cash', balance: 0, annualRate: 0.045 })],
        items: [item({ kind: 'income', amount: 500_000, adjustsWithInflation: true })],
        assumptions: real,
      }),
    );
    expect(p[12].cash).toBe(6_000_000);
  });

  it('em dinheiro de hoje, receita sem reajuste vale menos a cada mês', () => {
    const p = project(
      input({
        accounts: [account({ type: 'cash', balance: 0, annualRate: 0.045 })],
        items: [item({ kind: 'income', amount: 500_000, adjustsWithInflation: false })],
        assumptions: real,
      }),
    );
    expect(p[12].cash).toBeLessThan(6_000_000);
    expect(p[12].cash).toBeGreaterThan(5_800_000);
  });
});
