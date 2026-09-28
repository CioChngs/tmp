import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
    CHEVRON_DOWN,
    COPY,
    DOCUMENT,
    EYE,
    EYE_OFF,
    FigmaIcon,
    HAND_COINS,
    REWARD_STAR,
} from '@/components/rightbank/home/figma-assets';
import { GreetingHeader } from '@/components/rightbank/home/GreetingHeader';
import { cssGradientAngle, figmaHome, Font } from '@/constants/rightbank-theme';

/**
 * The Home header — Figma `Frame 1707480257`, 375×370, bottom corners at 30.
 *
 * Drawn identically in the light and dark frames, so it takes no mode: only the
 * page hanging off its bottom edge changes. Everything inside is positioned
 * absolutely against the bottom of the status bar, because that is how Figma
 * measures it and because the row rhythm is not regular enough for a column to
 * reproduce without a stack of one-off margins.
 *
 * The header grows with the safe area rather than clipping into it — the design
 * allows 44 for the status bar and starts the greeting 16 below it, so on a
 * taller notch every offset moves down together and the 326 of content survives.
 */

const SIDE = 16;

/** `figmaHome.accountRow`, short: the row is referenced from several places. */
const ROW = figmaHome.accountRow;

export function HomeHero({
  name,
  balance,
  account,
  insetTop,
  onToggleMode,
  onNotifications,
}: {
  name: string;
  /** Already grouped for display, e.g. `515,845,000`. */
  balance: string;
  account: { prefix: string; number: string };
  insetTop: number;
  onToggleMode: () => void;
  onNotifications?: () => void;
}) {
  const { hero } = figmaHome;
  const { width } = useWindowDimensions();
  const height = insetTop + hero.body;
  const [hidden, setHidden] = useState(false);

  return (
    <View style={[styles.root, { height }]}>
      {/* `Frame 1707480371 1` under `Group 1000004912` — the mesh render with
          the header's color-dodge field already applied to it. Figma crops the
          render to exactly this window, so it needs no offset of its own, and
          baking the field means there is no blend layer here at all. See
          `figmaHome.hero` for how the field was measured. */}
      <Image source={require('@/assets/home/hero-bg.png')} style={styles.photo} />

      {/* The plate is painted before the watermark, because Figma orders it
          that way: `Frame 1707480135` is the frame's third child and the horse
          its last. The hatch crossing the plate is the design, not a mistake. */}
      <Overdraft top={insetTop + hero.cardTop} />

      {/* `Component 662` — the hatched horse, at 10%. Above the plate, and the
          header's own text is above it again because the greeting, the balance
          and the account row are siblings of this frame, not children — so
          everything below stays on top of it. Scaled about its top-left so the
          2 it is inset by holds on any width without the hatch being stretched
          out of proportion. */}
      <Image
        source={require('@/assets/home/hero-horse.png')}
        style={[
          styles.horse,
          {
            // Measured from the bottom of the status bar like every other row,
            // which is also what keeps the art's bottom edge flush with the
            // header's: 105 + 221 is the header's own 326 of body.
            top: insetTop + hero.horse.top,
            width: width - hero.horse.left * 2,
            height: ((width - hero.horse.left * 2) * hero.horse.height) / hero.horse.width,
          },
        ]}
      />

      <View style={[styles.row, { top: insetTop + hero.greetingTop }]}>
        <GreetingHeader name={name} onToggle={onToggleMode} onNotifications={onNotifications} />
      </View>

      {/* Balance — amount, ₮, eye. The redesign drops the flag that used to
          lead the row and puts the currency after the number instead.
          Figma lays the three out as the amount's box 60…267, the ₮ 273…285 and
          the eye 298…322: a group centred on 191 rather than on the screen's
          187.5. The row reproduces that with the frame's own 6 and 13 gaps and
          a 7 left pad, which puts the group centre back on 191; a typeface
          wider than GIP then grows the group evenly about that centre instead
          of driving the amount into the eye. */}
      <View style={[styles.balanceRow, { top: insetTop + hero.balanceTop }]}>
        <MaskedAmount value={balance} hidden={hidden} />
        <Text style={styles.currency}>₮</Text>
        {/* Figma draws the *slashed* eye while the balance is showing — the icon
            names the action, not the state — so `EYE_OFF` is the resting state
            and the open eye is the one it toggles to. The faint halo behind it
            is part of the exported asset. */}
        <Pressable
          onPress={() => setHidden((h) => !h)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
          testID="home_balance_visibility_button"
          style={styles.eye}>
          <FigmaIcon xml={hidden ? EYE : EYE_OFF} box={24} />
        </Pressable>
      </View>

      {/* The account row — the selector takes whatever is left, Copy and
            Statement keep their 40 squares. On the 375 board that leaves the
            selector at exactly Figma's 232, and on anything wider the extra
            goes to the account number rather than into the two 16 gaps. */}
      <View style={[styles.pills, { top: insetTop + hero.pillsTop }]}>
        <Pill grow label="Change account">
          {/* Figma centres the number on 99 of the selector's 232 — the middle
              of what is left once the chevron and its 12 have been taken out,
              not the middle of the pill. */}
          <Text style={styles.pillText} numberOfLines={1}>
            {account.prefix} <Text style={{ fontFamily: Font.bold }}>{account.number}</Text>
          </Text>
          <FigmaIcon xml={CHEVRON_DOWN} box={20} w={7.91683} h={4.5835} style={styles.chevron} />
        </Pill>
        {/* The exported button is one 40 SVG: a glass square and a 1.5-stroke
            glyph drawn in the same box. Only the glyph is kept, so the square
            is the same `Pill` the other two are and can carry a pressed state. */}
        <Pill width={ROW.button} label="Copy account number">
          <FigmaIcon xml={COPY} box={ROW.button} />
        </Pill>
        <Pill width={ROW.button} label="Statement">
          <FigmaIcon xml={DOCUMENT} box={ROW.glyph} w={12.9168} h={16.25} />
        </Pill>
      </View>
    </View>
  );
}

/**
 * A 40-tall glass square, radius 16, contents centred.
 *
 * Either fixed at `width` or told to `grow` into the space the fixed ones leave.
 */
function Pill({
  width,
  grow,
  label,
  children,
}: {
  width?: number;
  grow?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`home_${label.toLowerCase().replace(/\s+/g, '_')}_button`}
      style={({ pressed }) => [
        styles.pill,
        grow ? styles.pillGrow : { width },
        pressed && { opacity: 0.85 },
      ]}>
      {children}
    </Pressable>
  );
}

