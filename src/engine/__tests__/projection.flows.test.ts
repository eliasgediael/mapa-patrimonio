import { describe, expect, it } from 'vitest';
import { project } from '../projection';
import { input, item } from './helpers';

// Lembrete: o fluxo do mês M aparece na foto do mês seguinte (M+1),
// porque cada foto é o saldo no INÍCIO do mês.

describe('projeção: receitas e despesas', () => {
  it('receita mensal de R$ 5.000 faz o caixa crescer R$ 5.000 por mês', () => {
    const p = project(input({ items: [item({ kind: 'income', amount: 500_000 })] }));
    expect(p[1].cash).toBe(500_000);
    expect(p[12].cash).toBe(6_000_000);
  });

  it('despesa só acontece entre o mês de início e o mês de fim (inclusive)', () => {
    const p = project(
      input({
        items: [item({ kind: 'expense', amount: 100_000, startMonth: '2027-01', endMonth: '2027-03' })],
      }),
    );
    // jan/27 é o 4º mês processado (out, nov, dez, jan) => aparece na foto 4
    expect(p.slice(0, 8).map((s) => s.cash)).toEqual([0, 0, 0, 0, -100_000, -200_000, -300_000, -300_000]);
    expect(p[480].cash).toBe(-300_000);
  });

  it("item 'yearly' só acontece no aniversário do mês de início", () => {
    const p = project(
      input({ items: [item({ kind: 'expense', amount: 300_000, frequency: 'yearly', startMonth: '2027-02' })] }),
    );
    expect(p[4].cash).toBe(0);
    expect(p[5].cash).toBe(-300_000);
    expect(p[16].cash).toBe(-300_000);
    expect(p[17].cash).toBe(-600_000);
    expect(p[29].cash).toBe(-900_000);
  });

  it("item 'once' acontece uma única vez", () => {
    const p = project(input({ items: [item({ kind: 'expense', amount: 1_500_000, frequency: 'once' })] }));
    expect(p[0].cash).toBe(0);
    expect(p[1].cash).toBe(-1_500_000);
    expect(p[480].cash).toBe(-1_500_000);
  });

  it('receitas e despesas se compensam no mesmo mês', () => {
    const p = project(
      input({
        items: [item({ kind: 'income', amount: 800_000 }), item({ kind: 'expense', amount: 650_000 })],
      }),
    );
    expect(p[10].cash).toBe(1_500_000);
  });
});
