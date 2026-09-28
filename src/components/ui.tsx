import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Tela com rolagem, fundo preto e título grande (estilo iOS). */
export function Screen({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {title !== undefined && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {right}
          </View>
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Cabeçalho de tela modal: Cancelar | Título | Salvar */
export function ModalScreen({
  title,
  onCancel,
  onSave,
  saveLabel = 'Salvar',
  saveDisabled,
  children,
}: {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.modalHeader}>
        <Pressable onPress={onCancel} style={styles.modalCancel} hitSlop={8}>
          <Text style={styles.modalCancelText}>Cancelar</Text>
        </Pressable>
        <Text style={styles.modalTitle}>{title}</Text>
        <Pressable onPress={onSave} disabled={saveDisabled} hitSlop={8} style={styles.modalSaveWrap}>
          <Text style={[styles.modalSave, saveDisabled && { opacity: 0.35 }]}>{saveLabel}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.75 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ProgressBar({ value, color = colors.accent }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Pill({
  text,
  color = colors.muted,
  bg = colors.cardAlt,
  style,
}: {
  text: string;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

export function RoundButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [styles.round, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={20} color="#04140D" />
    </Pressable>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
}

export function Input(props: TextInputProps & { prefix?: string; suffix?: string }) {
  const { prefix, suffix, style, ...rest } = props;
  return (
    <View style={styles.inputWrap}>
      {prefix && <Text style={styles.inputAffix}>{prefix}</Text>}
      <TextInput placeholderTextColor={colors.dim} style={[styles.input, style]} {...rest} />
      {suffix && <Text style={styles.inputAffix}>{suffix}</Text>}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && styles.segmentOn]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextOn]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DangerButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.danger, pressed && { opacity: 0.7 }]}>
      <Text style={styles.dangerText}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: IconName }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.8 }]}>
      {icon && <Ionicons name={icon} size={18} color="#04140D" />}
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={36} color={colors.dim} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 130 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: { color: colors.text, fontSize: 30, fontWeight: '700' },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalCancel: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  modalCancelText: { color: colors.muted, fontSize: 15 },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  modalSaveWrap: { minWidth: 70, alignItems: 'flex-end' },
  modalSave: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  modalScroll: { paddingHorizontal: 16, paddingBottom: 40 },

  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 10,
  },
  sectionTitle: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  sectionAction: { color: colors.accent, fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
  },

  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  pill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '600' },

  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  field: { marginTop: 18 },
  fieldLabel: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  fieldHint: { color: colors.dim, fontSize: 12, marginTop: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  input: { flex: 1, minWidth: 0, color: colors.text, fontSize: 17, paddingVertical: 14 },
  inputAffix: { color: colors.muted, fontSize: 17, marginHorizontal: 4 },

  segmented: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  segmentOn: { backgroundColor: colors.accentSoft },
  segmentText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  segmentTextOn: { color: colors.accent },

  danger: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.redSoft,
    alignItems: 'center',
  },
  dangerText: { color: colors.red, fontSize: 16, fontWeight: '600' },

  primary: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingVertical: 15,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#04140D', fontSize: 16, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center', maxWidth: 280 },
});
