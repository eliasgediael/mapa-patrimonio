import { addMonths, monthsBetween, type Account, type Cents, type YearMonth } from '../engine';

// Acertos com pessoas: compras parceladas no cartão de alguém e dinheiro que vai e volta.

export type BankId =
  | 'nubank'
  | 'picpay'
  | 'inter'
  | 'itau'
  | 'bradesco'
  | 'santander'
  | 'bb'
  | 'caixa'
  | 'c6'
  | 'mercadopago'
  | 'pagbank'
  | 'neon'
  | 'will'
  | 'outro';

export const BANKS: { id: BankId; name: string; color: string }[] = [
  { id: 'nubank', name: 'Nubank', color: '#A259FF' },
  { id: 'picpay', name: 'PicPay', color: '#21C25E' },
  { id: 'inter', name: 'Inter', color: '#FF7A00' },
  { id: 'itau', name: 'Itaú', color: '#EC7000' },
  { id: 'bradesco', name: 'Bradesco', color: '#E3173E' },
  { id: 'santander', name: 'Santander', color: '#EC0000' },
  { id: 'bb', name: 'Banco do Brasil', color: '#F8D117' },
  { id: 'caixa', name: 'Caixa', color: '#1C7ED6' },
  { id: 'c6', name: 'C6 Bank', color: '#B8BCC4' },
  { id: 'mercadopago', name: 'Mercado Pago', color: '#00B1EA' },
  { id: 'pagbank', name: 'PagBank', color: '#F5C400' },
  { id: 'neon', name: 'Neon', color: '#00D1FF' },
  { id: 'will', name: 'Will Bank', color: '#FFD84D' },
  { id: 'outro', name: 'Outro', color: '#8B9099' },
];

export function bankInfo(id: BankId) {
  return BANKS.find((b) => b.id === id) ?? BANKS[BANKS.length - 1];
}

export interface Person {
  id: string;
  name: string;
}

/**
 * - boughtOnTheirCard: você comprou no cartão da pessoa → você deve
 * - boughtOnMyCard: a pessoa comprou no seu cartão → ela te deve
 * - iPaid: você passou dinheiro pra ela → abate o que você deve (ou ela passa a dever)
 * - theyPaid: ela te passou dinheiro → abate o que ela deve (ou você passa a dever)
 */
export type SharedKind = 'boughtOnTheirCard' | 'boughtOnMyCard' | 'iPaid' | 'theyPaid';

export interface SharedEntry {
  id: string;
  personId: string;
  kind: SharedKind;
  description: string;
  /** Valor total (compra inteira ou dinheiro passado). */
  total: Cents;
  /** Compras: número de parcelas. Transferências: sempre 1. */
  installments: number;
  /** Mês da 1ª parcela (compras) ou da transferência. */
  firstMonth: YearMonth;
  /** Só compras: banco do cartão usado. */
  bank?: BankId;
}

export function isPurchase(kind: SharedKind): boolean {
  return kind === 'boughtOnTheirCard' || kind === 'boughtOnMyCard';
}

/** Positivo = aumenta o que você deve à pessoa. */
function sign(kind: SharedKind): 1 | -1 {
  return kind === 'boughtOnTheirCard' || kind === 'theyPaid' ? 1 : -1;
}

/** Divide o total em parcelas; os centavos que sobram vão na última. */
export function installmentAmounts(total: Cents, installments: number): Cents[] {
  const n = Math.max(1, Math.floor(installments));
  const base = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? total - base * (n - 1) : base));
}

export interface Installment {
  entry: SharedEntry;
  /** 1-based */
  number: number;
  month: YearMonth;
  amount: Cents;
}

export function installmentsOf(entry: SharedEntry): Installment[] {
  return installmentAmounts(entry.total, entry.installments).map((amount, i) => ({
    entry,
    number: i + 1,
    month: addMonths(entry.firstMonth, i),
    amount,
  }));
}

/** Saldo com a pessoa. Positivo = você deve a ela; negativo = ela te deve. */
export function personBalance(entries: SharedEntry[], personId: string): Cents {
  return entries.filter((e) => e.personId === personId).reduce((sum, e) => sum + sign(e.kind) * e.total, 0);
}

/** Parcelas de compras que vencem em `month`. */
export function installmentsDue(entries: SharedEntry[], month: YearMonth): Installment[] {
  return entries
    .filter((e) => isPurchase(e.kind))
    .flatMap(installmentsOf)
    .filter((i) => i.month === month);
}

/** Quantas parcelas já passaram (até `month`, inclusive) e quantas faltam. */
export function installmentProgress(entry: SharedEntry, month: YearMonth): { paid: number; left: number } {
  const since = monthsBetween(entry.firstMonth, month) + 1;
  const paid = Math.min(Math.max(since, 0), entry.installments);
  return { paid, left: entry.installments - paid };
}

export interface CardGroup {
  key: string;
  bank: BankId;
  /** 'me' = seu cartão; senão, id da pessoa dona do cartão */
  ownerId: string;
  entries: SharedEntry[];
  /** Parcelas deste cartão que vencem no mês consultado */
  dueThisMonth: Cents;
}

/** Agrupa as compras pelo cartão usado (dono + banco). */
export function groupByCard(entries: SharedEntry[], month: YearMonth): CardGroup[] {
  const groups = new Map<string, CardGroup>();
  for (const e of entries) {
    if (!isPurchase(e.kind)) continue;
    const bank = e.bank ?? 'outro';
    const ownerId = e.kind === 'boughtOnTheirCard' ? e.personId : 'me';
    const key = `${ownerId}:${bank}`;
    const g = groups.get(key) ?? { key, bank, ownerId, entries: [], dueThisMonth: 0 };
    g.entries.push(e);
    g.dueThisMonth += installmentsOf(e)
      .filter((i) => i.month === month)
      .reduce((sum, i) => sum + i.amount, 0);
    groups.set(key, g);
  }
  return [...groups.values()];
}

/**
 * Contas "virtuais" para a projeção: o que você deve a cada pessoa vira dívida,
 * o que te devem vira valor a receber; as parcelas futuras viram acertos agendados.
 */
export function peopleAccounts(people: Person[], entries: SharedEntry[], month: YearMonth): Account[] {
  const accounts: Account[] = [];
  for (const p of people) {
    const balance = personBalance(entries, p.id);
    if (balance === 0) continue;
    const iOwe = balance > 0;
    const scheduleKind: SharedKind = iOwe ? 'boughtOnTheirCard' : 'boughtOnMyCard';
    const schedule = entries
      .filter((e) => e.personId === p.id && e.kind === scheduleKind)
      .flatMap(installmentsOf)
      .filter((i) => monthsBetween(month, i.month) >= 0)
      .map((i) => ({ month: i.month, amount: i.amount }));
    accounts.push({
      id: `person:${p.id}`,
      name: p.name,
      type: iOwe ? 'debt' : 'asset',
      balance: Math.abs(balance),
      schedule,
    });
  }
  return accounts;
}
