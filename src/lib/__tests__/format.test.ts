import { describe, expect, it } from 'vitest';
import { formatBRL, formatCompactBRL, formatPercent, parseBRL, relativeTime } from '../format';

describe('formatBRL', () => {
  it('formata centavos em reais no padrão brasileiro', () => {
    expect(formatBRL(12_755_200)).toBe('R$ 127.552,00');
    expect(formatBRL(5)).toBe('R$ 0,05');
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(123_456_789_01)).toBe('R$ 123.456.789,01');
  });

  it('pode esconder os centavos (arredondando)', () => {
    expect(formatBRL(12_755_260, { cents: false })).toBe('R$ 127.553');
  });

  it('mostra sinal para negativos e, se pedido, para positivos', () => {
    expect(formatBRL(-150_000)).toBe('-R$ 1.500,00');
    expect(formatBRL(427_400, { cents: false, sign: true })).toBe('+R$ 4.274');
    expect(formatBRL(0, { sign: true })).toBe('R$ 0,00');
  });
});

describe('formatCompactBRL', () => {
  it('resume valores grandes', () => {
    expect(formatCompactBRL(41_600_000)).toBe('R$ 416 mil');
    expect(formatCompactBRL(110_000_000)).toBe('R$ 1,1 mi');
    expect(formatCompactBRL(100_000_000)).toBe('R$ 1 mi');
    expect(formatCompactBRL(95_000)).toBe('R$ 950');
    expect(formatCompactBRL(1_250_000)).toBe('R$ 12,5 mil');
    expect(formatCompactBRL(-5_000_000)).toBe('-R$ 50 mil');
  });
});

describe('parseBRL (o que o usuário digita)', () => {
  it('entende vírgula como decimal e ponto como milhar', () => {
    expect(parseBRL('1.234,56')).toBe(123_456);
    expect(parseBRL('1234,5')).toBe(123_450);
    expect(parseBRL('R$ 1.234')).toBe(123_400);
    expect(parseBRL('1.234.567')).toBe(123_456_700);
  });

  it('aceita ponto como decimal quando não há vírgula e há 1 ou 2 casas', () => {
    expect(parseBRL('1234.56')).toBe(123_456);
  });

  it('aceita negativo', () => {
    expect(parseBRL('-50')).toBe(-5_000);
  });

  it('retorna null para texto vazio ou inválido', () => {
    expect(parseBRL('')).toBeNull();
    expect(parseBRL('  ')).toBeNull();
    expect(parseBRL('abc')).toBeNull();
  });
});

describe('formatPercent', () => {
  it('formata fração como porcentagem com vírgula', () => {
    expect(formatPercent(0.24)).toBe('24%');
    expect(formatPercent(0.045, 1)).toBe('4,5%');
  });
});

describe('relativeTime', () => {
  const now = new Date('2026-10-20T12:00:00');
  it('descreve há quanto tempo foi', () => {
    expect(relativeTime('2026-10-20T08:00:00', now)).toBe('hoje');
    expect(relativeTime('2026-10-19T08:00:00', now)).toBe('ontem');
    expect(relativeTime('2026-10-15T12:00:00', now)).toBe('há 5 dias');
    expect(relativeTime('2026-10-06T12:00:00', now)).toBe('há 2 semanas');
    expect(relativeTime('2026-07-20T12:00:00', now)).toBe('há 3 meses');
    expect(relativeTime('2025-10-10T12:00:00', now)).toBe('há 1 ano');
  });
});
