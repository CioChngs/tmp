/**
 * The Accounts sub-tab control — Figma `14765:55205`.
 *
 * A 343 × 52 white track at radius 18 floating on the page under three
 * brand-tinted shadows, with four pills inset 8 and 8 apart; the selected one
 * carries the brand gradient at radius 14 and white ink, the rest are bare
 * `textcolorblack/tertiary` labels on the track itself.
 *
 * This replaces the prototype's 354 × 44 grey-track control wholesale. The four
 * pills are equal flex children rather than Figma's literal 76/76/76/75, which
 * is that width shared out: on a screen wider than the 375 board fixed widths
 * would leave the track ragged.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
    figmaAccounts as a,
    cssGradientAngle,
    GipFont,
    type Mode,
} from '@/constants/rightbank-theme';

const g = a.segment;

export function SegmentedTabs<T extends string>({
  mode,
  options,
  active,
  onChange,
}: {
  mode: Mode;
  options: readonly { key: T; label: string }[];
  active: T;
  onChange: (k: T) => void;
}) {
  const t = a[mode];

  return (
    <View style={[styles.track, { backgroundColor: t.surface }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === active;
        return (
          <Pressable
            key={o.key}
            onPress={on ? undefined : () => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            testID={`account_tab_${o.key}`}
            style={({ pressed }) => [styles.pill, pressed && !on && styles.pressed]}>
            {on && (
              <LinearGradient
                colors={g.active}
                locations={g.activeStops}
                {...cssGradientAngle(g.activeAngle, 76, g.pillHeight)}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text
              style={[styles.label, on ? styles.labelOn : { color: t.tertiary }]}
              numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: g.height,
    borderRadius: g.radius,
    padding: g.pad,
    gap: g.gap,
    boxShadow: g.shadow,
  },
  pill: {
    flex: 1,
    height: g.pillHeight,
    borderRadius: g.pillRadius,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  label: {
    fontFamily: GipFont.medium,
    fontSize: g.labelSize,
    textAlign: 'center',
  },
  labelOn: { fontFamily: GipFont.semibold, color: g.activeInk },
});
