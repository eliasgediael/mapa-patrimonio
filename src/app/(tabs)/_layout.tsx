import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import type { IconName } from '../../components/ui';
import { colors } from '../../theme';

const TABS: { name: string; title: string; icon: IconName; iconOn: IconName }[] = [
  { name: 'index', title: 'Mapa', icon: 'home-outline', iconOn: 'home' },
  { name: 'forecast', title: 'Projeção', icon: 'analytics-outline', iconOn: 'analytics' },
  { name: 'flow', title: 'Fluxo', icon: 'swap-vertical-outline', iconOn: 'swap-vertical' },
  { name: 'people', title: 'Pessoas', icon: 'people-outline', iconOn: 'people' },
  { name: 'whatif', title: 'E se?', icon: 'help-circle-outline', iconOn: 'help-circle' },
  { name: 'settings', title: 'Ajustes', icon: 'settings-outline', iconOn: 'settings' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? t.iconOn : t.icon} size={22} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}

// Barra flutuante arredondada, como na referência
const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    marginHorizontal: 16,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#15171A',
    borderTopWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingBottom: 0,
  },
  item: { paddingVertical: 8 },
  label: { fontSize: 10, fontWeight: '600' },
});
