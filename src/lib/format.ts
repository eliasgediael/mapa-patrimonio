import type { Cents, YearMonth } from '../engine';

// Formatação própria (sem Intl) para ser idêntica no iPhone, no Android e na web.

function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatBRL(value: Cents, opts: { cents?: boolean; sign?: boolean } = {}): string {
  const showCents = opts.cents !== false;
  const abs = Math.round(Math.abs(value));
  const body = showCents
    ? `${groupThousands(Math.floor(abs / 100))},${String(abs % 100).padStart(2, '0')}`
    : groupThousands(Math.round(abs / 100));
  const prefix = value < 0 && body !== '0' && body !== '0,00' ? '-' : opts.sign && value > 0 ? '+' : '';
  return `${prefix}R$ ${body}`;
}

/** R$ 416 mil, R$ 1,1 mi */
export function formatCompactBRL(value: Cents): string {
  const reais = Math.abs(value) / 100;
  const prefix = value < 0 ? '-' : '';
  let body: string;
  if (reais >= 1_000_000) body = `${trimDecimal(reais / 1_000_000)} mi`;
  else if (reais >= 100_000) body = `${Math.round(reais / 1_000)} mil`;
  else if (reais >= 1_000) body = `${trimDecimal(reais / 1_000)} mil`;
  else body = String(Math.round(reais));
  return `${prefix}R$ ${body}`;
}

function trimDecimal(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '').replace('.', ',');
}

/** Converte o que o usuário digitou ("1.234,56", "R$ 1234") em centavos. */
export function parseBRL(text: string): Cents | null {
  let s = text.replace(/R\$|\s/g, '');
  if (!s) return null;
  const negative = s.startsWith('-');
  if (negative) s = s.slice(1);
  if (!/^[\d.,]+$/.test(s)) return null;

  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (!/^\d+\.\d{1,2}$/.test(s)) s = s.replace(/\./g, '');

  const value = Number(s);
  if (!Number.isFinite(value)) return null;
  const cents = Math.round(value * 100);
  return negative ? -cents : cents;
}

/** Centavos no formato de edição: 123456 => "1.234,56" */
export function centsToInput(value: Cents): string {
  return formatBRL(value).replace('R$ ', '');
}

export function formatPercent(fraction: number, decimals = 0): string {
  return `${(fraction * 100).toFixed(decimals).replace('.', ',')}%`;
}

const DAY = 24 * 60 * 60 * 1000;

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(then)) / DAY);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `há ${w} ${w === 1 ? 'semana' : 'semanas'}`;
  }
  if (days < 365) {
    const m = Math.floor(days / 30);
    return `há ${m} ${m === 1 ? 'mês' : 'meses'}`;
  }
  const y = Math.floor(days / 365);
  return `há ${y} ${y === 1 ? 'ano' : 'anos'}`;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "10/2026" ou "2026-10" => "2026-10" */
export function parseMonthInput(text: string): YearMonth | null {
  const s = text.trim();
  let year: number;
  let month: number;
  let m = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    month = Number(m[1]);
    year = Number(m[2]);
  } else {
    m = /^(\d{4})-(\d{2})$/.exec(s);
    if (!m) return null;
    year = Number(m[1]);
    month = Number(m[2]);
  }
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** "2026-10" => "10/2026" */
export function formatMonthInput(ym: YearMonth): string {
  const [y, m] = ym.split('-');
  return `${m}/${y}`;
}

/** "2029-11" => "nov 2029" */
export function formatMonthLong(ym: YearMonth): string {
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/** "4,5" => 0.045 */
export function parsePercent(text: string): number | null {
  const s = text.replace(/%|\s/g, '').replace(',', '.');
  if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s) / 100;
}

/** 0.045 => "4,5" */
export function percentToInput(fraction: number): string {
  return String(Number((fraction * 100).toFixed(4))).replace('.', ',');
}

/** 74 => "6a 2m" */
export function formatCountdown(years: number, months: number): string {
  if (years === 0 && months === 0) return 'Atingida';
  if (years === 0) return `${months}m`;
  if (months === 0) return `${years}a`;
  return `${years}a ${months}m`;
}
