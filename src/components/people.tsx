import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatBRL } from '../lib/format';
import { BANKS, type BankId } from '../lib/people';
import { colors, radius } from '../theme';

/** "você deve R$ X" (vermelho) / "te deve R$ X" (verde) / "Acertado" */
export function BalanceText({ balance }: { balance: number }) {
  if (balance === 0) return <Text style={[s.amount, { color: colors.muted }]}>Acertado</Text>;
  const iOwe = balance > 0;
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={s.balanceLabel}>{iOwe ? 'você deve' : 'te deve'}</Text>
      <Text style={[s.amount, { color: iOwe ? colors.red : colors.accent }]}>{formatBRL(Math.abs(balance))}</Text>
    </View>
  );
}

/** Grade de bancos para escolher o cartão. */
export function BankPicker({ value, onChange }: { value: BankId | undefined; onChange: (b: BankId) => void }) {
  return (
    <View style={s.grid}>
      {BANKS.map((b) => {
        const selected = b.id === value;
        return (
          <Pressable
            key={b.id}
            onPress={() => onChange(b.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[s.chip, selected && { borderColor: b.color, backgroundColor: `${b.color}22` }]}
          >
            <View style={[s.dot, { backgroundColor: b.color }]} />
            <Text style={[s.chipText, selected && { color: colors.text }]} numberOfLines={1}>
              {b.name}
            </Text>
            {selected && <Ionicons name="checkmark" size={14} color={b.color} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  amount: { fontSize: 15, fontWeight: '700' },
  balanceLabel: { color: colors.dim, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  chipText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});
