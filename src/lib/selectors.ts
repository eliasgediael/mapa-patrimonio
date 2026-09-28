import {
  goalDate,
  monthsBetween,
  project,
  type Account,
  type Cents,
  type Goal,
  type GoalResult,
  type MonthSnapshot,
  type RecurringItem,
  type YearMonth,
} from '../engine';
import { peopleAccounts } from './people';
import type { AppState, Waypoint } from './store';

export function currentYearMonth(now: Date = new Date()): YearMonth {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Suas contas + o que você deve a cada pessoa (dívida) ou tem a receber delas. */
export function allAccounts(state: AppState, month: YearMonth): Account[] {
  return [...state.accounts, ...peopleAccounts(state.people, state.sharedEntries, month)];
}

export function netWorthOf(accounts: Account[]): Cents {
  return accounts.reduce((sum, a) => sum + (a.type === 'debt' ? -a.balance : a.balance), 0);
}

function isActive(item: RecurringItem, month: YearMonth): boolean {
  if (monthsBetween(item.startMonth, month) < 0) return false;
  return !item.endMonth || monthsBetween(month, item.endMonth) >= 0;
}

/** Quanto sobra por mês hoje: receitas − despesas − parcelas (inclusive as combinadas com pessoas). Itens anuais contam 1/12; pontuais não contam. */
export function monthlySurplus(state: AppState, month: YearMonth): Cents {
  let total = 0;
  for (const item of state.items) {
    if (item.frequency === 'once' || !isActive(item, month)) continue;
    const monthly = item.frequency === 'yearly' ? item.amount / 12 : item.amount;
    total += item.kind === 'income' ? monthly : -monthly;
  }
  for (const a of allAccounts(state, month)) {
    if (a.type === 'debt' && a.monthlyPayment) total -= Math.min(a.monthlyPayment, Math.max(a.balance, 0));
    const due = (a.schedule ?? []).filter((d) => d.month === month).reduce((sum, d) => sum + d.amount, 0);
    const settled = Math.min(due, Math.max(a.balance, 0));
    total += a.type === 'debt' ? -settled : settled;
  }
  return Math.round(total);
}

export interface Holding {
  account: Account;
  /** fatia do total de bens (0..1) */
  share: number;
}

/** "O que você tem": tudo menos dívidas, do maior para o menor. */
export function holdings(accounts: Account[]): Holding[] {
  const owned = accounts.filter((a) => a.type !== 'debt');
  const total = owned.reduce((sum, a) => sum + Math.max(a.balance, 0), 0);
  return owned
    .slice()
    .sort((a, b) => b.balance - a.balance)
    .map((account) => ({ account, share: total > 0 ? Math.max(account.balance, 0) / total : 0 }));
}

export interface WaypointEntry extends Waypoint {
  /** variação do patrimônio em relação ao check-in anterior; null no primeiro */
  change: Cents | null;
}

/** Usa a ordem em que os check-ins foram feitos (não a data), para não depender do relógio do aparelho. */
export function waypointHistory(state: AppState): WaypointEntry[] {
  const list = state.waypoints;
  return list.map((w, i) => ({ ...w, change: i === 0 ? null : w.netWorth - list[i - 1].netWorth })).reverse();
}

export function buildProjection(state: AppState, now: Date = new Date(), horizonMonths = 480): MonthSnapshot[] {
  return project({
    accounts: allAccounts(state, currentYearMonth(now)),
    items: state.items,
    scenarios: state.scenarios,
    assumptions: { ...state.settings, horizonMonths, startMonth: currentYearMonth(now) },
  });
}

export interface GoalStatus {
  goal: Goal;
  current: Cents;
  /** 0..1 */
  progress: number;
  eta: GoalResult | null;
}

export function goalProgress(
  state: AppState,
  goal: Goal,
  now: Date = new Date(),
  projection: MonthSnapshot[] = buildProjection(state, now),
): GoalStatus {
  const current = projection[0][goal.metric];
  const progress = goal.targetAmount > 0 ? Math.min(Math.max(current / goal.targetAmount, 0), 1) : 1;
  return { goal, current, progress, eta: goalDate(projection, goal) };
}
