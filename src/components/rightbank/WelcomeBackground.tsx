import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { welcomePalette, type Mode } from '@/constants/rightbank-theme';

/**
 * Full-bleed welcome background: radial gradient wash + two soft ambient blobs +
 * a faint twinkling starfield. Mirrors the reference's particle layer
 * (`radial-gradient(120% 90% at 50% 6%, …)` + `.twinkle` dots).
 */

const STAR_COUNT = 60;

/**
 * react-native-svg on Android does not dither gradients, so a 4-stop ramp shows
 * visible contour bands. Densify: linearly interpolate the anchor colours into
 * ~4 sub-steps per segment for a smooth result.
 */
function hexToRgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerpHex(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
function densify(colors: string[], offsets: number[], perSeg = 4) {
  const out: { offset: number; color: string }[] = [];
  for (let i = 0; i < colors.length - 1; i++) {
    const steps = i === colors.length - 2 ? perSeg : perSeg;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push({
        offset: offsets[i] + (offsets[i + 1] - offsets[i]) * t,
        color: lerpHex(colors[i], colors[i + 1], t),
      });
    }
  }
  out.push({ offset: offsets[offsets.length - 1], color: colors[colors.length - 1] });
  return out;
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type StarSpec = {
  left: number;
  top: number;
  size: number;
  color: string;
  baseOpacity: number;
  duration: number;
  delay: number;
};

function Star({ spec }: { spec: StarSpec }) {
  const t = useSharedValue(0);
  // twinkleK: opacity 0.12 -> 0.85, scale 1 -> 1.4
  useEffect(() => {
    t.value = withDelay(
      spec.delay,
      withRepeat(withTiming(1, { duration: spec.duration }), -1, true),
    );
  }, [t, spec.delay, spec.duration]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.12 + t.value * (spec.baseOpacity - 0.12),
    transform: [{ scale: 1 + t.value * 0.4 }],
  }));

  return (
    <Animated.View
      style={[
        {
          pointerEvents: 'none',
          position: 'absolute',
          left: spec.left,
          top: spec.top,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
}

/** Diagonal streak that periodically shoots across the screen (`shootK`). */
function ShootingStar({
  startTop,
  startLeft,
  color,
  opacity,
  delay,
}: {
  startTop: number;
  startLeft: number;
  color: string;
  opacity: number;
  delay: number;
}) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 7500, easing: Easing.inOut(Easing.ease) }), -1),
    );
  }, [prog, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.08, 0.55, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: prog.value * 440 },
      { translateY: prog.value * 180 },
      { rotate: '22deg' },
    ],
  }));

  return (
    <Animated.View
      style={[
        { pointerEvents: 'none', position: 'absolute', top: startTop, left: startLeft, width: 64, height: 1.5 },
        style,
      ]}>
      <LinearGradient
        colors={['transparent', color]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1, borderRadius: 2, opacity }}
      />
    </Animated.View>
  );
}

export function WelcomeBackground({ mode }: { mode: Mode }) {
  const { width, height } = useWindowDimensions();
  const p = welcomePalette[mode];

  const stars = useMemo<StarSpec[]>(() => {
    const rand = seededRandom(mode === 'light' ? 1337 : 4242);
    return Array.from({ length: STAR_COUNT }, () => {
      const size = 1 + rand() * 1.6;
      return {
        left: rand() * width,
        top: rand() * height * 0.92,
        size,
        color: p.starColors[Math.floor(rand() * p.starColors.length)],
        baseOpacity: p.starOpacity * (0.45 + rand() * 0.55),
        duration: 2400 + rand() * 1800,
        delay: rand() * 2600,
      };
    });
  }, [mode, width, height, p]);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="rbWelcomeBg" cx="50%" cy="6%" rx="120%" ry="90%">
            {densify(p.bgGradient, p.bgGradientStops).map((s, i) => (
              <Stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={1} />
            ))}
          </RadialGradient>
          <RadialGradient id="rbWashCool" cx="50%" cy="50%" rx="50%" ry="50%">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((o) => (
              <Stop
                key={o}
                offset={o}
                stopColor={p.washCool}
                stopOpacity={p.washCoolOpacity * (1 - o) ** 2}
              />
            ))}
          </RadialGradient>
          <RadialGradient id="rbWashWarm" cx="50%" cy="50%" rx="50%" ry="50%">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((o) => (
              <Stop
                key={o}
                offset={o}
                stopColor={p.washWarm}
                stopOpacity={p.washWarmOpacity * (1 - o) ** 2}
              />
            ))}
          </RadialGradient>
        </Defs>

        <Rect x={0} y={0} width={width} height={height} fill="url(#rbWelcomeBg)" />
        {/* very soft ambient haze — large, mostly off-canvas so only a faint edge shows */}
        <Rect
          x={width * 0.5 - width * 0.75}
          y={-height * 0.22}
          width={width * 1.5}
          height={height * 0.6}
          fill="url(#rbWashCool)"
        />
        <Rect
          x={width * 0.5 - width * 0.35}
          y={height * 0.1}
          width={width * 1.4}
          height={height * 0.55}
          fill="url(#rbWashWarm)"
        />
      </Svg>

      {stars.map((spec, i) => (
        <Star key={i} spec={spec} />
      ))}

      <ShootingStar
        startTop={height * 0.14}
        startLeft={-width * 0.1}
        color={p.streak}
        opacity={p.streakOpacity}
        delay={2000}
      />
      <ShootingStar
        startTop={height * 0.58}
        startLeft={-width * 0.1}
        color={p.streak}
        opacity={p.streakOpacity}
        delay={5500}
      />
    </View>
  );
}
