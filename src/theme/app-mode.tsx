/**
 * Light / "Knight" mode — the app's single theme state.
 *
 * One provider at the root drives every surface: the login screen, all four
 * tab screens and the floating tab bar. This is what the reference does too —
 * every panel reads one mode flag — and it is why no screen holds its own
 * `useState<Mode>` any more.
 *
 * The choice is persisted, so the app comes back in the theme it was left in.
 * `loadMode` / `peekMode` follow the same cache-then-read-synchronously idiom as
 * `tokenManager`: the root layout awaits `loadMode()` before it renders, so the
 * provider can seed its state synchronously and the app never paints one theme
 * and then flips to the other.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Mode } from '@/constants/rightbank-theme';

const MODE_KEY = 'rightbank.theme.mode';

/** Reference boots in Light. */
const DEFAULT_MODE: Mode = 'light';

let cachedMode: Mode | undefined;

/** Read the stored theme once at startup. Never rejects — a theme is not worth failing a launch over. */
export async function loadMode(): Promise<Mode> {
  if (cachedMode !== undefined) return cachedMode;
  try {
    const stored = await AsyncStorage.getItem(MODE_KEY);
    cachedMode = stored === 'light' || stored === 'dark' ? stored : DEFAULT_MODE;
  } catch {
    cachedMode = DEFAULT_MODE;
  }
  return cachedMode;
}

/** The restored theme, without touching storage. Falls back to the default before `loadMode` resolves. */
export function peekMode(): Mode {
  return cachedMode ?? DEFAULT_MODE;
}

type AppMode = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
};

const AppModeContext = createContext<AppMode | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(peekMode);

  const setMode = useCallback(async (next: Mode) => {
    setModeState(next);
    cachedMode = next;
    // Fire-and-forget: the UI has already switched. A failed write only means
    // the choice is not remembered on the next launch.
    void AsyncStorage.setItem(MODE_KEY, next).catch(() => {});
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const value = useMemo<AppMode>(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

export function useAppMode(): AppMode {
  const value = useContext(AppModeContext);
  if (!value) throw new Error('useAppMode must be used inside <AppModeProvider>.');
  return value;
}
