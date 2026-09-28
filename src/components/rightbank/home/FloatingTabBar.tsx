import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ScanGlyph, TabGlyph, type TabGlyphName } from '@/components/rightbank/home/TabIcons';
import {
    figmaTabBar as b,
    cssGradientAngle,
    figmaScan,
    Font,
} from '@/constants/rightbank-theme';

/**
 * The floating tab bar — Figma `Component 602`: a 343×70 white bar with the
 * scan button raised out of its top edge, sitting 6 above the home indicator.
 *
 * This is the tab navigator's own bar, mounted once by `(app)/(tabs)/_layout.tsx`
 * and handed the live navigation state — not a decoration re-rendered per screen.
 * `TabKey` therefore has to match the route file names under `(tabs)/`.
 *
 * The wrapper is absolutely positioned, so as a flex child of the tab view it
 * takes no space: the scenes keep the full screen height and each one pads its
 * own scroll content clear of the bar.
 *
 * What the redesign changed, all of it: the dark glass pill at 362×76 radius 22
 * became a white 343×70 at radius 27, its 1.5px border became four stacked
 * shadows, the labels grew from 10 to 12 and the icons from the prototype's blue
 * illustrations to the design system's duotone 24s. The selected tab is now
 * marked by the brand gradient running through its icon *and* its label rather
 * than by a filled slot. The FAB grew a 1px gradient halo and a wide gradient
 * glow, lost its 3px white ring, and lost the float and pulse animations it had
 * — neither is in the design.
 *
 * The four item centres are Figma's own and are held as fractions of the bar,
 * not as four equal flex slots: they are symmetric about the scan button but not
 * evenly spread, so equal slots walk the outer two ~6 inwards.
 *
 * Over the QR scanner the bar switches to `Component 604`, the same geometry on
 * a translucent white surface over a backdrop blur, with every glyph and label
 * white. That variant is chosen from the navigation state rather than passed in:
 * the scanner is a tab, so the bar already knows when it is the one on screen.
 */

/** Derived from the public `Tabs` type so it tracks whatever version is installed. */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type TabKey = TabGlyphName;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'account', label: 'Account' },
  { key: 'card', label: 'Card' },
  { key: 'more', label: 'More' },
];

/** The scanner's route name under `(tabs)`. It has no item in the bar. */
const SCAN_ROUTE = 'scan';

export function FloatingTabBar({ state, navigation, insets }: TabBarProps) {
  const { width } = useWindowDimensions();
  const barWidth = width - b.gutter * 2;

  const current = state.routes[state.index]?.name;
  const active = current as TabKey | undefined;
  const glass = current === SCAN_ROUTE;

  /**
   * The `tabPress` round-trip is what makes this behave like a tab bar rather
   * than a row of links: it lets a screen intercept a press on its own tab
   * (scroll-to-top, closing a sheet) and it keeps a re-press from re-navigating.
   */
  const goTo = (key: TabKey | typeof SCAN_ROUTE) => {
    const route = state.routes.find((r) => r.name === key);
    if (!route) return;

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (route.key !== state.routes[state.index]?.key && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        // Figma's board leaves 40 under the bar against a 34 home indicator.
        // The floor is for a device with no inset, where 6 alone would have the
        // bar sitting on the screen edge.
        { bottom: Math.max(insets.bottom, 12) + b.bottomGap },
      ]}
      accessibilityRole="tablist">
      <View style={[styles.bar, !glass && styles.barSolid]}>
        {/* `Component 604`'s surface, in place of the opaque `#FCFCFC`: Figma's
            two layers kept as two layers — a backdrop blur, then the 14 % white
            wash over it. The wash is its own view rather than a background on
            the `BlurView`, which paints its tint into that same slot and would
            simply win.

            Both are clipped separately from the bar because the glow and the
            raised button hang outside these 70 rows and must not be clipped
            with them.

            iOS blurs whatever is behind the bar, camera preview included.
            Android's blur snapshots the view hierarchy, which a camera surface
            is not part of, so there it degrades to the wash alone. */}
        {glass && (
          <>
            <BlurView
              intensity={figmaScan.bar.blurIntensity}
              tint="dark"
              blurMethod="dimezisBlurView"
              style={styles.barBlur}
              pointerEvents="none"
            />
            <View style={styles.barWash} pointerEvents="none" />
          </>
        )}

        {/* `Ellipse 3871` — the scan button's glow, painted straight after the
            bar's own surface and so *under* the four tabs: it washes over the
            white and tints the nearest label rather than sitting on top of it.
            Baked, because a blurred gradient disc is static art and
            react-native-svg's filters are the kind of thing that works on one
            platform and not the other. */}
        <Image
          source={require('@/assets/tabbar/fab-glow.png')}
          style={styles.fabGlow}
        />

        {TABS.map((t, i) => (
          <Item
            key={t.key}
            tab={t}
            active={t.key === active}
            tint={glass ? figmaScan.bar.ink : undefined}
            centre={b.itemCentres[i] * barWidth}
            onPress={() => goTo(t.key)}
          />
        ))}

        {/* `Ellipse 1454` — the same disc 1 larger in the brand gradient,
            blurred by 0.5. At that radius it is a hairline halo, so it is drawn
            as a ring and the blur is dropped. */}
        <View style={styles.fabSlot}>
          <LinearGradient
            colors={b.active}
            locations={b.activeStops}
            {...cssGradientAngle(b.activeAngle, b.fabRing, b.fabRing)}
            style={styles.fabRing}
          />
          <Pressable
            onPress={() => goTo(SCAN_ROUTE)}
            accessibilityRole="button"
            accessibilityLabel="Scan"
            testID="navigation_scan_tab"
            accessibilityState={{ selected: glass }}
            style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.94 }] }]}>
            {/* `Ellipse 1453`: from (0, 26) to (47.69, 40.34) of its 52 box —
                not an angle, so it goes in as the fractions it already is. */}
            <LinearGradient
              colors={b.fabFill}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 47.69 / b.fab, y: 40.3368 / b.fab }}
              style={StyleSheet.absoluteFill}
            />
            <ScanGlyph />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * One tab: a 24 glyph over a 12 label, centred on Figma's own x for that slot.
 *
 * The box is a fixed 64 rather than measured, so the two texts and the icon
 * centre on the same axis whatever the label's width; "Account", the longest,
 * is 44 at 12px.
 */
