import type { YearMonth } from './types';

const PATTERN = /^(\d{4})-(\d{2})$/;

/** Converte "AAAA-MM" em número de meses desde o ano 0. */
function toIndex(ym: YearMonth): number {
  const m = PATTERN.exec(ym);
  if (!m) throw new Error(`Mês inválido: "${ym}" (use AAAA-MM)`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) throw new Error(`Mês inválido: "${ym}"`);
  return year * 12 + (month - 1);
}

function fromIndex(index: number): YearMonth {
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

export function addMonths(ym: YearMonth, n: number): YearMonth {
  return fromIndex(toIndex(ym) + n);
}

/** Meses de `from` até `to` (negativo se `to` for antes). */
export function monthsBetween(from: YearMonth, to: YearMonth): number {
  return toIndex(to) - toIndex(from);
}
