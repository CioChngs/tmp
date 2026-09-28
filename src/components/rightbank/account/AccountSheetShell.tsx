/**
 * The chrome both account sheets share — Figma `15338:61406` and `16058:37255`.
 *
 * A `#F0F1F3` panel rising from the bottom edge with a 30 top radius, a grabber
 * at 12 and a 40-tall title row at 32. Below `children` it reserves the home
 * indicator's band, so a bottom-anchored control inside the sheet can measure
 * from the content's bottom and land where Figma drew it.
 *
 * ## Height
 *
 * Each frame states its own height against an iPhone 13 mini, whose bottom
 * inset is 34. A deeper inset grows the sheet by the difference rather than
 * pushing content into the navigation bar — the same `lift` the login screen
 * and `BiometricOptInSheet` use. The height is then capped at what is left
 * under the status bar, so a short screen scrolls the body instead of clipping
 * the title.
 *
 * ## Why it is not a native sheet
 *
 * `presentation: 'formSheet'` would bring its own radius, grabber and detents,
 * none of which are the ones drawn here, and the two frames differ in height by
 * 265. This reproduces the design and matches the app's other sheets, which are
 * built the same way.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { tintArt } from '@/components/rightbank/account/account-art';
import {
  SHEET_CHEVRON,
  SHEET_CLOSE,
} from '@/components/rightbank/account/account-sheet-art';
import {
  GipFont,
  accountSheet as s,
  type AccountSheetTokens,
  type Mode,
} from '@/constants/rightbank-theme';

/** How long the sheet takes to leave. The pop waits for it. */
const EXIT_MS = 200;

export function AccountSheetShell({
  mode,
  title,
  /** The frame's own height, home-indicator band included. */
  height,
  onClose,
  children,
}: {
  mode: Mode;
  title: string;
  height: number;
  /** Dismiss the route. Called once the sheet has finished sliding away. */
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t: AccountSheetTokens = s[mode];
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();

  const lift = Math.max(0, insets.bottom - s.referenceSafeBottom);
  const sheetHeight = Math.min(height + lift, window.height - insets.top);
  /** Figma's 34 band, grown to whatever the device actually reserves. */
  const band = s.referenceSafeBottom + lift;

  /**
   * Whether the sheet is on screen. It mounts off the bottom edge and rises on
   * the next frame, so the entrance plays on arrival; `close` puts it back and
   * the route pops once it has gone.
   *
   * Driven here rather than with Reanimated's `entering` / `exiting` layout
   * animations, because the exit has to finish *before* the route pops:
   * `router.back()` tears the tree down in the same frame, so an `exiting`
   * animation never gets to run and the sheet just vanishes.
   */
  const [open, setOpen] = useState(false);
  /** Guards the pop, which must happen once however many exits race. */
  const settled = useRef(false);

  // Off the synchronous path on purpose, so the first frame paints the sheet
  // at its closed position and the rise is something the eye can follow —
  // flipping this during the mount render would just start it already up.
  useEffect(() => {
    const id = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(id);
  }, []);

  const close = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    setOpen(false);
    // A timer, not the animation's completion callback. The two run for the
    // same 200 so they land together, but the timer fires whether or not the
    // animation ever ticks — and it does not tick while the app is in the
    // background, which with a callback would leave a sheet that had been
    // asked to close still sitting there on return. Dismissal is unconditional.
    setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  const motion = open
    ? { duration: 260, easing: Easing.out(Easing.cubic) }
    : { duration: EXIT_MS, easing: Easing.in(Easing.cubic) };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(open ? 0 : sheetHeight, motion) }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: withTiming(open ? 1 : 0, motion) }));

  // The Android back button is the third way out and has to animate like the
  // other two, so it is intercepted rather than left to pop the route itself.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.scrim }, scrimStyle]}>
        {/* Tapping the dimmed screen behind the sheet closes it, as the close
            button does. The grabber says the same thing; a real drag gesture
            is not implemented here and is not in the design. */}
        <Pressable accessible={false} onPress={close} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { backgroundColor: t.page, height: sheetHeight }, sheetStyle]}>
        <View style={[styles.grabber, { backgroundColor: t.grabber }]} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: t.ink }]} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close"
            testID="account_sheet_close_button"
            // The 24 glyph box is a small target for a dismiss control, so the
            // touch area is widened to 44 without moving the art.
            hitSlop={10}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
            <SvgXml
              xml={tintArt(SHEET_CLOSE, '#5C5C5C', t.secondary)}
              width={s.closeArt}
              height={s.closeArt}
            />
          </Pressable>
        </View>

        <View style={[styles.body, { paddingBottom: band }]}>{children}</View>
      </Animated.View>
    </View>
  );
}

/**
 * The section label both frames call "Navigation Bar" — a 44-tall band with
 * left-aligned 14/24 text and nothing else in it. The search and notification
 * icons the component ships with are hidden in both frames.
 */
export function SheetSectionHeader({ t, children }: { t: AccountSheetTokens; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: t.ink }]}>{children}</Text>
    </View>
  );
}

/** `Use icon / Right` — 5.5 × 9.5 of art centred in a 24 box. */
export function SheetChevron({ color }: { color: string }) {
  return (
    <View style={styles.chevron}>
      <SvgXml
        xml={tintArt(SHEET_CHEVRON, 'black', color)}
        width={s.chevronArt.width}
        height={s.chevronArt.height}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: s.radius,
    borderTopRightRadius: s.radius,
    overflow: 'hidden',
  },
  grabber: {
    position: 'absolute',
    alignSelf: 'center',
    top: s.grabberTop,
    width: s.grabberWidth,
    height: s.grabberHeight,
    borderRadius: s.grabberHeight,
  },
  header: {
    marginTop: s.headerTop,
    marginHorizontal: s.gutter,
    height: s.headerHeight,
    justifyContent: 'center',
  },
  title: {
    fontFamily: GipFont.extrabold,
    fontSize: s.titleSize,
    lineHeight: s.titleLine,
  },
  close: {
    position: 'absolute',
    right: 0,
    width: s.closeBox,
    height: s.closeBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  /** Everything under the title row, above the home-indicator band. */
  body: { flex: 1 },

  section: {
    height: s.sectionHeight,
    justifyContent: 'center',
    paddingHorizontal: s.gutter,
  },
  sectionLabel: {
    fontFamily: GipFont.bold,
    fontSize: s.sectionSize,
    lineHeight: s.sectionLine,
  },
  chevron: {
    width: s.chevronBox,
    height: s.chevronBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