/**
 * The plate's outline — a rounded rectangle with a notch bitten out of its
 * top-right corner, for the reward chip to sit in.
 *
 * Generated rather than shipped as a fixed asset. The exported 343×94 path was
 * the one thing in the header that could not stretch, so on any screen wider
 * than Figma's 375 board the plate stopped short while the greeting, the pills
 * and everything below it reached the edge — which reads as a gutter down the
 * right-hand side of the header.
 *
 * Four of the six corners are ordinary convex arcs at 20; the two that meet the
 * notch are tighter, at 10, and one of them curves the *other* way. Nothing
 * built out of `borderRadius` produces that, so it is drawn as a path — but a
 * computed one, with arcs instead of the export's cubics. At W=343 it is the
 * exported outline to the unit: `A 10 10 0 0 1 128 10` is the same curve as
 * `C123.523 0 128 4.47715 128 10`.
 *
 * The notch is measured from the **left**, at Figma's 128 — just clear of the
 * overdraft pill, which ends at 113. Anchoring it to the right instead held the
 * notch at 215 and let the gap between the pill and the chip grow with the
 * screen: 30 on the 375 board, 66 on a 411 one. The notch and the chip in it
 * stretch; the 30 that separates them from the pill does not.
 */
function platePath(w: number, h = 95, nx = 128, notchH = 41, r = 20, n = 10) {
  return [
    `M${r} 0`,
    `H${nx - n}`,
    `A${n} ${n} 0 0 1 ${nx} ${n}`,
    `V${notchH - r}`,
    // The concave one: opposite sweep.
    `A${r} ${r} 0 0 0 ${nx + r} ${notchH}`,
    `H${w - n}`,
    `A${n} ${n} 0 0 1 ${w} ${notchH + n}`,
    `V${h - r}`,
    `A${r} ${r} 0 0 1 ${w - r} ${h}`,
    `H${r}`,
    `A${r} ${r} 0 0 1 0 ${h - r}`,
    `V${r}`,
    `A${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join('');
}

/**
 * Overdraft + reward plate — Figma `Frame 1707480509`, 343×94 on the board and
 * as wide as the page allows on anything else.
 *
 * The notch is what makes the reward chip read as punched out of the plate
 * rather than laid on top of it, so the two have to agree: the chip starts 8
 * inside the notch and both run to the plate's right edge.
 */
function Overdraft({ top }: { top: number }) {
  const { width } = useWindowDimensions();
  const w = width - SIDE * 2;

  return (
    <View style={[styles.card, { top }]}>
      {/* The outline is 95 tall in a 94 frame — Figma's own off-by-one, kept
          because the children are measured against the 94. */}
      <Svg width={w} height={95} style={styles.cardShape}>
        <Path d={platePath(w)} fill={figmaHome.onHero.glassSoft} />
      </Svg>

      <View style={styles.overdraftPill}>
        <FigmaIcon
          xml={HAND_COINS}
          box={16}
          w={13.2485}
          h={13.6666}
          offset={{ left: 1.5008, top: 0.8336 }}
        />
        <Text style={styles.cardLabel}>Overdraft</Text>
      </View>

      <View style={styles.track}>
        {/* 95 of the 311-wide track. Figma fixes the fill because the frame has
            no data behind it; the value is the design's, not a computed ratio.

            The flat `#8EABD4` is gone: the fill runs its own 175.19° gradient
            now, which at 8 tall is effectively straight down. */}
        <LinearGradient
          colors={figmaHome.onHero.progressFill}
          locations={figmaHome.onHero.progressStops}
          {...cssGradientAngle(figmaHome.onHero.progressAngle, 95, 8)}
          style={[styles.trackFill, { width: 95 }]}
        />
      </View>

      <View style={styles.limits}>
        <Text style={styles.cardLabel}>Available 255,000 ₮</Text>
        <Text style={styles.cardLabel}>Limit 500,000 ₮</Text>
      </View>

      {/* Each slot spans the chip's full height and centres its own content.
          Figma's `top: 10` assumes GIP's 14-tall line box; Manrope's is nearly
          17, so honouring the offset literally dropped the whole row ~1.5 below
          centre — enough to read as bottom-aligned at 12px. Centring is what the
          frame means, and it holds whatever the typeface does. */}
      <View style={styles.reward}>
        <View style={[styles.rewardSlot, { left: 10 }]}>
          <Text style={styles.cardLabel}>Reward</Text>
        </View>
        <View style={[styles.rewardSlot, { left: 58 }]}>
          <FigmaIcon xml={REWARD_STAR} box={16} />
        </View>
        {/* Figma puts this 10 in from the chip's right edge, so it travels with
            the chip as it stretches. */}
        <View style={[styles.rewardSlot, { right: 10 }]}>
          <Text style={[styles.cardLabel, { fontFamily: Font.bold }]}>20,000</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * The balance with the prototype's per-character mask.
 *
 * Figma draws only the revealed state, but the eye beside it is the same
 * control the prototype has, so the hidden state is kept: each digit sits in a
 * cell that reserves its own width and cross-fades to a centred dot, so
 * toggling never reflows the number or shifts the eye beside it. Separators stay
 * visible, so the grouping still reads while the amount is hidden.
 */
function MaskedAmount({ value, hidden }: { value: string; hidden: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      {value.split('').map((ch, i) =>
        /\d/.test(ch) ? (
          <Digit key={i} ch={ch} hidden={hidden} />
        ) : (
          <Text key={i} style={styles.amount}>
            {ch}
          </Text>
        )
      )}
    </View>
  );
}

function Digit({ ch, hidden }: { ch: string; hidden: boolean }) {
  const [m] = useState(() => new Animated.Value(hidden ? 1 : 0));
  useEffect(() => {
    Animated.timing(m, {
      toValue: hidden ? 1 : 0,
      duration: 90,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [hidden, m]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Text
        style={[
          styles.amount,
          { opacity: m.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
        ]}>
        {ch}
      </Animated.Text>
      <Animated.View pointerEvents="none" style={[styles.dot, { opacity: m }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderBottomLeftRadius: figmaHome.hero.radius,
    borderBottomRightRadius: figmaHome.hero.radius,
    overflow: 'hidden',
  },
  // `width`/`height` are spelled out rather than left to an absolute inset for
  // the reason `LoginBackground` documents: react-native-web renders these as
  // <img>, and a replaced element with `right`/`bottom` but no width falls back
  // to its intrinsic size.
  photo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  horse: {
    position: 'absolute',
    left: figmaHome.hero.horse.left,
    opacity: figmaHome.hero.horse.opacity,
    pointerEvents: 'none',
  },
  row: { position: 'absolute', left: SIDE, right: SIDE },

  balanceRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    // Puts the group's centre on Figma's 191 rather than the screen's 187.5.
    paddingLeft: 7,
  },
  // 43 is the frame's own line box for the 36px amount. Without it Manrope's
  // default leading makes the row 49 tall, and the eye — which centres on the
  // row — sits 3 below where Figma puts it.
  amount: { fontFamily: Font.semibold, fontSize: 36, lineHeight: 43, color: '#FFFFFF' },
  // The ₮ is its own 12×24 text box in Figma, 6 after the amount, and sits on
  // the amount's baseline rather than being scaled with it.
  currency: {
    fontFamily: Font.semibold,
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  // 0.4em — the prototype's ratio, on Figma's 36px amount.
  dot: {
    position: 'absolute',
    width: 14.4,
    height: 14.4,
    borderRadius: 7.2,
    backgroundColor: '#FFFFFF',
  },
  // Figma: 24×24, 13 to the right of the ₮, its centre on the amount's box
  // rather than on its baseline.
  eye: { marginLeft: 13, alignSelf: 'center' },

  // Figma insets the row by 15.5 rather than the page's 16 — it reads as one
  // band half a point wider than the plate below it. The three are 16 apart,
  // held as a gap rather than `space-between`, which parked every extra pixel
  // of a wider screen between them instead of in the control that needed it.
  pills: {
    position: 'absolute',
    left: ROW.inset,
    right: ROW.inset,
    flexDirection: 'row',
    gap: ROW.gap,
  },
  pill: {
    height: ROW.height,
    borderRadius: ROW.radius,
    backgroundColor: figmaHome.onHero.glass,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pillGrow: { flex: 1 },
  // `flex: 1` rather than `flexShrink`: the number is centred in what is left
  // once the chevron and its 12 are taken out, which is where Figma puts it,
  // and a long number then gives way to the chevron instead of pushing it out.
  pillText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Font.regular,
    fontSize: 14,
    color: figmaHome.onHero.secondary,
  },
  chevron: { marginRight: 12 },

  // Stretches with the page, as every other row in the header does.
  card: { position: 'absolute', left: SIDE, right: SIDE, height: 94 },
  cardShape: { position: 'absolute', left: 0, top: 0 },
  overdraftPill: {
    position: 'absolute',
    left: 16,
    top: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    // The redesign doubles this one: the pill is 20% white on a 10% plate, so
    // it reads as raised out of it rather than flush with it.
    backgroundColor: figmaHome.onHero.glass,
  },
  cardLabel: { fontFamily: Font.semibold, fontSize: 12, color: '#FFFFFF' },
  // The redesign moves the track and the two limits 5 further down the plate,
  // from 50/64 to Figma's 55/69, which is the whole of its spacing change here.
  track: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 55,
    height: 8,
    borderRadius: 5,
    backgroundColor: figmaHome.onHero.progressTrack,
    overflow: 'hidden',
  },
  trackFill: { height: 8, borderRadius: 5 },
  limits: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 69,
    height: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // 136 from the plate's left, which is Figma's own offset — 8 inside the notch
  // and 23 clear of the overdraft pill. It stretches to the right edge with the
  // plate instead of holding a fixed 207.
  reward: {
    position: 'absolute',
    left: 136,
    right: 0,
    top: 0,
    height: 33,
    borderRadius: 12,
    backgroundColor: figmaHome.onHero.glassSoft,
    overflow: 'hidden',
  },
  rewardSlot: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
});
