import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';

/**
 * Reference toggle switch (used on Card ▸ Freeze card, Payment controls).
 * Track 48×28, radius 999; knob 22×22 white circle, inset 3, sliding
 * left 3 (off) ↔ 23 (on) over 200ms `cubic-bezier(.22,1,.36,1)`; knob shadow
 * `0 2px 6px rgba(0,0,0,.35)`. Off track = `rgba(16,24,40,.17)`; on track =
 * `linear-gradient(135deg,#5E6E88,#9DB0CB)` (light) — dark measured token.
 */
export function Switch({
  value,
  onValueChange,
  offTrack = 'rgba(16,24,40,0.17)',
  testID,
}: {
  value: boolean;
  onValueChange?: (v: boolean) => void;
  offTrack?: string;
  testID?: string;
}) {
  const [anim] = useState(() => new Animated.Value(value ? 1 : 0));
  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 200,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  return (
    <Pressable
      onPress={() => onValueChange?.(!value)}
      hitSlop={4}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      testID={testID}>
      <Animated.View style={[styles.track, { backgroundColor: value ? undefined : offTrack }]}>
        {value ? (
          <LinearGradient
            colors={['#5E6E88', '#9DB0CB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <Animated.View
          style={[
            styles.knob,
            { left: anim.interpolate({ inputRange: [0, 1], outputRange: [3, 23] }) },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 999,
    overflow: 'hidden',
  },
  knob: {
    position: 'absolute',
    top: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
