import type { AppState } from './store';

// Versão web (usada só para visualizar no navegador): localStorage.
const KEY = 'mapa-patrimonio/state';

export async function loadState(): Promise<AppState | null> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // sem armazenamento disponível: segue só em memória
  }
}
