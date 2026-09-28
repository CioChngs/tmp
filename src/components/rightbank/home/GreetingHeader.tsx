import { Pressable, Text, View } from 'react-native';

import { BELL, FigmaIcon, LOGO_MARK, ROUND_BTN, SUN } from '@/components/rightbank/home/figma-assets';
import { figmaHome, Font } from '@/constants/rightbank-theme';

/**
 * Home greeting row — Figma `15314:40280`, 343×35 at x=16.
 *
 * Brand mark · time-of-day greeting over the customer's name · a notification
 * button and the light/dark toggle. The row sits on the blue header, so every
 * colour here is a fixed on-hero value rather than a mode token — the header
 * is drawn identically in both Figma frames.
 */
function greetingFor(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * The 32×32 round header button — Figma `Component 647`, a white-10% disc
 * under a 0.5px white ring, with the glyph centred inside.
 *
 * Both buttons share the disc; only the glyph and its slot differ, which is
 * why the two are one component with the leaf passed in rather than two.
 */
function RoundButton({
  xml,
  box,
  w,
  h,
  onPress,
  label,
  testID,
}: {
  xml: string;
  box: number;
  w: number;
  h: number;
  onPress?: () => void;
  label: string;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      hitSlop={8}
      style={({ pressed }) => [
        { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
        pressed && { opacity: 0.7 },
      ]}>
      <FigmaIcon xml={ROUND_BTN} box={32} style={{ position: 'absolute' }} />
      <FigmaIcon xml={xml} box={box} w={w} h={h} />
    </Pressable>
  );
}

export function GreetingHeader({
  name,
  onToggle,
  onNotifications,
}: {
  /** Whoever this device is signed in as. */
  name: string;
  onToggle: () => void;
  onNotifications?: () => void;
}) {
  const c = figmaHome.onHero;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <FigmaIcon xml={LOGO_MARK} box={30} />
        {/* Figma fixes this column at 139 so the two buttons never shift when a
            longer name arrives; the name truncates instead. */}
        <View style={{ width: 139, gap: 4 }}>
          <Text style={{ fontFamily: Font.regular, fontSize: 12, color: c.greeting }}>
            {greetingFor()},
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontFamily: Font.bold, fontSize: 14, color: c.primary }}>
            {name}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Figma's slots: the bell is 11.67×13.01 in a 16 box, the sun
            16.89×16.89 in a 21.33 box — both centred on the same 32 disc. */}
        <RoundButton
          xml={BELL}
          box={16}
          w={11.6713}
          h={13.0052}
          onPress={onNotifications}
          label="Notifications"
          testID="home_notifications_button"
        />
        <RoundButton
          xml={SUN}
          box={21.333}
          w={16.8891}
          h={16.8891}
          onPress={onToggle}
          label="Switch appearance"
          testID="home_appearance_button"
        />
      </View>
    </View>
  );
}
