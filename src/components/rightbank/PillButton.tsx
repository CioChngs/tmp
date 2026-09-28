import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import { Brand, Font, welcomePalette, type Mode } from '@/constants/rightbank-theme';

/**
 * Rounded full-width action button from the reference welcome screen.
 * `primary` = ember gradient fill; `outline` = translucent "Join" button.
 * Both carry the reference's `ringPulse` halo.
 */

function RingPulse({
  delay = 0,
  color,
  borderWidth = 0,
}: {
  delay?: number;
  color: string;
  borderWidth?: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    // ringPulseK: scale 1 -> 1.09, opacity 0.5 -> 0 (holds), 2.4s loop
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1),
    );
  }, [t, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.75 ? 0.5 * (1 - t.value / 0.75) : 0,
    transform: [{ scale: 1 + Math.min(t.value, 0.75) * (0.09 / 0.75) }],
  }));

  return (
    <Animated.View
      style={[
        {
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 999,
          backgroundColor: borderWidth ? 'transparent' : color,
          borderWidth,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
  mode: Mode;
  style?: StyleProp<ViewStyle>;
};

export function PillButton({ label, onPress, variant = 'primary', mode, style }: Props) {
  const p = welcomePalette[mode];
  const isPrimary = variant === 'primary';

  return (
    <View style={[{ position: 'relative' }, isPrimary && styles.primaryDrop, style]}>
      {/* reference login button carries TWO shadows (ember glow + dark drop);
          RN allows one per view, so the glow lives on this inner wrapper and the
          dark drop on the outer one. */}
      <View style={isPrimary && styles.primaryGlow}>
        <RingPulse
          color={Brand.emberSolid}
          borderWidth={isPrimary ? 0 : 1.5}
          delay={isPrimary ? 0 : 1200}
        />
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          testID={`auth_${label.toLowerCase().replace(/\s+/g, '_')}_button`}
          style={({ pressed }) => [
            styles.base,
            isPrimary
              ? styles.primary
              : {
                  backgroundColor: p.outlineBtnBg,
                  borderColor: p.outlineBtnBorder,
                  borderWidth: 1.5,
                },
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}>
          {isPrimary && (
            <LinearGradient
              colors={Brand.emberGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <Text
            style={[
              styles.label,
              isPrimary
                ? { color: Brand.onEmber, fontSize: 15.5 }
                : { color: p.outlineBtnText, fontSize: 15 },
            ]}>
            {label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primary: {
    paddingVertical: 17,
  },
  // reference: box-shadow: 0 0 22 rgba(255,107,61,.4), 0 8 22 rgba(0,0,0,.28).
  // RN allows one shadow per view — dark drop on the outer wrapper …
  primaryDrop: {
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  // … ember glow halo on the inner wrapper (reference α .4).
  primaryGlow: {
    borderRadius: 999,
    shadowColor: Brand.emberSolid,
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    // family carries the weight; an explicit fontWeight double-bolds on Android
    fontFamily: Font.bold,
  },
});
