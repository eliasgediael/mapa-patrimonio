import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { DangerButton, Field, Input, ModalScreen, Segmented } from '../../components/ui';
import { monthsBetween, type Frequency, type RecurringItem } from '../../engine';
import { newId, useAppState } from '../../lib/AppStateProvider';
import { centsToInput, formatMonthInput, parseBRL, parseMonthInput } from '../../lib/format';
import { currentYearMonth } from '../../lib/selectors';
import { colors } from '../../theme';

type Kind = RecurringItem['kind'];

export default function ItemScreen() {
  const { id, kind: kindParam } = useLocalSearchParams<{ id: string; kind?: Kind }>();
  const { state, dispatch } = useAppState();
  const existing = state.items.find((i) => i.id === id);

  const [kind, setKind] = useState<Kind>(existing?.kind ?? kindParam ?? 'expense');
  const [name, setName] = useState(existing?.name ?? '');
  const [amount, setAmount] = useState(existing ? centsToInput(existing.amount) : '');
  const [frequency, setFrequency] = useState<Frequency>(existing?.frequency ?? 'monthly');
  const [start, setStart] = useState(formatMonthInput(existing?.startMonth ?? currentYearMonth()));
  const [end, setEnd] = useState(existing?.endMonth ? formatMonthInput(existing.endMonth) : '');
  const [adjusts, setAdjusts] = useState(existing?.adjustsWithInflation ?? true);

  const amountCents = parseBRL(amount);
  const startMonth = parseMonthInput(start);
  const endMonth = end.trim() ? parseMonthInput(end) : undefined;
  const valid =
    name.trim().length > 0 &&
    amountCents !== null &&
    amountCents > 0 &&
    startMonth !== null &&
    endMonth !== null &&
    (endMonth === undefined || monthsBetween(startMonth, endMonth) >= 0);

  function save() {
    if (!valid) return;
    const item: RecurringItem = {
      id: existing?.id ?? newId(),
      name: name.trim(),
      kind,
      amount: amountCents!,
      frequency,
      startMonth: startMonth!,
      ...(frequency !== 'once' && endMonth && { endMonth }),
      adjustsWithInflation: adjusts,
    };
    dispatch({ type: existing ? 'item/update' : 'item/add', item });
    router.back();
  }

  return (
    <ModalScreen
      title={existing ? 'Editar' : kind === 'income' ? 'Nova receita' : 'Nova despesa'}
      onCancel={() => router.back()}
      onSave={save}
      saveDisabled={!valid}
    >
      <Field label="Tipo">
        <Segmented
          options={[
            { value: 'income', label: 'Receita' },
            { value: 'expense', label: 'Despesa' },
          ]}
          value={kind}
          onChange={setKind}
        />
      </Field>
      <Field label="Nome">
        <Input value={name} onChangeText={setName} placeholder={kind === 'income' ? 'Ex.: Salário' : 'Ex.: Aluguel'} autoFocus={!existing} />
      </Field>
      <Field label="Valor">
        <Input prefix="R$" value={amount} onChangeText={setAmount} placeholder="0,00" keyboardType="decimal-pad" />
      </Field>
      <Field label="Frequência">
        <Segmented
          options={[
            { value: 'monthly', label: 'Mensal' },
            { value: 'yearly', label: 'Anual' },
            { value: 'once', label: 'Uma vez' },
          ]}
          value={frequency}
          onChange={setFrequency}
        />
      </Field>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Field label={frequency === 'once' ? 'Mês' : 'Começa em'}>
            <Input value={start} onChangeText={setStart} placeholder="MM/AAAA" keyboardType="numbers-and-punctuation" />
          </Field>
        </View>
        {frequency !== 'once' && (
          <View style={{ flex: 1 }}>
            <Field label="Termina em (opcional)">
              <Input value={end} onChangeText={setEnd} placeholder="MM/AAAA" keyboardType="numbers-and-punctuation" />
            </Field>
          </View>
        )}
      </View>
      <View style={s.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.switchLabel}>Reajusta com a inflação</Text>
          <Text style={s.switchHint}>Ligado para salário, aluguel, mercado… Desligado para parcelas fixas.</Text>
        </View>
        <Switch value={adjusts} onValueChange={setAdjusts} trackColor={{ true: colors.accent, false: colors.cardAlt }} />
      </View>
      {existing && (
        <DangerButton
          label="Excluir"
          onPress={() => {
            dispatch({ type: 'item/remove', id: existing.id });
            router.back();
          }}
        />
      )}
    </ModalScreen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  switchLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  switchHint: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
