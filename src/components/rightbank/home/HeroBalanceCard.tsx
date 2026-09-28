import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
    CopyIcon,
    EyeToggleIcon,
    HelpyIcon,
    SubscriptionsIcon,
} from '@/components/rightbank/home/HomeIcons';
import { Font, homePalette, type Mode } from '@/constants/rightbank-theme';

/**
 * Primary account hero card — dark gradient, big tabular balance with a
 * show/hide eye toggle (per-character dot mask, no width shift), IBAN + card
 * row, a 3-up action row, and the reference's ambient drifting-particle
 * background (`pBlow` dots drifting L->R while rising + `pFlyBack` birds gliding
 * R->L). Reference: 354 wide, radius 22, padding 18/16/16.
 */

const BAL = "987'654'321";
const CARD_W = 322; // hero inner content width (354 - 2x16)

/** Loop an Animated.Value 0->1 forever (linear), after an initial delay.
 *  Runs on the native driver so it never competes with JS-thread work. */
function useCycle(dur: number, delay: number) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: true }),
    );
    const h = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(h);
      loop.stop();
    };
  }, [v, dur, delay]);
  return v;
}

/** A drifting accent dot (reference `pBlow` / `pBlowK`): L->R while rising,
 *  fading in over the first 18% and out over the last 18%. */
function Dot({ top, size, dur, delay }: { top: number; size: number; dur: number; delay: number }) {
  const v = useCycle(dur, delay);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#93A6C2',
        opacity: v.interpolate({ inputRange: [0, 0.18, 0.82, 1], outputRange: [0, 0.35, 0.35, 0] }),
        transform: [
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-0.1 * CARD_W, 1.1 * CARD_W] }) },
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) },
        ],
      }}
    />
  );
}

/** A drifting snowflake (reference `pFlyBack` = `swimBackK` R->L glide +
 *  `flapK` gentle bob: translateY 0<->-16, rotate -6deg<->7deg). Same 6-point
 *  flake path as the top-right watermark, filled with the Knight accent. */
function Flake({ top, size, dur, delay }: { top: number; size: number; dur: number; delay: number }) {
  const move = useCycle(dur, delay);
  const [bob] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: 0,
        opacity: 0.5,
        transform: [
          { translateX: move.interpolate({ inputRange: [0, 1], outputRange: [1.12 * CARD_W, -0.2 * CARD_W] }) },
          { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) },
          { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '7deg'] }) },
        ],
      }}>
      <Svg width={size} height={size * 0.5625} viewBox="0 0 32 18">
        <Path
          d="M16 5.4c-2.4-3.2-5-3.8-7.2-2.6.7 1.5.3 2.8-.7 3.6C5.6 4.8 3 5.4.6 8c3 .2 4.6 1.7 5.6 3.6 1.4-1 3-1 4.4.3L16 15.4l5.4-3.5c1.4-1.3 3-1.3 4.4-.3 1-1.9 2.6-3.4 5.6-3.6-2.4-2.6-5-3.2-7.5-1.8-1-.8-1.4-2.1-.7-3.6-2.2-1.2-4.8-.6-7.2 2.8z"
          fill="#93A6C2"
        />
      </Svg>
    </Animated.View>
  );
}

function HeroParticles() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Dot top={30} size={4} dur={14000} delay={0} />
      <Dot top={120} size={6} dur={17000} delay={5200} />
      <Dot top={70} size={5} dur={12000} delay={9000} />
      <Flake top={34} size={24} dur={16000} delay={0} />
      <Flake top={92} size={28} dur={26000} delay={8000} />
    </View>
  );
}

/** One character cell: the glyph reserves a fixed width; toggling `hidden`
 *  cross-fades the glyph out and a centred dot in over 120ms (native driver, so
 *  it never touches the JS thread). Same cell width either way -> no reflow. */
