import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BankPicker } from '../../components/people';
import { DangerButton, Field, Input, ModalScreen } from '../../components/ui';
import { newId, useAppState } from '../../lib/AppStateProvider';
import { centsToInput, formatBRL, formatMonthInput, parseBRL, parseMonthInput } from '../../lib/format';
import { installmentAmounts, isPurchase, type BankId, type SharedEntry, type SharedKind } from '../../lib/people';
import { currentYearMonth } from '../../lib/selectors';
import { colors, radius } from '../../theme';

export default function EntryScreen() {
  const { id, personId } = useLocalSearchParams<{ id: string; personId: string }>();
  const { state, dispatch } = useAppState();
  const existing = state.sharedEntries.find((e) => e.id === id);
  const person = state.people.find((p) => p.id === (existing?.personId ?? personId));
  const who = person?.name ?? 'a pessoa';

  const [kind, setKind] = useState<SharedKind>(existing?.kind ?? 'boughtOnTheirCard');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [total, setTotal] = useState(existing ? centsToInput(existing.total) : '');
  const [installments, setInstallments] = useState(String(existing?.installments ?? 1));
  const [month, setMonth] = useState(formatMonthInput(existing?.firstMonth ?? currentYearMonth()));
  const [bank, setBank] = useState<BankId | undefined>(existing?.bank);

  const purchase = isPurchase(kind);
  const totalCents = parseBRL(total);
  const n = purchase ? Number(installments) : 1;
  const firstMonth = parseMonthInput(month);
  const valid =
    !!person &&
    description.trim().length > 0 &&
    totalCents !== null &&
    totalCents > 0 &&
    Number.isInteger(n) &&
    n >= 1 &&
    n <= 72 &&
    firstMonth !== null &&
    (!purchase || bank !== undefined);

  const KINDS: { value: SharedKind; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'boughtOnTheirCard', label: `Comprei no cartão de ${who}`, icon: 'card-outline' },
    { value: 'boughtOnMyCard', label: `${who} comprou no meu cartão`, icon: 'card' },
    { value: 'iPaid', label: `Passei dinheiro para ${who}`, icon: 'arrow-up-circle-outline' },
    { value: 'theyPaid', label: `${who} me passou dinheiro`, icon: 'arrow-down-circle-outline' },
  ];

  function save() {
    if (!valid) return;
    const entry: SharedEntry = {
      id: existing?.id ?? newId(),
      personId: person!.id,
      kind,
      description: description.trim(),
      total: totalCents!,
      installments: n,
      firstMonth: firstMonth!,
      ...(purchase && { bank }),
    };
    dispatch({ type: existing ? 'shared/update' : 'shared/add', entry });
    router.back();
  }

  const parts = valid && purchase && n > 1 ? installmentAmounts(totalCents!, n) : null;

  return (
    <ModalScreen title={existing ? 'Editar lançamento' : 'Novo lançamento'} onCancel={() => router.back()} onSave={save} saveDisabled={!valid}>
      <Field label="O que aconteceu?">
        <View style={{ gap: 8 }}>
          {KINDS.map((k) => {
            const selected = k.value === kind;
            return (
              <Pressable
                key={k.value}
                onPress={() => setKind(k.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[s.option, selected && s.optionOn]}
              >
                <Ionicons name={k.icon} size={20} color={selected ? colors.accent : colors.muted} />
                <Text style={[s.optionText, selected && { color: colors.text }]}>{k.label}</Text>
                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? colors.accent : colors.dim} />
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Descrição">
        <Input
          value={description}
          onChangeText={setDescription}
          placeholder={purchase ? 'Ex.: Geladeira, passagem…' : 'Ex.: Pix da parcela'}
        />
      </Field>

      <View style={s.row}>
        <View style={{ flex: 1.4 }}>
          <Field label={purchase ? 'Valor total da compra' : 'Valor'}>
            <Input prefix="R$" value={total} onChangeText={setTotal} placeholder="0,00" keyboardType="decimal-pad" />
          </Field>
        </View>
        {purchase && (
          <View style={{ flex: 1 }}>
            <Field label="Parcelas">
              <Input value={installments} onChangeText={setInstallments} keyboardType="number-pad" suffix="x" />
            </Field>
          </View>
        )}
      </View>
      {parts && (
        <Text style={s.hint}>
          {n}x de {formatBRL(parts[0])}
          {parts[n - 1] !== parts[0] ? ` (última ${formatBRL(parts[n - 1])})` : ''}
        </Text>
      )}

      <Field label={purchase ? 'Mês da 1ª parcela' : 'Mês'}>
        <Input value={month} onChangeText={setMonth} placeholder="MM/AAAA" keyboardType="numbers-and-punctuation" />
      </Field>

      {purchase && (
        <Field label={kind === 'boughtOnTheirCard' ? `Cartão de ${who}` : 'Seu cartão'}>
          <BankPicker value={bank} onChange={setBank} />
        </Field>
      )}

      {existing && (
        <DangerButton
          label="Excluir lançamento"
          onPress={() => {
            dispatch({ type: 'shared/remove', id: existing.id });
            router.back();
          }}
        />
      )}
    </ModalScreen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  hint: { color: colors.muted, fontSize: 13, marginTop: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  optionText: { flex: 1, color: colors.muted, fontSize: 15, fontWeight: '600' },
});
