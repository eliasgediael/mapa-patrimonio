import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { DangerButton, Field, Input, ModalScreen, Segmented } from '../../components/ui';
import type { Account, AccountType } from '../../engine';
import { newId, useAppState } from '../../lib/AppStateProvider';
import { centsToInput, parseBRL, parsePercent, percentToInput } from '../../lib/format';

const TYPES: { value: AccountType; label: string }[] = [
  { value: 'cash', label: 'Caixa' },
  { value: 'investment', label: 'Investim.' },
  { value: 'asset', label: 'Bem' },
  { value: 'debt', label: 'Dívida' },
];

const RATE_LABEL: Record<AccountType, string> = {
  cash: 'Rendimento ao ano (opcional)',
  investment: 'Rendimento esperado ao ano',
  asset: 'Valorização ao ano (opcional)',
  debt: 'Juros ao ano',
};

export default function AccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useAppState();
  const existing = state.accounts.find((a) => a.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<AccountType>(existing?.type ?? 'cash');
  const [balance, setBalance] = useState(existing ? centsToInput(existing.balance) : '');
  const [rate, setRate] = useState(existing?.annualRate !== undefined ? percentToInput(existing.annualRate) : '');
  const [payment, setPayment] = useState(existing?.monthlyPayment ? centsToInput(existing.monthlyPayment) : '');

  const balanceCents = parseBRL(balance);
  const rateValue = rate.trim() ? parsePercent(rate) : undefined;
  const paymentCents = type === 'debt' && payment.trim() ? parseBRL(payment) : undefined;
  const valid = name.trim().length > 0 && balanceCents !== null && rateValue !== null && paymentCents !== null;

  function save() {
    if (!valid) return;
    const account: Account = {
      id: existing?.id ?? newId(),
      name: name.trim(),
      type,
      balance: balanceCents!,
      ...(rateValue !== undefined && { annualRate: rateValue }),
      ...(paymentCents !== undefined && { monthlyPayment: paymentCents }),
    };
    dispatch({ type: existing ? 'account/update' : 'account/add', account });
    router.back();
  }

  function remove() {
    if (!existing) return;
    dispatch({ type: 'account/remove', id: existing.id });
    router.back();
  }

  return (
    <ModalScreen title={existing ? 'Editar conta' : 'Nova conta'} onCancel={() => router.back()} onSave={save} saveDisabled={!valid}>
      <Field label="Tipo">
        <Segmented options={TYPES} value={type} onChange={setType} />
      </Field>
      <Field label="Nome">
        <Input value={name} onChangeText={setName} placeholder="Ex.: Nubank, Tesouro Selic, Apartamento" autoFocus={!existing} />
      </Field>
      <Field label={type === 'debt' ? 'Quanto falta pagar' : 'Saldo / valor atual'}>
        <Input prefix="R$" value={balance} onChangeText={setBalance} placeholder="0,00" keyboardType="decimal-pad" />
      </Field>
      <Field
        label={RATE_LABEL[type]}
        hint={type === 'investment' && !rate.trim() ? `Vazio = usa o padrão de Ajustes (${percentToInput(state.settings.defaultInvestmentReturn)}% a.a.)` : undefined}
      >
        <Input value={rate} onChangeText={setRate} placeholder="0" keyboardType="decimal-pad" suffix="% a.a." />
      </Field>
      {type === 'debt' && (
        <Field label="Parcela mensal" hint="Sai do caixa todo mês até quitar.">
          <Input prefix="R$" value={payment} onChangeText={setPayment} placeholder="0,00" keyboardType="decimal-pad" />
        </Field>
      )}
      {existing && <DangerButton label="Excluir conta" onPress={remove} />}
    </ModalScreen>
  );
}
