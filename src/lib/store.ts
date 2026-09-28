import type { Account, Cents, Goal, RecurringItem, Scenario, ValueMode } from '../engine';

export interface Waypoint {
  id: string;
  /** Data/hora ISO do check-in */
  date: string;
  netWorth: Cents;
  balances: Record<string, Cents>;
}

export interface Settings {
  annualInflation: number;
  defaultInvestmentReturn: number;
  valueMode: ValueMode;
}

export interface AppState {
  version: 1;
  accounts: Account[];
  items: RecurringItem[];
  scenarios: Scenario[];
  goals: Goal[];
  waypoints: Waypoint[];
  settings: Settings;
}

export const initialState: AppState = {
  version: 1,
  accounts: [],
  items: [],
  scenarios: [],
  goals: [],
  waypoints: [],
  settings: { annualInflation: 0.045, defaultInvestmentReturn: 0.1, valueMode: 'real' },
};

export type Action =
  | { type: 'state/replace'; state: AppState }
  | { type: 'account/add' | 'account/update'; account: Account }
  | { type: 'account/remove'; id: string }
  | { type: 'item/add' | 'item/update'; item: RecurringItem }
  | { type: 'item/remove'; id: string }
  | { type: 'goal/add' | 'goal/update'; goal: Goal }
  | { type: 'goal/remove'; id: string }
  | { type: 'checkin'; id: string; date: string; balances: Record<string, Cents> }
  | { type: 'settings/update'; settings: Partial<Settings> };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'state/replace':
      return action.state;

    case 'account/add':
      return { ...state, accounts: [...state.accounts, action.account] };
    case 'account/update':
      return { ...state, accounts: replaceById(state.accounts, action.account) };
    case 'account/remove':
      return { ...state, accounts: state.accounts.filter((a) => a.id !== action.id) };

    case 'item/add':
      return { ...state, items: [...state.items, action.item] };
    case 'item/update':
      return { ...state, items: replaceById(state.items, action.item) };
    case 'item/remove':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case 'goal/add':
      return { ...state, goals: [...state.goals, action.goal] };
    case 'goal/update':
      return { ...state, goals: replaceById(state.goals, action.goal) };
    case 'goal/remove':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };

    case 'checkin': {
      const accounts = state.accounts.map((a) =>
        action.balances[a.id] === undefined ? a : { ...a, balance: action.balances[a.id] },
      );
      const balances = Object.fromEntries(accounts.map((a) => [a.id, a.balance]));
      const netWorth = accounts.reduce((sum, a) => sum + (a.type === 'debt' ? -a.balance : a.balance), 0);
      const waypoint: Waypoint = { id: action.id, date: action.date, netWorth, balances };
      return { ...state, accounts, waypoints: [...state.waypoints, waypoint] };
    }

    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.settings } };
  }
}

function replaceById<T extends { id: string }>(list: T[], next: T): T[] {
  return list.map((x) => (x.id === next.id ? next : x));
}
