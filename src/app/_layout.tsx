import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppStateProvider } from '../lib/AppStateProvider';
import { colors } from '../theme';

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.card, primary: colors.accent },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <AppStateProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="checkin" options={{ presentation: 'modal' }} />
          <Stack.Screen name="account/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="goal/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="item/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="person/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="entry/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </AppStateProvider>
    </ThemeProvider>
  );
}
