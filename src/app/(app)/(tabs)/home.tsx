import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { peekRememberedUser } from '@/auth/remembered-user';
import { HomeHero } from '@/components/rightbank/home/HomeHero';
import { PromoCarousel } from '@/components/rightbank/home/PromoCarousel';
import { QuickActionGrid } from '@/components/rightbank/home/QuickActionGrid';
import { RecentActivity } from '@/components/rightbank/home/RecentActivity';
import { SendAgainRail } from '@/components/rightbank/home/SendAgainRail';
import { figmaHome } from '@/constants/rightbank-theme';
import { useAppMode } from '@/theme/app-mode';

/**
 * Tab 1 — Home. Figma `15314:40225` (dark) / `15324:56122` (light).
 *
 * The screen is a blue header with the page hanging off its bottom edge, and it
 * scrolls as one: the header scrolls away with the content rather than pinning,
 * which is what the frame's single 812-tall composition describes. The floating
 * tab bar it sits under belongs to the tabs layout, not to this screen.
 *
 * Section order follows the light frame — actions, promos, payees, activity. The
 * two frames disagree here (the dark board leads with the promo rail), and
 * nothing else about them differs structurally, so this reads as the designer
 * having moved one section on one board rather than a light/dark rule. One order
 * is used in both modes; see migration-progress.md §24.
 *
 * Spacing is the frame's: 16 below the header, then 16 between the actions and
 * the rail, 16 to "Send again", and 20 to "Recent activity" (Figma stacks the
 * last two inside one 460-tall group at that gap).
 */

const SIDE = 16;

export default function HomeScreen() {
  const { mode, toggleMode } = useAppMode();
  const insets = useSafeAreaInsets();
  const t = figmaHome[mode];
  const remembered = peekRememberedUser();

  return (
    <View style={[styles.root, { backgroundColor: t.page }]}>
      {/* The header is blue in both modes, so the status bar is always light —
          it never sits on the page colour. */}
      <StatusBar style="light" animated />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 104 }}>
        <HomeHero
          name={remembered?.displayName ?? remembered?.username ?? 'Temuulen'}
          balance="515,845,000"
          account={{ prefix: 'MN65 0032 00', number: '5000610569' }}
          insetTop={insets.top}
          onToggleMode={toggleMode}
          onNotifications={() => router.push('/notifications')}
        />

        <View style={[styles.pad, { marginTop: 16 }]}>
          <QuickActionGrid />
        </View>

        {/* Full-bleed: the rail re-adds the side inset itself so cards can reach
            the screen edge. */}
        <View style={{ marginTop: 16 }}>
          <PromoCarousel mode={mode} />
        </View>

        <View style={[styles.pad, { marginTop: 16 }]}>
          <SendAgainRail mode={mode} />
        </View>

        <View style={[styles.pad, { marginTop: 20 }]}>
          <RecentActivity mode={mode} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: SIDE },
});
