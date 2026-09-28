/**
 * "Notification" — Figma `15804:47480`. Opened from Home's bell button
 * (`GreetingHeader`'s `onNotifications`), as a real native modal: the frame
 * draws its own status bar and covers the tab bar, rather than floating a
 * sheet over it the way the account screens do.
 *
 * The three warm blurs behind the list — two corner patches and one large
 * ambient glow — are the exact rig `LoginBackground` already draws: same
 * colours (`loginPalette.cornerGlow`/`ambientGlow`), same σ, same peak, and
 * (once each box's centre is worked out) the same position. Figma just reused
 * its own light source here rather than drawing a new one, so the code does
 * too instead of re-deriving a `GaussianBlob` call that would land in the same
 * place.
 */
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GaussianBlob } from '@/components/rightbank/GaussianBlob';
import { FigmaIcon } from '@/components/rightbank/home/figma-assets';
import {
  ARROW_LEFT,
  BELL_FILLED,
  BELL_OUTLINE,
} from '@/components/rightbank/notifications/notification-art';
import {
  notificationsCopy as copy,
  GipFont,
  notificationsLayout as l,
  loginPalette,
  notificationsPalette as t,
} from '@/constants/rightbank-theme';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: t.page }]}>
      <GaussianBlob color={loginPalette.cornerGlow} peak={0.228} sigma={137} style={{ left: 15.5, top: 32 }} />
      <GaussianBlob color={loginPalette.cornerGlow} peak={0.242} sigma={137} style={{ right: 27.5, top: 32 }} />
      <GaussianBlob color={loginPalette.ambientGlow} peak={0.019} sigma={364} style={{ left: 2.3, top: 11.7 }} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: l.gutter,
          paddingTop: insets.top + l.navHeight + l.listTop,
          paddingBottom: insets.bottom + l.listTop,
          gap: l.cardGap,
        }}>
        {copy.items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              {
                borderColor: t.border,
                backgroundColor: t.surface,
                boxShadow: t.cardShadow,
                opacity: item.unread ? 1 : l.readOpacity,
              },
            ]}>
            <View style={[styles.cardHeadRow, { gap: l.iconGap }]}>
              <FigmaIcon
                xml={item.unread ? BELL_FILLED : BELL_OUTLINE}
                box={l.iconBox}
                w={l.bellArt.width}
                h={l.bellArt.height}
              />
              <Text
                style={[styles.cardTitle, { color: t.ink, fontSize: l.titleTextSize, lineHeight: l.titleTextLine }]}
                numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <Text
              style={[
                styles.cardBody,
                {
                  color: t[item.tone],
                  marginTop: l.bodyGap,
                  marginLeft: l.iconBox + l.iconGap,
                  fontSize: l.bodyTextSize,
                  lineHeight: l.bodyTextLine,
                },
              ]}>
              {item.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Painted after the `ScrollView` on purpose: that view fills the whole
          screen (the nav bar is `position: absolute` and takes no flow space),
          so declaring it first would have it stack underneath the scroll
          content and swallow the back button's taps despite nothing being
          drawn over it. */}
      <View style={[styles.nav, { top: insets.top, height: l.navHeight }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          testID="notifications_back_button"
          hitSlop={4}
          style={({ pressed }) => [
            styles.back,
            { width: l.backBox, height: l.backBox },
            pressed && styles.pressed,
          ]}>
          <FigmaIcon xml={ARROW_LEFT} box={l.backIconBox} w={l.backArt.width} h={l.backArt.height} />
        </Pressable>
        <Text style={[styles.title, { color: t.ink }]}>{copy.title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  back: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  title: { fontFamily: GipFont.bold, fontSize: 16, lineHeight: 24 },
  card: { borderRadius: 20, borderWidth: 1, paddingTop: 11, paddingHorizontal: 11, paddingBottom: 12 },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { flex: 1, fontFamily: GipFont.semibold },
  cardBody: { fontFamily: GipFont.medium },
});
