import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Card, Field, Input, Screen, SectionHeader } from '../../components/ui';
import { useAppState } from '../../lib/AppStateProvider';
import { parsePercent, percentToInput } from '../../lib/format';
import { colors } from '../../theme';

export default function SettingsScreen() {
  const { state, dispatch } = useAppState();
  const { settings } = state;
  const [inflation, setInflation] = useState(percentToInput(settings.annualInflation));
  const [ret, setRet] = useState(percentToInput(settings.defaultInvestmentReturn));

  function commit(field: 'annualInflation' | 'defaultInvestmentReturn', text: string, reset: (t: string) => void) {
    const v = parsePercent(text);
    if (v === null) {
      reset(percentToInput(settings[field])); // valor inválido: volta ao anterior
      return;
    }
    dispatch({ type: 'settings/update', settings: { [field]: v } });
  }

  return (
    <Screen title="Ajustes">
      <SectionHeader title="PREMISSAS DA PROJEÇÃO" />
      <Card>
        <Field label="Inflação esperada">
          <Input
            value={inflation}
            onChangeText={setInflation}
            onBlur={() => commit('annualInflation', inflation, setInflation)}
            keyboardType="decimal-pad"
            suffix="% a.a."
          />
        </Field>
        <Field label="Rendimento padrão dos investimentos" hint="Usado nos investimentos sem taxa própria.">
          <Input
            value={ret}
            onChangeText={setRet}
            onBlur={() => commit('defaultInvestmentReturn', ret, setRet)}
            keyboardType="decimal-pad"
            suffix="% a.a."
          />
        </Field>
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchLabel}>Mostrar em dinheiro de hoje</Text>
            <Text style={s.switchHint}>Desconta a inflação das projeções para comparar com o que você conhece hoje.</Text>
          </View>
          <Switch
            value={settings.valueMode === 'real'}
            onValueChange={(on) => dispatch({ type: 'settings/update', settings: { valueMode: on ? 'real' : 'nominal' } })}
            trackColor={{ true: colors.accent, false: colors.cardAlt }}
          />
        </View>
      </Card>
      <Text style={s.footer}>Seus dados ficam só neste aparelho.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  switchLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  switchHint: { color: colors.muted, fontSize: 12, marginTop: 2 },
  footer: { color: colors.dim, fontSize: 12, textAlign: 'center', marginTop: 24 },
});
