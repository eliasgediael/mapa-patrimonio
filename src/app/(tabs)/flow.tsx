import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Pill, RoundButton, Screen, SectionHeader } from '../../components/ui';
import type { RecurringItem } from '../../engine';
import { useAppState } from '../../lib/AppStateProvider';
import { formatBRL, formatMonthInput } from '../../lib/format';
import { currentYearMonth, monthlySurplus } from '../../lib/selectors';
import { colors } from '../../theme';

const FREQ: Record<RecurringItem['frequency'], string> = { monthly: '/mês', yearly: '/ano', once: 'uma vez' };

export default function FlowScreen() {
  const { state } = useAppState();
  const incomes = state.items.filter((i) => i.kind === 'income');
  const expenses = state.items.filter((i) => i.kind === 'expense');
  const surplus = monthlySurplus(state, currentYearMonth());

  return (
    <Screen title="Fluxo" right={<RoundButton icon="add" label="Nova receita ou despesa" onPress={() => router.push('/item/new')} />}>
      <Card style={s.summary}>
        <Text style={s.label}>SOBRA MENSAL HOJE</Text>
        <Text style={[s.value, { color: surplus >= 0 ? colors.accent : colors.red }]}>{formatBRL(surplus, { cents: false })}</Text>
        <Text style={s.hint}>Receitas − despesas − parcelas de dívidas. Itens anuais contam 1/12.</Text>
      </Card>

      {state.items.length === 0 && (
        <EmptyState
          icon="swap-vertical-outline"
          title="Nada cadastrado"
          text="Cadastre salário, aluguel, mercado, escola… É isso que move a sua projeção."
        />
      )}

      <List title="RECEITAS" items={incomes} color={colors.accent} onAdd={() => router.push({ pathname: '/item/[id]', params: { id: 'new', kind: 'income' } })} />
      <List title="DESPESAS" items={expenses} color={colors.red} onAdd={() => router.push({ pathname: '/item/[id]', params: { id: 'new', kind: 'expense' } })} />
    </Screen>
  );
}

function List({ title, items, color, onAdd }: { title: string; items: RecurringItem[]; color: string; onAdd: () => void }) {
  return (
    <>
      <SectionHeader title={title} action={{ label: '+ Adicionar', onPress: onAdd }} />
      {items.length > 0 && (
        <Card style={{ paddingVertical: 4 }}>
          {items.map((it, i) => (
            <Card key={it.id} onPress={() => router.push(`/item/${it.id}`)} style={[s.row, i > 0 && s.divider]}>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>
                  {it.name}
                </Text>
                <Text style={s.sub}>
                  {it.frequency === 'once' ? `em ${formatMonthInput(it.startMonth)}` : `desde ${formatMonthInput(it.startMonth)}`}
                  {it.endMonth ? ` até ${formatMonthInput(it.endMonth)}` : ''}
                </Text>
              </View>
              <Text style={[s.amount, { color }]}>{formatBRL(it.amount, { cents: false })}</Text>
              <Pill text={FREQ[it.frequency]} />
            </Card>
          ))}
        </Card>
      )}
    </>
  );
}

const s = StyleSheet.create({
  summary: { alignItems: 'center', gap: 4, marginTop: 8 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  value: { fontSize: 32, fontWeight: '700' },
  hint: { color: colors.dim, fontSize: 12, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
});
