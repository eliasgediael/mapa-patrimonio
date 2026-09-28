// Tipos do motor de projeção. Todo valor em dinheiro é em CENTAVOS (inteiro).
// Ex.: R$ 1.234,56 => 123456

export type Cents = number;

/** Mês no formato "AAAA-MM", ex.: "2026-10" */
export type YearMonth = string;

export type AccountType = 'cash' | 'investment' | 'asset' | 'debt';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  /** Saldo atual. Dívidas também são informadas como valor positivo. */
  balance: Cents;
  /**
   * Taxa anual nominal (0.10 = 10% a.a.).
   * Investimento: rendimento. Bem/imóvel: valorização. Dívida: juros. Caixa: rendimento (ex.: poupança).
   * Se omitida: investimento usa `defaultInvestmentReturn`; os demais usam 0.
   */
  annualRate?: number;
  /** Só para dívida: parcela mensal que sai do caixa e abate o saldo. */
  monthlyPayment?: Cents;
}

export type Frequency = 'monthly' | 'yearly' | 'once';

export interface RecurringItem {
  id: string;
  name: string;
  amount: Cents;
  kind: 'income' | 'expense';
  frequency: Frequency;
  category?: string;
  /** Primeiro mês em que o item acontece. Para 'once', o único mês. */
  startMonth: YearMonth;
  /** Último mês (inclusive). Vazio = sem fim. */
  endMonth?: YearMonth;
  /** true = o valor sobe com a inflação (mantém o poder de compra). */
  adjustsWithInflation: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  active: boolean;
  /** Receitas/despesas extras aplicadas sobre o fluxo base quando o cenário está ativo. */
  modifiers: RecurringItem[];
}

export type GoalMetric = 'netWorth' | 'investments' | 'cash';

export interface Goal {
  id: string;
  name: string;
  metric: GoalMetric;
  targetAmount: Cents;
}

export type ValueMode = 'real' | 'nominal';

export interface Assumptions {
  /** Inflação anual (0.045 = 4,5% a.a.) */
  annualInflation: number;
  /** Rendimento anual padrão de investimentos sem taxa própria */
  defaultInvestmentReturn: number;
  /** Quantos meses projetar (480 = 40 anos) */
  horizonMonths: number;
  /** Mês do check-in (saldos informados valem para o início deste mês) */
  startMonth: YearMonth;
  /** 'real' = valores em dinheiro de hoje (descontada a inflação). 'nominal' = valores de cada época. */
  valueMode: ValueMode;
}

/**
 * Foto do patrimônio no INÍCIO de `month`.
 * O índice 0 é o próprio check-in; o índice i já inclui i meses de fluxo e rendimento.
 */
export interface MonthSnapshot {
  month: YearMonth;
  monthIndex: number;
  cash: Cents;
  investments: Cents;
  assets: Cents;
  debts: Cents;
  netWorth: Cents;
}

export interface ProjectionInput {
  accounts: Account[];
  items: RecurringItem[];
  scenarios: Scenario[];
  assumptions: Assumptions;
}
