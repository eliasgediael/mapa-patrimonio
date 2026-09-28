import { describe, expect, it } from 'vitest';
import { formatMonthInput, formatMonthLong, parseMonthInput, parsePercent, percentToInput } from '../format';

describe('campos de mês', () => {
  it('entende MM/AAAA e AAAA-MM', () => {
    expect(parseMonthInput('10/2026')).toBe('2026-10');
    expect(parseMonthInput('1/2027')).toBe('2027-01');
    expect(parseMonthInput('2026-10')).toBe('2026-10');
  });

  it('rejeita mês inválido ou vazio', () => {
    expect(parseMonthInput('13/2026')).toBeNull();
    expect(parseMonthInput('')).toBeNull();
    expect(parseMonthInput('ontem')).toBeNull();
  });

  it('mostra o mês para edição e por extenso', () => {
    expect(formatMonthInput('2026-10')).toBe('10/2026');
    expect(formatMonthLong('2029-11')).toBe('nov 2029');
  });
});

describe('campos de porcentagem', () => {
  it('converte "4,5" em 0,045', () => {
    expect(parsePercent('4,5')).toBeCloseTo(0.045, 10);
    expect(parsePercent('10')).toBeCloseTo(0.1, 10);
    expect(parsePercent('10%')).toBeCloseTo(0.1, 10);
  });

  it('retorna null para vazio ou inválido', () => {
    expect(parsePercent('')).toBeNull();
    expect(parsePercent('abc')).toBeNull();
  });

  it('mostra a taxa para edição', () => {
    expect(percentToInput(0.045)).toBe('4,5');
    expect(percentToInput(0.1)).toBe('10');
  });
});
