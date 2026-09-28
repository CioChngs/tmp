/**
 * Root layout — app-wide providers and the one place route protection lives.
 *
 * Everything that must outlive a navigation (gesture root, query cache, session)
 * is mounted here, above the navigator, so it survives sign-in and sign-out.
 *
 * The navigator itself is only two guarded groups: `(auth)` for people who are
 * not signed in and `(app)` for people who are. Individual screens carry no
 * auth checks — adding a screen to `(app)` protects it automatically.
 *
 * Startup blocks on the fonts, the persisted theme and the stored session. All
 * three must resolve before the first paint, or the app visibly corrects itself
 * — a fallback typeface reflowing, or Light flipping to Knight.
 */
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { loadTokens, queryClient } from '@/api';
import { loadBiometricLogin } from '@/auth/biometric-login';
import { loadRememberedUser } from '@/auth/remembered-user';
import { AuthProvider, useAuth } from '@/auth/session';
import { AppModeProvider, loadMode } from '@/theme/app-mode';
import { SystemNavigationBar } from '@/theme/system-navigation-bar';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // Restores the saved theme, the stored token pair, the last signed-in username
  // and whether that user turned on biometric login. All four resolve to a
  // usable default when storage is empty or unreadable, so none of them can
  // wedge the splash screen. Reading them here rather than on demand is what
  // lets their consumers be synchronous: the Axios request interceptor never
  // hits the keystore, and the login screen knows on its very first render
  // whether to open at the full form, the password-only one or the Face ID one
  // — so the returning user never sees the wrong one flash.
  const [storageLoaded, setStorageLoaded] = useState(false);
  useEffect(() => {
    Promise.all([loadMode(), loadTokens(), loadRememberedUser(), loadBiometricLogin()]).then(() =>
      setStorageLoaded(true)
    );
  }, []);

  const ready = fontsLoaded && storageLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Every screen in this app draws edge to edge and insets its own content
          — see the safe-area rule in AGENTS.md — so the thing that measures the
          status bar, the notch and the navigation bar has to be above all of
          them. Without it `useSafeAreaInsets()` falls back to the copy React
          Navigation mounts around each navigator, which covers screens but not
          anything rendered beside one, and reports nothing at all on the first
          frame.

          `initialWindowMetrics` is what removes that first frame: the insets
          are read synchronously from the native side at startup, so the login
          sheet is laid out clear of the navigation bar on its very first paint
          rather than jumping once the real measurement arrives. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryClientProvider client={queryClient}>
          {/* Above the navigator, so one theme covers the login screen and the
              signed-in shell alike and survives sign-out. */}
          <AppModeProvider>
            {/* Inside the provider and above the navigator, so the Android
                navigation bar follows Light / Knight on every screen rather
                than each screen remembering to. */}
            <SystemNavigationBar />
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </AppModeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Split out so it can call `useAuth()` — a layout cannot consume a provider it
 * renders itself.
 *
 * `Stack.Protected` unmounts the group whose guard is false and redirects to the
 * remaining one, which is what makes sign-in and sign-out work without any
 * imperative `router.replace` at the call sites. A deep link into `/card` while
 * signed out lands on the login screen instead of a blank protected screen.
 */
function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated}>
        {/* `animation: 'none'` keeps sign-in instant, as it was when the login
            screen replaced straight into `/home`. */}
        <Stack.Screen name="(app)" options={{ animation: 'none' }} />
      </Stack.Protected>
    </Stack>
  );
}
