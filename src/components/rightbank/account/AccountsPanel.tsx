/**
 * The Accounts sub-tab — Figma `15898:52369`.
 *
 * One card per account at gap 16, then the dashed "Open a new account" pill.
 * That is the whole tab in the redesign: the prototype's dark statement banner,
 * the currency-conversion card with its confirmation strip and the "3 of 5
 * current accounts used" caption are all gone from the frame, and the tinted
 * per-currency cards became one neutral card whose only variation is the ring
 * on the selected account.
 */
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { AccountCard } from '@/components/rightbank/account/AccountCard';
import {
  figmaAccounts as a,
  accountsCopy,
  cssGradientAngle,
  figmaAccountsList,
  GipFont,
  type Mode,
} from '@/constants/rightbank-theme';

export function AccountsPanel({ mode, hidden }: { mode: Mode; hidden: boolean }) {
  const t = a[mode];

  return (
    <View style={{ gap: a.list.gap }}>
      {figmaAccountsList.map((account, index) => (
        <AccountCard
          key={account.name}
          account={account}
          t={t}
          hidden={hidden}
          // The eye travels with the account: a balance hidden here should not
          // reappear one tap later.
          onPress={() =>
            router.push({
              pathname: '/account-detail',
              params: { index: String(index), hidden: hidden ? '1' : '0' },
            })
          }
        />
      ))}

      <OpenButton stroke={t.primaryBorder} onPress={() => router.push('/open-account')} />
    </View>
  );
}

/**
 * "Open a new account" — `15331:57940`.
 *
 * The border is an SVG rounded rect rather than `borderStyle: 'dashed'`, which
 * draws the platform's own pattern (about 3 on, 3 off) and reads as a dotted
 * line next to Figma's 9.3 / 6.4. `strokeDasharray` is the only way to say
 * those numbers, so the view itself carries no border.
 *
 * The rect needs a real width, so it waits for one frame of layout: `width`
 * starts null and nothing is drawn until `onLayout` reports it.
 */
function OpenButton({ stroke, onPress }: { stroke: string; onPress?: () => void }) {
  const [width, setWidth] = useState<number | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityLabel={accountsCopy.open}
      testID="account_open_button"
      style={({ pressed }) => [styles.open, pressed && styles.pressed]}>
      {width !== null && (
        <Svg width={width} height={a.open.height} style={StyleSheet.absoluteFill}>
          {/* Inset by half the stroke, so the 1px sits inside the button's own
              box the way a border does rather than straddling its edge. */}
          <Rect
            x={0.5}
            y={0.5}
            width={width - 1}
            height={a.open.height - 1}
            rx={a.open.radius - 0.5}
            fill="none"
            stroke={stroke}
            strokeWidth={1}
            strokeDasharray={a.open.dash}
          />
        </Svg>
      )}
      <OpenLabel />
    </Pressable>
  );
}

/**
 * The button's label, with `background-clip: text` in the design.
 *
 * Same recipe as the selected tab's label in `FloatingTabBar`: React Native
 * cannot fill text with a gradient, so an invisible copy of the text sizes the
 * view and the gradient is clipped to the shape of the visible one. The mask is
 * drawn in the gradient's midpoint, which iOS and Android ignore — it is there
 * for react-native-web, where `MaskedView` renders the mask and drops the
 * children.
 */
function OpenLabel() {
  return (
    <MaskedView
      maskElement={<Text style={[styles.openLabel, styles.maskInk]}>{accountsCopy.open}</Text>}>
      <Text style={[styles.openLabel, styles.hidden]}>{accountsCopy.open}</Text>
      <LinearGradient
        colors={a.segment.active}
        locations={a.segment.activeStops}
        {...cssGradientAngle(a.open.angle, 160, a.open.labelLine)}
        style={StyleSheet.absoluteFill}
      />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  open: {
    height: a.open.height,
    borderRadius: a.open.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openLabel: {
    fontFamily: GipFont.semibold,
    fontSize: a.open.labelSize,
    lineHeight: a.open.labelLine,
    textAlign: 'center',
  },
  maskInk: { color: a.open.mid },
  hidden: { opacity: 0 },
  pressed: { opacity: 0.6 },
});
