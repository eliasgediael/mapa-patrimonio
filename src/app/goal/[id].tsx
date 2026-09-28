import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { DangerButton, Field, Input, ModalScreen, Segmented } from '../../components/ui';
import type { Goal, GoalMetric } from '../../engine';
import { newId, useAppState } from '../../lib/AppStateProvider';
import { centsToInput, parseBRL } from '../../lib/format';

const METRICS: { value: GoalMetric; label: string }[] = [
  { value: 'netWorth', label: 'Patrimônio' },
  { value: 'investments', label: 'Investimentos' },
  { value: 'cash', label: 'Caixa' },
];

export default function GoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useAppState();
  const existing = state.goals.find((g) => g.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [metric, setMetric] = useState<GoalMetric>(existing?.metric ?? 'netWorth');
  const [target, setTarget] = useState(existing ? centsToInput(existing.targetAmount) : '');

  const targetCents = parseBRL(target);
  const valid = name.trim().length > 0 && targetCents !== null && targetCents > 0;

  function save() {
    if (!valid) return;
    const goal: Goal = { id: existing?.id ?? newId(), name: name.trim(), metric, targetAmount: targetCents! };
    dispatch({ type: existing ? 'goal/update' : 'goal/add', goal });
    router.back();
  }

  return (
    <ModalScreen title={existing ? 'Editar meta' : 'Nova meta'} onCancel={() => router.back()} onSave={save} saveDisabled={!valid}>
      <Field label="Nome">
        <Input value={name} onChangeText={setName} placeholder="Ex.: Independência financeira" autoFocus={!existing} />
      </Field>
      <Field label="O que medir">
        <Segmented options={METRICS} value={metric} onChange={setMetric} />
      </Field>
      <Field label="Valor alvo" hint="Em dinheiro de hoje. O app calcula a data em que você chega lá.">
        <Input prefix="R$" value={target} onChangeText={setTarget} placeholder="1.000.000" keyboardType="decimal-pad" />
      </Field>
      {existing && (
        <DangerButton
          label="Excluir meta"
          onPress={() => {
            dispatch({ type: 'goal/remove', id: existing.id });
            router.back();
          }}
        />
      )}
    </ModalScreen>
  );
}