function DigitCell({
  ch,
  textStyle,
  dot,
  hidden,
}: {
  ch: string;
  textStyle: object;
  dot: number;
  hidden: boolean;
}) {
  const [m] = useState(() => new Animated.Value(hidden ? 1 : 0)); // 0 glyph, 1 dot
  useEffect(() => {
    Animated.timing(m, {
      toValue: hidden ? 1 : 0,
      duration: 90,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [hidden, m]);

  return (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Text
        style={[textStyle, { opacity: m.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        {ch}
      </Animated.Text>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: '#FFFFFF',
          opacity: m,
        }}
      />
    </View>
  );
}

/**
 * Balance with the reference's per-character mask. Digits sit in fixed-width
 * cells with a centred 0.4em dot (12 on the 30px integers, 6.8 on the 17px
 * decimals); `'` `.` `₮` stay visible. Toggling runs a 120ms native-driver
 * glyph<->dot cross-fade per cell; every cell keeps its width so the block is
 * the same size either way.
 */
function BalanceAmount({ hidden }: { hidden: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      {BAL.split('').map((ch, i) =>
        ch === "'" ? (
          <Text key={i} style={styles.balInt}>
            {ch}
          </Text>
        ) : (
          <DigitCell key={i} ch={ch} textStyle={styles.balInt} dot={12} hidden={hidden} />
        ),
      )}
      <View style={styles.balDecGroup}>
        <Text style={styles.balDecGlyph}>.</Text>
        <DigitCell ch="0" textStyle={styles.balDecGlyph} dot={6.8} hidden={hidden} />
        <DigitCell ch="0" textStyle={styles.balDecGlyph} dot={6.8} hidden={hidden} />
      </View>
      <Text style={styles.balCur}>₮</Text>
    </View>
  );
}

export function HeroBalanceCard({ mode }: { mode: Mode }) {
  const p = homePalette[mode];
  const [hidden, setHidden] = useState(false);
  const [press] = useState(() => new Animated.Value(0)); // reference `.press`: 0→1 = scale 1→.96

  // reference `.press { transition: transform .12s ease } :active { scale(.96) }`
  // `stopAnimation()` first so a fast repeat tap re-triggers the dip from wherever
  // it is instead of getting stuck at 0.96 until the gesture finally releases.
  const pressTo = (to: number) => {
    press.stopAnimation();
    Animated.timing(press, { toValue: to, duration: 90, easing: Easing.ease, useNativeDriver: true }).start();
  };
  const toggle = () => {
    setHidden((h) => !h);
    pressTo(0); // guaranteed spring-back even if onPressOut was dropped on a fast tap
  };

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={p.darkGradient}
        locations={p.darkGradientStops}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <HeroParticles />
      {/* reference "ash" decoration — a clipped (`overflow: hidden`) layer holding
          the faint 6-point snowflake watermark (viewBox 0 0 32 18, right:-14 top:4,
          ~60% card width, fill rgba(255,255,255,0.09), opacity 0.9) and a faint
          150px ring (1.5px rgba(255,255,255,0.06), right:-30 top:-40). */}
      <View pointerEvents="none" style={styles.decor}>
        <Svg width={212} height={119} viewBox="0 0 32 18" style={styles.snowflake}>
          <Path
            d="M16 5.4c-2.4-3.2-5-3.8-7.2-2.6.7 1.5.3 2.8-.7 3.6C5.6 4.8 3 5.4.6 8c3 .2 4.6 1.7 5.6 3.6 1.4-1 3-1 4.4.3L16 15.4l5.4-3.5c1.4-1.3 3-1.3 4.4-.3 1-1.9 2.6-3.4 5.6-3.6-2.4-2.6-5-3.2-7.5-1.8-1-.8-1.4-2.1-.7-3.6-2.2-1.2-4.8-.6-7.2 2.8z"
            fill="rgba(255,255,255,0.09)"
          />
        </Svg>
        <View style={styles.decorRing} />
      </View>
      <View pointerEvents="none" style={styles.warmGlow} />

      {/* row 1 — balance + Money */}
      <View style={styles.rowBetween}>
        <Pressable
          onPress={toggle}
          onPressIn={() => pressTo(1)}
          onPressOut={() => pressTo(0)}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
          testID="account_balance_visibility_button"
          hitSlop={8}>
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) }],
            }}>
            <BalanceAmount hidden={hidden} />
            <EyeToggleIcon size={14} off={hidden} />
          </Animated.View>
        </Pressable>
        <Pressable accessibilityRole="button" testID="account_add_money_button" style={styles.moneyBtn}>
          <Text style={{ fontFamily: Font.regular, fontSize: 12, color: '#FFFFFF' }}>＋ Money</Text>
        </Pressable>
      </View>

      {/* row 2 — IBAN + card pill */}
      <View style={styles.row2}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Text style={styles.iban}>MN32 0000 5000000000</Text>
          <CopyIcon size={13} />
        </View>
        <View style={styles.cardPill}>
          <LinearGradient
            colors={['#5A2408', '#A8480F', '#E07A22']}
            locations={[0, 0.52, 1]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.cardSwatch}
          />
          <Text style={{ fontFamily: Font.regular, fontSize: 12, letterSpacing: 0.5, color: '#FFFFFF' }}>
            •••• 8841
          </Text>
        </View>
      </View>

      {/* row 3 — wallet / subs / helpy */}
      <View style={styles.row3}>
        <View style={styles.miniBtn}>
          <View style={styles.gpayBadge}>
            <Text style={styles.gpayText}>G PAY</Text>
          </View>
          <Text style={styles.miniLabel}>Google Pay</Text>
        </View>
        <View style={styles.miniBtn}>
          <SubscriptionsIcon size={24} />
          <Text style={styles.miniLabel}>Subscriptions</Text>
        </View>
        <View style={styles.miniBtn}>
          <HelpyIcon size={24} />
          <Text style={styles.miniLabel}>Helpy</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(59,74,94,0.35)',
    overflow: 'hidden',
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#93A6C2',
    shadowOpacity: 0.3,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  decor: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  snowflake: {
    position: 'absolute',
    right: -14,
    top: 4,
    opacity: 0.9,
  },
  decorRing: {
    position: 'absolute',
    right: -30,
    top: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  warmGlow: {
    position: 'absolute',
    right: -10,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,235,190,0.10)',
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balInt: { fontFamily: Font.bold, fontSize: 30, letterSpacing: -1.4, color: '#FFFFFF' },
  balDecGroup: { flexDirection: 'row', alignItems: 'baseline', opacity: 0.58 },
  balDecGlyph: { fontFamily: Font.bold, fontSize: 17, letterSpacing: -0.5, color: '#FFFFFF' },
  balCur: { fontFamily: Font.semibold, fontSize: 15, color: '#FFFFFF', opacity: 0.7, marginLeft: 2 },
  moneyBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  row2: {
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iban: { fontFamily: Font.regular, fontSize: 11.5, letterSpacing: 0.3, color: 'rgba(255,255,255,0.75)' },
  cardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  cardSwatch: { width: 20, height: 15, borderRadius: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  row3: { marginTop: 13, flexDirection: 'row', gap: 6 },
  miniBtn: {
    flex: 1,
    height: 71,
    backgroundColor: 'rgba(0,0,0,0.26)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  miniLabel: { fontFamily: Font.regular, fontSize: 11, color: '#FFFFFF' },
  gpayBadge: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3B4A5E',
    borderRadius: 5,
    paddingHorizontal: 5,
    minWidth: 50,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  gpayText: { fontFamily: Font.extrabold, fontSize: 8.5, letterSpacing: 0.4, color: '#3B4A5E' },
});
