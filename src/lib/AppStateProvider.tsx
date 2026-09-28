import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { loadState, saveState } from './storage';
import { initialState, reducer, type Action, type AppState } from './store';

interface Ctx {
  state: AppState;
  dispatch: (action: Action) => void;
}

const AppStateContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loaded, setLoaded] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    loadState()
      .then((saved) => {
        if (saved) dispatch({ type: 'state/replace', state: { ...initialState, ...saved } });
      })
      .catch((e) => console.warn('Não foi possível carregar os dados salvos', e))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    // não regrava o que acabou de ser carregado
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saveState(state).catch((e) => console.warn('Não foi possível salvar', e));
  }, [state, loaded]);

  if (!loaded) return null;
  return <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>;
}

export function useAppState(): Ctx {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState precisa estar dentro de <AppStateProvider>');
  return ctx;
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
