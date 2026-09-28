/**
 * The four tabs. A real tab navigator, not four stack pushes: each tab keeps
 * its own mounted state (Card's revealed PAN, Account's sub-tab, scroll
 * position), and switching tabs cannot grow the stack.
 *
 * The reference's floating pill bar is the navigator's `tabBar`, so it mounts
 * once here and receives the live navigation state. Screens render only their
 * own content — none of them knows the bar exists.
 *
 * `lazy` is React Navigation's default: a tab mounts on first visit and stays
 * mounted, which is what preserves its state. `animation: 'none'` keeps the
 * instant tab switch the reference has.
 */
import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/rightbank/home/FloatingTabBar';

export const unstable_settings = {
  anchor: 'home',
};

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'none',
        sceneStyle: { backgroundColor: '#000' },
      }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="account" />
      <Tabs.Screen name="card" />
      <Tabs.Screen name="more" />

      {/* The QR scanner is a tab with no item in the bar: the design keeps the
          floating bar on screen while scanning, which only a sibling tab can do
          — a screen pushed over the navigator would cover it. The raised scan
          button is its only entry point. See `scan.tsx`. */}
      <Tabs.Screen name="scan" />

      {/* Its other half, reached only from the segmented control the two share.
          A tab for the same reason, and because switching between them should
          not grow a stack. See `my-qr.tsx`. */}
      <Tabs.Screen name="my-qr" />
    </Tabs>
  );
}
