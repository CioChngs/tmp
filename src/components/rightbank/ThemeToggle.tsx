import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Brand, welcomePalette, type Mode } from '@/constants/rightbank-theme';

/**
 * Light/dark mode pill toggle from the reference welcome header.
 * Track 62×32, knob 24×24, knob travels left↔right over 240ms.
 */

const TRACK_W = 62;
const TRACK_H = 32;
const KNOB = 24;
const PAD = 3;
const TRAVEL = TRACK_W - KNOB - PAD * 2; // 32

export function ThemeToggle({
  mode,
  onToggle,
}: {
  mode: Mode;
  onToggle: () => void;
}) {
  const p = welcomePalette[mode];
  const x = useSharedValue(mode === 'light' ? 1 : 0);

  useEffect(() => {
    x.value = withTiming(mode === 'light' ? 1 : 0, {
      duration: 240,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [mode, x]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: PAD + x.value * TRAVEL }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: mode === 'dark' }}
      accessibilityLabel={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      onPress={onToggle}
      hitSlop={10}
      style={({ pressed }) => ({
        width: TRACK_W,
        height: TRACK_H,
        borderRadius: 999,
        backgroundColor: p.toggleTrackBg,
        borderWidth: 1,
        borderColor: p.toggleTrackBorder,
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}>
      {/* dim icons behind the knob */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 9,
        }}>
        <Text style={{ fontSize: 11, opacity: mode === 'light' ? 0 : 0.55 }}>☀</Text>
        <Text style={{ fontSize: 11, opacity: mode === 'dark' ? 0 : 0.55 }}>☾</Text>
      </View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            top: PAD,
            left: 0,
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: 'rgba(147,166,194,0.9)',
            shadowOpacity: 0.5,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
          },
          knobStyle,
        ]}>
        <LinearGradient
          colors={Brand.knightKnobGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        <Text style={{ fontSize: 12 }}>{mode === 'light' ? '☀' : '☾'}</Text>
      </Animated.View>
    </Pressable>
  );
}