function Item({
  tab,
  active,
  tint,
  centre,
  onPress,
}: {
  tab: { key: TabKey; label: string };
  active: boolean;
  /** Set only by `Component 604`, which draws the unselected items white. */
  tint?: string;
  centre: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={tab.label}
      testID={`navigation_${tab.key}_tab`}
      style={({ pressed }) => [
        styles.item,
        { left: centre - b.item.width / 2 },
        pressed && { opacity: 0.6 },
      ]}>
      <TabGlyph name={tab.key} active={active} tint={tint} />
      {active ? (
        <ActiveLabel label={tab.label} />
      ) : (
        <Text style={[styles.label, tint ? { color: tint } : null]}>{tab.label}</Text>
      )}
    </Pressable>
  );
}

/**
 * The selected tab's label, with `linear-gradient(22.99deg, …)` running through
 * the glyphs themselves — `background-clip: text` in the design.
 *
 * React Native cannot fill text with a gradient, so the text becomes a mask: an
 * invisible copy of it sizes the view, and the gradient is clipped to the shape
 * of the visible one. Sizing it from the text rather than from the 64 box is
 * what keeps the gradient's run the length Figma gives it.
 *
 * The mask is drawn in the gradient's own mid colour, which the mask itself has
 * no use for — iOS and Android take its alpha and ignore its colour. It is there
 * for react-native-web, where `MaskedView` is a no-op that renders the mask
 * element and drops the children: the label then comes out in the one colour
 * closest to the run it stands in for, rather than in the inactive grey.
 */
function ActiveLabel({ label }: { label: string }) {
  return (
    <MaskedView maskElement={<Text style={[styles.label, styles.activeInk]}>{label}</Text>}>
      <Text style={[styles.label, styles.hidden]}>{label}</Text>
      <LinearGradient
        colors={b.active}
        locations={b.activeStops}
        {...cssGradientAngle(b.activeAngle, 33, b.item.labelLine)}
        style={StyleSheet.absoluteFill}
      />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: b.gutter, right: b.gutter },
  bar: {
    height: b.height,
    borderRadius: b.radius,
    boxShadow: b.shadow,
  },
  barSolid: { backgroundColor: b.surface },
  barBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: b.radius,
    overflow: 'hidden',
  },
  barWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: b.radius,
    backgroundColor: figmaScan.bar.surface,
  },
  item: {
    position: 'absolute',
    top: b.item.top,
    width: b.item.width,
    alignItems: 'center',
    paddingTop: b.item.iconTop,
    gap: b.item.gap,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: b.item.labelSize,
    lineHeight: b.item.labelLine,
    color: b.inactive,
    textAlign: 'center',
  },
  hidden: { opacity: 0 },
  /** `#ED1846` → `#FFCC32` at its midpoint. See `ActiveLabel`. */
  activeInk: { color: '#F6723C' },
  /**
   * Centred on the button, not on the bar: the disc's centre is 5 above the
   * bar's top edge, so a 104 box around it starts 47 above that edge.
   */
  fabGlow: {
    position: 'absolute',
    top: -b.fabOverhang + (b.fab - b.fabGlow) / 2,
    left: '50%',
    marginLeft: -b.fabGlow / 2,
    width: b.fabGlow,
    height: b.fabGlow,
    pointerEvents: 'none',
  },
  // The button's centre sits 5 above the bar's top edge: 12 down a 103-tall
  // box whose bottom 70 is the bar.
  fabSlot: {
    position: 'absolute',
    top: -b.fabOverhang,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fabRing: {
    position: 'absolute',
    top: -1,
    width: b.fabRing,
    height: b.fabRing,
    borderRadius: b.fabRing / 2,
  },
  fab: {
    width: b.fab,
    height: b.fab,
    borderRadius: b.fab / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
