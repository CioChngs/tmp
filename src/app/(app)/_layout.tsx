/**
 * Signed-in shell. Nothing here re-checks authentication — the root guard
 * already did that; this layout only decides what is a tab and what is not.
 *
 * The tab navigator is one screen in this stack, so anything pushed from a tab
 * (transfer, card detail, statement, scan result) covers the tab bar full-screen
 * and gets a real back gesture. Add such a screen as a file in this folder.
 *
 * A future PIN / biometric re-lock goes here too, as a sibling guard — the
 * routing does not need to change to accommodate it:
 *
 *   const { isLocked } = useAuth();
 *   <Stack.Protected guard={isLocked}><Stack.Screen name="lock" /></Stack.Protected>
 *   <Stack.Protected guard={!isLocked}><Stack.Screen name="(tabs)" /></Stack.Protected>
 *
 * The post-login sheets — the security interstitial and the biometric opt-in —
 * are rendered here rather than by Home, as a sibling of the navigator. The
 * floating tab bar is the tab navigator's `tabBar` — a sibling of the screen
 * container — so nothing rendered inside a tab screen can cover it, whatever
 * its `zIndex`. One level up, it can.
 */
import { Stack } from 'expo-router';
import { View } from 'react-native';

import { useAuth } from '@/auth/session';
import { BiometricOptInSheet } from '@/components/rightbank/BiometricOptInSheet';
import { SecurityWarningModal } from '@/components/rightbank/SecurityWarningModal';
import { useAppMode } from '@/theme/app-mode';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function AppLayout() {
  const { justSignedIn, clearJustSignedIn, askBiometric, clearAskBiometric } = useAuth();
  const { mode } = useAppMode();

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: '#000' },
        }}>
        <Stack.Screen name="(tabs)" />

        {/* The two account sheets. `transparentModal` leaves the tab behind
            them visible under their own scrim, and `animation: 'none'` hands
            the entrance to the sheet itself — it slides and fades with
            Reanimated, like every other sheet in the app, which a native
            presentation would either duplicate or fight. */}
        <Stack.Screen
          name="account-detail"
          options={{
            presentation: 'transparentModal',
            animation: 'none',
            // The stack paints screens black; a transparent modal must not,
            // or the tab it is supposed to be floating over disappears.
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen
          name="open-account"
          options={{
            presentation: 'transparentModal',
            animation: 'none',
            // The stack paints screens black; a transparent modal must not,
            // or the tab it is supposed to be floating over disappears.
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />

        {/* Notification — Figma `15804:47480`. An opaque full screen, not a
            sheet, so this gets the stack's own native modal presentation
            (a real card, not `transparentModal`) rather than the Reanimated
            slide the account sheets drive themselves. */}
        <Stack.Screen
          name="notifications"
          options={{
            presentation: 'modal',
            // The stack's own `screenOptions.animation: 'none'` is for the
            // sheets, which animate themselves; this screen has no such
            // animation of its own, so it needs the native modal transition
            // back.
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: '#FFFFFF' },
          }}
        />
      </Stack>

      {justSignedIn && <SecurityWarningModal mode={mode} onClose={clearJustSignedIn} />}

      {/* Second in the post-login sequence, not concurrent with the first: the
          security notice has to be gone before the offer is worth reading. The
          sheet decides for itself whether the offer applies at all. */}
      {!justSignedIn && askBiometric && (
        <BiometricOptInSheet mode={mode} onDone={clearAskBiometric} />
      )}
    </View>
  );
}
