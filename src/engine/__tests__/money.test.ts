import { describe, expect, it } from 'vitest';
import { annualToMonthlyRate, reaisToCents } from '../money';

describe('dinheiro e taxas', () => {
  it('converte taxa anual em mensal equivalente (juros compostos, não divide por 12)', () => {
    expect(annualToMonthlyRate(0.12)).toBeCloseTo(0.0094888, 6);
    expect(annualToMonthlyRate(0)).toBe(0);
  });

  it('12 meses da taxa mensal equivalente reproduzem a taxa anual', () => {
    const m = annualToMonthlyRate(0.1);
    expect((1 + m) ** 12 - 1).toBeCloseTo(0.1, 12);
  });

  it('converte reais em centavos inteiros sem erro de arredondamento', () => {
    expect(reaisToCents(1234.56)).toBe(123456);
    expect(reaisToCents(0.1 + 0.2)).toBe(30);
  });
});
