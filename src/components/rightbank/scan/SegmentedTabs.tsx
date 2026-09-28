/**
 * The QR pair's segmented control — Figma `14656:64070` over the camera and
 * `14656:64131` on the light page.
 *
 * Two 165 × 38 pills at radius 35, 13 apart, one of them carrying the brand
 * gradient. It lives here rather than on either screen because both screens
 * draw it and each one is the other's destination: a copy on each would be two
 * copies to keep in step.
 *
 * Only the unselected pill changes between them. Over the camera it is a 10 %
 * white wash with white ink; on the page it is a `#EDF0FD` hairline with
 * `#96A5BA` ink, and nothing behind it.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
    figmaTabBar as b,
    cssGradientAngle,
    figmaMyQr,
    Font,
    figmaScan as s,
} from '@/constants/rightbank-theme';

const g = s.segment;

export type SegmentKey = 'scan' | 'my-qr';

export function SegmentedTabs({
  active,
  variant,
  onSelect,
  top,
}: {
  active: SegmentKey;
  /** `dark` is the over-camera pill, `light` the one on the page. */
  variant: 'dark' | 'light';
  onSelect: (key: SegmentKey) => void;
  top: number;
}) {
  return (
    <View style={[styles.row, { top }]}>
      <Pill
        label="QR Унших"
        on={active === 'scan'}
        variant={variant}
        onPress={() => onSelect('scan')}
      />
      <Pill
        label="Миний QR"
        on={active === 'my-qr'}
        variant={variant}
        onPress={() => onSelect('my-qr')}
      />
    </View>
  );
}

function Pill({
  label,
  on,
  variant,
  onPress,
}: {
  label: string;
  on: boolean;
  variant: 'dark' | 'light';
  onPress: () => void;
}) {
  const light = variant === 'light';

  return (
    <Pressable
      onPress={on ? undefined : onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      testID={`qr_${label === 'QR Унших' ? 'scan' : 'my_qr'}_tab`}
      style={({ pressed }) => [
        styles.pill,
        !on && (light ? styles.offLight : styles.offDark),
        pressed && !on && styles.pressed,
      ]}>
      {on && (
        <LinearGradient
          colors={g.active}
          locations={g.activeStops}
          {...cssGradientAngle(g.activeAngle, g.width, g.height)}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text
        style={[
          styles.label,
          on ? styles.labelOn : light ? styles.labelOffLight : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    // 16 each side and 13 between gives Figma's two 165 pills at 375 exactly,
    // and keeps them on a narrower screen, which fixed widths would not.
    paddingHorizontal: b.gutter,
    gap: g.gap,
  },
  pill: {
    flex: 1,
    maxWidth: g.width,
    height: g.height,
    borderRadius: g.radius,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offDark: { backgroundColor: g.inactive },
  offLight: { borderWidth: 1, borderColor: figmaMyQr.segment.border },
  pressed: { opacity: 0.6 },
  label: {
    fontFamily: Font.semibold,
    fontSize: g.labelSize,
    lineHeight: g.labelLine,
    color: g.ink,
    textAlign: 'center',
  },
  labelOn: { fontFamily: Font.bold, color: g.ink },
  labelOffLight: { color: figmaMyQr.segment.ink },
});
