import type { AccountType } from './engine';

export const colors = {
  bg: '#000000',
  card: '#121417',
  cardAlt: '#1A1D21',
  border: '#23262B',
  text: '#FFFFFF',
  muted: '#8B9099',
  dim: '#5C616B',
  accent: '#2EE6A6',
  accentSoft: 'rgba(46, 230, 166, 0.14)',
  purple: '#8B7CF6',
  purpleSoft: 'rgba(139, 124, 246, 0.16)',
  red: '#F2545B',
  redSoft: 'rgba(242, 84, 91, 0.14)',
  yellow: '#F5C451',
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

export const accountTypeInfo: Record<AccountType, { label: string; icon: string; color: string }> = {
  cash: { label: 'Caixa', icon: 'wallet', color: colors.accent },
  investment: { label: 'Investimento', icon: 'trending-up', color: colors.purple },
  asset: { label: 'Bem / Imóvel', icon: 'home', color: colors.yellow },
  debt: { label: 'Dívida', icon: 'card', color: colors.red },
};
