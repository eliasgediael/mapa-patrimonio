import Storage from 'expo-sqlite/kv-store';
import type { AppState } from './store';

// iPhone/Android: salva no SQLite do próprio aparelho. (A web usa storage.web.ts.)
const KEY = 'mapa-patrimonio/state';

export async function loadState(): Promise<AppState | null> {
  const raw = await Storage.getItem(KEY);
  return raw ? (JSON.parse(raw) as AppState) : null;
}

export async function saveState(state: AppState): Promise<void> {
  await Storage.setItem(KEY, JSON.stringify(state));
}
