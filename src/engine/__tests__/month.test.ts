import { describe, expect, it } from 'vitest';
import { addMonths, monthsBetween } from '../month';

describe('meses (AAAA-MM)', () => {
  it('soma meses virando o ano', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-10', 480)).toBe('2066-10');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('conta meses entre duas datas', () => {
    expect(monthsBetween('2026-10', '2027-01')).toBe(3);
    expect(monthsBetween('2026-10', '2026-10')).toBe(0);
    expect(monthsBetween('2027-01', '2026-10')).toBe(-3);
  });

  it('rejeita mês inválido', () => {
    expect(() => addMonths('2026-13', 1)).toThrow();
    expect(() => addMonths('26-01', 1)).toThrow();
  });
});
