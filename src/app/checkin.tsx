import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, Input, ModalScreen, SectionHeader, type IconName } from '../components/ui';
import type { AccountType, Cents } from '../engine';
import { newId, useAppState } from '../lib/AppStateProvider';
import { centsToInput, formatBRL, parseBRL } from '../lib/format';
import { netWorthOf } from '../lib/selectors';
import { accountTypeInfo, colors } from '../theme';

const ORDER: AccountType[] = ['cash', 'investment', 'asset', 'debt'];

export default function CheckInScreen() {
  const { state, dispatch } = useAppState();
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(state.accounts.map((a) => [a.id, centsToInput(a.balance)])),
  );

  const parsed: Record<string, Cents | null> = Object.fromEntries(
    state.accounts.map((a) => [a.id, parseBRL(texts[a.id] ?? '')]),
  );
  const invalid = Object.values(parsed).some((v) => v === null);
  const current = netWorthOf(state.accounts);
  const preview = netWorthOf(state.accounts.map((a) => ({ ...a, balance: parsed[a.id] ?? a.balance })));
  const diff = preview - current;

  function save() {
    if (invalid) return;
    dispatch({
      type: 'checkin',
      id: newId(),
      date: new Date().toISOString(),
      balances: parsed as Record<string, Cents>,
    });
    router.back();
  }

  return (
    <ModalScreen title="Check-in" onCancel={() => router.back()} onSave={save} saveDisabled={invalid || state.accounts.length === 0}>
      <Card style={s.summary}>
        <Text style={s.label}>NOVO PATRIMÔNIO LÍQUIDO</Text>
        <Text style={s.value}>{formatBRL(preview, { cents: false })}</Text>
        <Text style={[s.diff, { color: diff >= 0 ? colors.accent : colors.red }]}>
          {diff === 0 ? 'sem mudança' : `${diff > 0 ? '↗' : '↘'} ${formatBRL(diff, { cents: false, sign: true })} desde a última vez`}
        </Text>
      </Card>

      {state.accounts.length === 0 && (
        <EmptyState icon="wallet-outline" title="Nenhuma conta ainda" text="Cadastre suas contas no Mapa antes de fazer o check-in." />
      )}

      {ORDER.map((type) => {
        const list = state.accounts.filter((a) => a.type === type);
        if (list.length === 0) return null;
        const info = accountTypeInfo[type];
        return (
          <View key={type}>
            <SectionHeader title={info.label.toUpperCase()} />
            <View style={{ gap: 8 }}>
              {list.map((a) => {
                const bad = parsed[a.id] === null;
                return (
                  <View key={a.id} style={s.row}>
                    <Ionicons name={info.icon as IconName} size={18} color={info.color} />
                    <Text style={s.name} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <View style={{ width: 170 }}>
                      <Input
                        prefix="R$"
                        value={texts[a.id]}
                        onChangeText={(t) => setTexts((prev) => ({ ...prev, [a.id]: t }))}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                        style={[s.input, bad && { color: colors.red }]}
                        accessibilityLabel={`Saldo de ${a.name}`}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </ModalScreen>
  );
}

const s = StyleSheet.create({
  summary: { alignItems: 'center', gap: 4, marginTop: 4 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  value: { color: colors.text, fontSize: 32, fontWeight: '700' },
  diff: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1, color: colors.text, fontSize: 15 },
  input: { textAlign: 'right', fontSize: 16, paddingVertical: 11 },
});
