import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  FeComposite,
  FeFlood,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
  Filter,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { Brand, Font } from '@/constants/rightbank-theme';

/**
 * RightBank brand mark — a glowing ember "X" with a pulsing halo, six flickering
 * spark bolts and two orbiting embers. Ports the reference emblem
 * (`.logoGlow`, `.flick`, `.orbit1/2`, `.xLive`) inside a 232×232 box.
 */

const BOX = 232;
const BOLT = 'M13 2 6 13h5l-2 9 9-12h-5l3-8z';

/** Dense, quadratic-falloff stop list — avoids contour banding (RN-svg on
 * Android does not dither) and gives a soft, gradual glow edge. */
function smoothStops(color: string, peak: number) {
  return [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((offset) => ({
    offset,
    color,
    opacity: +(peak * (1 - offset) ** 2).toFixed(4),
  }));
}

// (top, left, size, rotationDeg, colorIndex, durationMs, delayMs) — for the 232 box
const SPARKS: [number, number, number, number, number, number, number][] = [
  [6, 122, 19, 14, 0, 2700, 0],
  [52, 206, 15, 78, 1, 3300, 800],
  [150, 208, 17, 148, 2, 2900, 1600],
  [196, 112, 14, 195, 0, 3600, 400],
  [148, 6, 18, 262, 1, 3100, 1200],
  [50, 12, 13, 322, 2, 2500, 2000],
];

/**
 * Soft radial glow. Colours and alphas are kept separate: an `rgba()` string in
 * `stopColor` has its alpha ignored on Android react-native-svg (renders opaque),
 * which is what turned the halo into a solid disc — always use `stopOpacity`.
 */
function RadialGlow({
  glowId,
  style,
  stops,
}: {
  glowId: string;
  style: object;
  stops: { offset: number; color: string; opacity: number }[];
}) {
  return (
    <View style={[style, { pointerEvents: 'none' }]}>
      <Svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <Defs>
          <RadialGradient id={glowId} cx="50%" cy="50%" rx="50%" ry="50%">
            {stops.map((s, i) => (
              <Stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
            ))}
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${glowId})`} />
      </Svg>
    </View>
  );
}

function Spark({ spec, scale }: { spec: (typeof SPARKS)[number]; scale: number }) {
  const [top, left, size, rot, colorIdx, duration, delay] = spec;
  const o = useSharedValue(0);
  useEffect(() => {
    // flickK: mostly 0 with quick flashes toward the end of the cycle
    o.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: duration * 0.84 }),
          withTiming(1, { duration: duration * 0.02 }),
          withTiming(0.15, { duration: duration * 0.02 }),
          withTiming(0.95, { duration: duration * 0.03 }),
          withTiming(0, { duration: duration * 0.09 }),
        ),
        -1,
      ),
    );
  }, [o, duration, delay]);

  const style = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <Animated.View
      style={[
        {
          pointerEvents: 'none',
          position: 'absolute',
          top: top * scale,
          left: left * scale,
          width: size,
          height: size,
          transform: [{ rotate: `${rot}deg` }],
        },
        style,
      ]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={BOLT} fill={Brand.sparkColors[colorIdx]} />
      </Svg>
    </Animated.View>
  );
}

function Orbit({
  inset,
  duration,
  reverse,
  dot,
}: {
  inset: number;
  duration: number;
  reverse?: boolean;
  dot: { size: number; color: string; glow: string; at: 'top' | 'bottom' };
}) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(
      withTiming(reverse ? -1 : 1, { duration, easing: Easing.linear }),
      -1,
    );
  }, [r, duration, reverse]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r.value * 360}deg` }],
  }));

  return (
    <Animated.View
      style={[
        { pointerEvents: 'none', position: 'absolute', top: inset, left: inset, right: inset, bottom: inset },
        style,
      ]}>
      <View
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: -dot.size / 2,
          top: dot.at === 'top' ? -2 : undefined,
          bottom: dot.at === 'bottom' ? -2 : undefined,
          width: dot.size,
          height: dot.size,
          borderRadius: dot.size / 2,
          backgroundColor: dot.color,
          shadowColor: dot.glow,
          shadowOpacity: 0.9,
          shadowRadius: dot.size * 2,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </Animated.View>
  );
}

