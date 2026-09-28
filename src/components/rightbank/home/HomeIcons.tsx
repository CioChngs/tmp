/**
 * Home-screen icon set — direct ports of the reference's inline SVGs
 * (`react-native-svg`). Kept 1:1 with the source `d`/coords so the shapes match.
 * The four "Illo" tile icons share a 0 0 48 48 box drawn at 50×50.
 */
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

const INK = '#2C3646';
const KNIGHT = '#93A6C2';
const PALE = '#E3E9F2';

/** Overdraft — card + minus badge. */
export function OverdraftIcon({ size = 50 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="ovA" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={PALE} />
          <Stop offset="1" stopColor={KNIGHT} />
        </LinearGradient>
      </Defs>
      <Rect x="4" y="13" width="34" height="23" rx="5" fill="url(#ovA)" stroke={INK} strokeWidth="1.4" />
      <Rect x="4" y="19" width="34" height="5" fill={INK} opacity="0.55" />
      <Rect x="9" y="28" width="11" height="3.4" rx="1.7" fill={INK} opacity="0.35" />
      <Circle cx="37" cy="33" r="9" fill={KNIGHT} stroke={INK} strokeWidth="1.4" />
      <Path d="M37 28.6v8.8M32.6 33h8.8" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
    </Svg>
  );
}

/** Transfer — paper plane. */
export function TransferIcon({ size = 50 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="trA" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={PALE} />
          <Stop offset="1" stopColor={KNIGHT} />
        </LinearGradient>
      </Defs>
      <Path d="M42 7 6 21.5l13.4 4.6L42 7z" fill="url(#trA)" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <Path d="M42 7 19.4 26.1 22 40l6.2-9.6L42 7z" fill={KNIGHT} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <Circle cx="10.5" cy="34" r="2" fill={KNIGHT} opacity="0.75" />
      <Circle cx="15.5" cy="39.5" r="1.4" fill={KNIGHT} opacity="0.55" />
    </Svg>
  );
}

/** Billing — receipt + clock. */
export function BillingIcon({ size = 50 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="blA" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PALE} />
          <Stop offset="1" stopColor={KNIGHT} />
        </LinearGradient>
      </Defs>
      <Path
        d="M9 6h24a2 2 0 0 1 2 2v33l-4.5-3-4.5 3-4.5-3-4.5 3-4.5-3L7 41V8a2 2 0 0 1 2-2z"
        fill="url(#blA)"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <Path d="M13 15h16M13 21h16M13 27h10" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <Circle cx="35" cy="33" r="9" fill={KNIGHT} stroke={INK} strokeWidth="1.4" />
      <Path d="M35 28.5V33l3 2" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Savings — stacked coins. */
export function SavingsIcon({ size = 50 }: { size?: number }) {
  const layer = (cyBack: number, cyFront: number, key: string) => (
    <G key={key}>
      <Ellipse cx="24" cy={cyBack} rx="15" ry="5.4" fill={KNIGHT} stroke={INK} strokeWidth="1.3" />
      <Ellipse cx="24" cy={cyFront} rx="15" ry="5.4" fill="url(#svA)" stroke={INK} strokeWidth="1.3" />
    </G>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="svA" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={PALE} />
          <Stop offset="1" stopColor={KNIGHT} />
        </LinearGradient>
      </Defs>
      {layer(38, 34, 'a')}
      {layer(30, 26, 'b')}
      {layer(22, 18, 'c')}
      <Ellipse cx="24" cy="18" rx="7.5" ry="2.6" fill={INK} opacity="0.22" />
    </Svg>
  );
}

/** Subscriptions — refresh loop (hero row, 24px). */
export function SubscriptionsIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M11 27a13.5 13.5 0 0 1 22.6-9.4" stroke={KNIGHT} strokeWidth="5" strokeLinecap="round" fill="none" />
      <Path d="M36.5 8.5v10h-10z" fill={INK} />
      <Path d="M37 21a13.5 13.5 0 0 1-22.6 9.4" stroke={PALE} strokeWidth="5" strokeLinecap="round" fill="none" />
      <Path d="M11.5 39.5v-10h10z" fill={INK} />
    </Svg>
  );
}

/** Helpy — speech bubble with a question mark (hero row, 24px). */
export function HelpyIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="uhA" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PALE} />
          <Stop offset="1" stopColor={KNIGHT} />
        </LinearGradient>
      </Defs>
      <Path
        d="M24 5.5c10.8 0 19.5 7.1 19.5 15.9S34.8 37.3 24 37.3c-2 0-4-.25-5.8-.75L9 40.5l2.7-7.6a15 15 0 0 1-6.2-11.5C5.5 12.6 13.2 5.5 24 5.5z"
        fill="url(#uhA)"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <Path d="M19.8 17.6a4.3 4.3 0 0 1 8.4 1.2c0 2.9-4 3.4-4 5.6" stroke={INK} strokeWidth="2.7" strokeLinecap="round" fill="none" />
      <Circle cx="24.2" cy="29.3" r="1.9" fill={INK} />
    </Svg>
  );
}

/** Small chevron used inside carousel CTA pills + nav arrows (stroke 2.6). */
export function Chevron({ size = 11, color = '#FFFFFF', dir = 'right' as 'right' | 'left' }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={dir === 'left' ? { transform: [{ rotate: '180deg' }] } : undefined}>
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Down caret next to the hero balance. */
export function CaretDown({ size = 14, color = 'rgba(255,255,255,0.55)' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Eye / eye-off toggle next to the hero balance (reference stroke 1.7). */
export function EyeToggleIcon({
  size = 14,
  color = 'rgba(255,255,255,0.55)',
  off = false,
}: {
  size?: number;
  color?: string;
  off?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <Circle cx="12" cy="12" r="3" />
      {off && <Path d="M3 3l18 18" />}
    </Svg>
  );
}

/** Copy glyph next to the IBAN. */
export function CopyIcon({ size = 13, color = 'rgba(255,255,255,0.85)' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="11" height="11" rx="2.5" stroke={color} strokeWidth="2" />
      <Path d="M15 5H6a2 2 0 0 0-2 2v9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
