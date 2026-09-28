import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BalanceText } from '../../components/people';
import { Card, DangerButton, Field, Input, ModalScreen, PrimaryButton, SectionHeader } from '../../components/ui';
import { newId, useAppState } from '../../lib/AppStateProvider';
import { formatBRL, formatMonthLong } from '../../lib/format';
import {
  bankInfo,
  groupByCard,
  installmentProgress,
  installmentsOf,
  isPurchase,
  personBalance,
  type SharedEntry,
} from '../../lib/people';
import { currentYearMonth } from '../../lib/selectors';
import { colors } from '../../theme';

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useAppState();
  const existing = state.people.find((p) => p.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const month = currentYearMonth();

  const valid = name.trim().length > 0;

  function save() {
    if (!valid) return;
    const person = { id: existing?.id ?? newId(), name: name.trim() };
    dispatch({ type: existing ? 'person/update' : 'person/add', person });
    if (existing) router.back();
    else router.replace(`/person/${person.id}`);
  }

  const entries = existing ? state.sharedEntries.filter((e) => e.personId === existing.id) : [];
  const balance = existing ? personBalance(state.sharedEntries, existing.id) : 0;
  const cards = groupByCard(entries, month);
  const transfers = entries.filter((e) => !isPurchase(e.kind)).sort((a, b) => b.firstMonth.localeCompare(a.firstMonth));

  function newEntry() {
    // salva o nome antes de sair, caso tenha sido editado
    if (existing && valid && name.trim() !== existing.name) dispatch({ type: 'person/update', person: { ...existing, name: name.trim() } });
    router.push({ pathname: '/entry/[id]', params: { id: 'new', personId: existing!.id } });
  }

  return (
    <ModalScreen
      title={existing ? existing.name : 'Nova pessoa'}
      onCancel={() => router.back()}
      onSave={save}
      saveLabel={existing ? 'Salvar' : 'Criar'}
      saveDisabled={!valid}
    >
      <Field label="Nome">
        <Input value={name} onChangeText={setName} placeholder="Ex.: Mãe, Tio João" autoFocus={!existing} />
      </Field>

      {existing && (
        <>
          <Card style={s.balance}>
            <View style={{ flex: 1 }}>
              <Text style={s.balanceTitle}>Saldo com {existing.name}</Text>
              <Text style={s.balanceHint}>Compras parceladas contam inteiras; o que você passa abate.</Text>
            </View>
            <BalanceText balance={balance} />
          </Card>
          <PrimaryButton label="Novo lançamento" icon="add" onPress={newEntry} />

          {cards.map((g) => {
            const bank = bankInfo(g.bank);
            const owner = g.ownerId === 'me' ? 'seu cartão' : `cartão de ${existing.name}`;
            return (
              <View key={g.key}>
                <SectionHeader title={`${bank.name.toUpperCase()} · ${owner.toUpperCase()}`} />
                <Card style={{ paddingVertical: 4 }}>
                  {g.dueThisMonth > 0 && (
                    <View style={s.cardDue}>
                      <View style={[s.bankBar, { backgroundColor: bank.color }]} />
                      <Text style={s.cardDueText}>
                        Este mês: <Text style={{ color: colors.text, fontWeight: '700' }}>{formatBRL(g.dueThisMonth)}</Text>
                      </Text>
                    </View>
                  )}
                  {g.entries.map((e, i) => (
                    <EntryRow key={e.id} entry={e} month={month} divider={i > 0 || g.dueThisMonth > 0} />
                  ))}
                </Card>
              </View>
            );
          })}

          {transfers.length > 0 && (
            <>
              <SectionHeader title="DINHEIRO QUE FOI E VOLTOU" />
              <Card style={{ paddingVertical: 4 }}>
                {transfers.map((e, i) => (
                  <EntryRow key={e.id} entry={e} month={month} divider={i > 0} />
                ))}
              </Card>
            </>
          )}

          <DangerButton
            label={`Excluir ${existing.name}`}
            onPress={() =>
              Alert.alert(`Excluir ${existing.name}?`, 'Todos os lançamentos com essa pessoa também serão apagados.', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Excluir',
                  style: 'destructive',
                  onPress: () => {
                    dispatch({ type: 'person/remove', id: existing.id });
                    router.back();
                  },
                },
              ])
            }
          />
        </>
      )}
    </ModalScreen>
  );
}

function EntryRow({ entry, month, divider }: { entry: SharedEntry; month: string; divider: boolean }) {
  const purchase = isPurchase(entry.kind);
  const iOweMore = entry.kind === 'boughtOnTheirCard' || entry.kind === 'theyPaid';
  let sub: string;
  if (purchase) {
    const { paid, left } = installmentProgress(entry, month);
    const each = installmentsOf(entry)[0].amount;
    sub =
      entry.installments === 1
        ? `à vista · ${formatMonthLong(entry.firstMonth)}`
        : left === 0
          ? `${entry.installments}x de ${formatBRL(each)} · terminou`
          : `${entry.installments}x de ${formatBRL(each)} · parcela ${Math.max(paid, 1)}/${entry.installments}${paid === 0 ? ` a partir de ${formatMonthLong(entry.firstMonth)}` : ''}`;
  } else {
    sub = `${entry.kind === 'iPaid' ? 'Você passou' : 'Recebeu'} · ${formatMonthLong(entry.firstMonth)}`;
  }
  return (
    <Card
      onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id, personId: entry.personId } })}
      style={[s.row, divider && s.divider]}
    >
      <Ionicons
        name={purchase ? 'bag-handle-outline' : entry.kind === 'iPaid' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
        size={22}
        color={colors.muted}
      />
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>
          {entry.description}
        </Text>
        <Text style={s.sub}>{sub}</Text>
      </View>
      <Text style={[s.amount, { color: iOweMore ? colors.red : colors.accent }]}>
        {iOweMore ? '+' : '−'}
        {formatBRL(entry.total)}
      </Text>
    </Card>
  );
}

const s = StyleSheet.create({
  balance: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  balanceTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  balanceHint: { color: colors.dim, fontSize: 12, marginTop: 2 },
  cardDue: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  bankBar: { width: 4, height: 18, borderRadius: 2 },
  cardDueText: { color: colors.muted, fontSize: 13 },
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
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
});
