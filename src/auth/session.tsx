/**
 * The app's single source of truth for "who is signed in".
 *
 * Route protection reads exactly one boolean from here (`isAuthenticated`), so
 * swapping the placeholder below for real authentication touches this file and
 * nothing else — no route files, no layouts, no navigator structure.
 *
 * To wire up the real thing later:
 *   1. seed `isAuthenticated` from `peekAccessToken()` instead of `false` — the
 *      root layout already awaits `loadTokens()` before first paint, so that
 *      read is synchronous and correct by the time this provider mounts;
 *   2. make `signIn` take credentials and `await login(username, password)`,
 *      which persists the token pair itself;
 *   3. that's it — the guards in `app/_layout.tsx` already react to the flag.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { logout, onUnauthorized, queryClient } from '@/api';

type Session = {
  /** Gate for the whole `(app)` group. */
  isAuthenticated: boolean;
  /** Gate for a future PIN / biometric re-lock inside `(app)`. */
  isLocked: boolean;
  /** True for the one render after sign-in; drives the security interstitial. */
  justSignedIn: boolean;
  /**
   * Set by sign-in, cleared once the biometric opt-in sheet has been answered
   * or ruled out. Separate from `justSignedIn` because the two post-login
   * sheets are a sequence: the security notice is dismissed first, and this
   * still has to be true afterwards.
   */
  askBiometric: boolean;
  signIn: () => void;
  signOut: () => void;
  lock: () => void;
  unlock: () => void;
  clearJustSignedIn: () => void;
  clearAskBiometric: () => void;
};

const AuthContext = createContext<Session | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Temporary stand-in for real authentication. `false` keeps the existing
  // login → Face ID → home flow; flip to `true` to boot straight into the
  // app while working on a tab screen.
  const isAuthenticated0 = false;

  const [isAuthenticated, setIsAuthenticated] = useState(isAuthenticated0);
  const [isLocked, setIsLocked] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);
  const [askBiometric, setAskBiometric] = useState(false);

  const signIn = useCallback(() => {
    setJustSignedIn(true);
    setAskBiometric(true);
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    setIsLocked(false);
    setJustSignedIn(false);
    setAskBiometric(false);
    // A signed-out session must not leave account data in memory for the next
    // person to sign in on this device.
    // Revokes server-side where possible, then clears the keystore. Fire-and-
    // forget: the guard has already flipped and the UI is on the login screen.
    void logout();
    queryClient.clear();
  }, []);

  const lock = useCallback(() => setIsLocked(true), []);
  const unlock = useCallback(() => setIsLocked(false), []);
  const clearJustSignedIn = useCallback(() => setJustSignedIn(false), []);
  const clearAskBiometric = useCallback(() => setAskBiometric(false), []);

  // A 401 from any gateway call means the session is gone server-side. The API
  // layer deliberately knows nothing about navigation, so it publishes here and
  // the guard does the redirecting.
  useEffect(() => onUnauthorized(signOut), [signOut]);

  const value = useMemo<Session>(
    () => ({
      isAuthenticated,
      isLocked,
      justSignedIn,
      askBiometric,
      signIn,
      signOut,
      lock,
      unlock,
      clearJustSignedIn,
      clearAskBiometric,
    }),
    [
      isAuthenticated,
      isLocked,
      justSignedIn,
      askBiometric,
      signIn,
      signOut,
      lock,
      unlock,
      clearJustSignedIn,
      clearAskBiometric,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Session {
  const session = useContext(AuthContext);
  if (!session) throw new Error('useAuth must be used inside <AuthProvider>.');
  return session;
}
