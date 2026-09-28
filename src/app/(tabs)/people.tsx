import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BalanceText } from '../../components/people';
import { Card, EmptyState, PrimaryButton, RoundButton, Screen, SectionHeader } from '../../components/ui';
import { useAppState } from '../../lib/AppStateProvider';
import { formatBRL } from '../../lib/format';
import { bankInfo, groupByCard, installmentsDue, personBalance } from '../../lib/people';
import { currentYearMonth } from '../../lib/selectors';
import { colors } from '../../theme';

export default function PeopleScreen() {
  const { state } = useAppState();
  const month = currentYearMonth();
  const entries = state.sharedEntries;

  const balances = state.people.map((p) => ({ person: p, balance: personBalance(entries, p.id) }));
  const iOwe = balances.reduce((sum, b) => sum + Math.max(b.balance, 0), 0);
  const owedToMe = balances.reduce((sum, b) => sum + Math.max(-b.balance, 0), 0);
  const due = installmentsDue(entries, month);
  const dueToPay = due.filter((i) => i.entry.kind === 'boughtOnTheirCard').reduce((sum, i) => sum + i.amount, 0);
  const cards = groupByCard(entries, month);
  const nameOf = (id: string) => (id === 'me' ? 'Seu cartão' : state.people.find((p) => p.id === id)?.name ?? '?');

  return (
    <Screen title="Pessoas" right={<RoundButton icon="person-add" label="Adicionar pessoa" onPress={() => router.push('/person/new')} />}>
      {state.people.length === 0 ? (
        <Card style={{ marginTop: 8 }}>
          <EmptyState
            icon="people-outline"
            title="Contas com a família"
            text="Cadastre quem divide contas com você (mãe, tio…). Registre compras parceladas no cartão de cada um e o dinheiro que vai e volta."
          />
          <PrimaryButton label="Adicionar pessoa" icon="person-add" onPress={() => router.push('/person/new')} />
        </Card>
      ) : (
        <>
          <Card style={s.summary}>
            <Stat label="VOCÊ DEVE" value={iOwe} color={iOwe > 0 ? colors.red : colors.muted} />
            <View style={s.vr} />
            <Stat label="TE DEVEM" value={owedToMe} color={owedToMe > 0 ? colors.accent : colors.muted} />
            <View style={s.vr} />
            <Stat label="PARCELAS DO MÊS" value={dueToPay} color={colors.text} />
          </Card>

          <SectionHeader title="PESSOAS" />
          <Card style={{ paddingVertical: 4 }}>
            {balances.map(({ person, balance }, i) => {
              const thisMonth = due
                .filter((d) => d.entry.personId === person.id && d.entry.kind === 'boughtOnTheirCard')
                .reduce((sum, d) => sum + d.amount, 0);
              return (
                <Card key={person.id} onPress={() => router.push(`/person/${person.id}`)} style={[s.row, i > 0 && s.divider]}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{person.name.trim().charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name} numberOfLines={1}>
                      {person.name}
                    </Text>
                    <Text style={s.sub}>{thisMonth > 0 ? `Este mês: ${formatBRL(thisMonth)}` : 'Nada vencendo este mês'}</Text>
                  </View>
                  <BalanceText balance={balance} />
                  <Ionicons name="chevron-forward" size={16} color={colors.dim} />
                </Card>
              );
            })}
          </Card>

          {cards.length > 0 && (
            <>
              <SectionHeader title="POR CARTÃO · ESTE MÊS" />
              <Card style={{ paddingVertical: 4 }}>
                {cards.map((g, i) => {
                  const bank = bankInfo(g.bank);
                  return (
                    <View key={g.key} style={[s.row, i > 0 && s.divider]}>
                      <View style={[s.bankDot, { backgroundColor: bank.color }]}>
                        <Ionicons name="card" size={14} color="#000" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.name} numberOfLines={1}>
                          {bank.name} · {nameOf(g.ownerId)}
                        </Text>
                        <Text style={s.sub}>
                          {g.entries.length} {g.entries.length === 1 ? 'compra' : 'compras'}
                        </Text>
                      </View>
                      <Text style={[s.amount, { color: g.dueThisMonth > 0 ? colors.text : colors.dim }]}>
                        {formatBRL(g.dueThisMonth)}
                      </Text>
                    </View>
                  );
                })}
              </Card>
            </>
          )}
        </>
      )}
    </Screen>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]} adjustsFontSizeToFit numberOfLines={1}>
        {formatBRL(value, { cents: false })}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 8 },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '700' },
  vr: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.purple, fontSize: 16, fontWeight: '700' },
  bankDot: { width: 36, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
});