export function BrandMark({ size = 240 }: { size?: number }) {
  const scale = size / BOX;
  // smooth breathe (logoGlowK) + a quick bright spike (xLiveK 48%/52%)
  const pulse = useSharedValue(0);
  const spike = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 3200 }), -1, true);
    spike.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1400 }),
        withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) }),
        withTiming(0.15, { duration: 200 }),
        withTiming(0, { duration: 1360 }),
      ),
      -1,
    );
  }, [pulse, spike]);

  // logoGlowK: opacity .65↔1, scale 1↔1.07
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.62 + pulse.value * 0.32,
    transform: [{ scale: 1 + pulse.value * 0.07 }],
  }));
  // extra glow bed under the X — the SVG filter does the tight drop-shadow, this
  // just adds the `xLiveK` breathing pulse on top
  const xGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + spike.value * 0.33,
    transform: [{ scale: 1 + spike.value * 0.1 }],
  }));
  const xStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.02 + spike.value * 0.03 }],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* deep ground shadow */}
      <RadialGlow
        glowId="rbMarkGround"
        style={{
          position: 'absolute',
          top: 44 * scale,
          left: 44 * scale,
          right: 44 * scale,
          bottom: 44 * scale,
        }}
        stops={smoothStops('#5A2300', 0.22)}
      />
      {/* pulsing ember halo — extends past the 232 box for a soft spread */}
      <Animated.View
        style={[
          {
            pointerEvents: 'none',
            position: 'absolute',
            top: -18 * scale,
            left: -18 * scale,
            right: -18 * scale,
            bottom: -18 * scale,
          },
          glowStyle,
        ]}>
        <RadialGlow glowId="rbMarkHalo" style={{ flex: 1 }} stops={smoothStops('#FF7A1E', 0.58)} />
      </Animated.View>

      {/* hot glow hugging the glyph — makes the X read bright (xLiveK drop-shadows) */}
      <Animated.View
        style={[
          {
            pointerEvents: 'none',
            position: 'absolute',
            top: 40 * scale,
            left: 40 * scale,
            right: 40 * scale,
            bottom: 40 * scale,
          },
          xGlowStyle,
        ]}>
        <RadialGlow
          glowId="rbMarkXGlow"
          style={{ flex: 1 }}
          stops={[
            { offset: 0, color: '#FFD59A', opacity: 0.9 },
            { offset: 0.25, color: '#FFB25C', opacity: 0.6 },
            { offset: 0.55, color: '#FF7A1E', opacity: 0.28 },
            { offset: 0.8, color: '#FF6E1E', opacity: 0.08 },
            { offset: 1, color: '#FF6E1E', opacity: 0 },
          ]}
        />
      </Animated.View>

      {SPARKS.map((spec, i) => (
        <Spark key={i} spec={spec} scale={scale} />
      ))}

      <Orbit
        inset={30 * scale}
        duration={8500}
        dot={{ size: 5, color: '#FFE3B0', glow: '#FFB35C', at: 'top' }}
      />
      <Orbit
        inset={52 * scale}
        duration={12500}
        reverse
        dot={{ size: 4, color: '#FFD9A8', glow: '#FF9A3C', at: 'bottom' }}
      />

      <Animated.View style={[{ width: size, height: size, position: 'absolute' }, xStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
          <Defs>
            {/* reference: linear-gradient(150deg, #FFE7B8 0, #FFB25C 32%, #FF7A18 66%, #E2560A 100%) */}
            <LinearGradient id="rbMarkX" x1="0.25" y1="0.067" x2="0.75" y2="0.933">
              {Brand.markGradient.map((c, i) => (
                <Stop key={i} offset={Brand.markGradientStops[i]} stopColor={c} />
              ))}
            </LinearGradient>
            {/* reference: drop-shadow(rgba(255,150,50,.85) 0 0 14) drop-shadow(rgba(255,110,20,.55) 0 0 38) */}
            <Filter id="rbXGlow" x="-120%" y="-120%" width="340%" height="340%">
              <FeGaussianBlur in="SourceAlpha" stdDeviation="7" result="b1" />
              <FeFlood floodColor="#FF9632" floodOpacity="0.85" result="f1" />
              <FeComposite in="f1" in2="b1" operator="in" result="g1" />
              <FeGaussianBlur in="SourceAlpha" stdDeviation="19" result="b2" />
              <FeFlood floodColor="#FF6E14" floodOpacity="0.55" result="f2" />
              <FeComposite in="f2" in2="b2" operator="in" result="g2" />
              <FeMerge>
                <FeMergeNode in="g2" />
                <FeMergeNode in="g1" />
                <FeMergeNode in="SourceGraphic" />
              </FeMerge>
            </Filter>
          </Defs>
          <SvgText
            x={BOX / 2}
            y={BOX / 2 + 45}
            fill="url(#rbMarkX)"
            fontFamily={Font.extrabold}
            fontSize={124}
            letterSpacing={-5}
            textAnchor="middle"
            filter="url(#rbXGlow)">
            X
          </SvgText>
        </Svg>
      </Animated.View>
    </View>
  );
}
