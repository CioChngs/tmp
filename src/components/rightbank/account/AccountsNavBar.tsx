/**
 * The Accounts navigation bar — Figma `15347:48426`.
 *
 * 375 × 56 with the title centred on it and a 40 button 16 in from the right
 * edge. The bar scrolls with the page rather than pinning: the frame is one
 * 812-tall composition with nothing sticky in it, which is how Home reads its
 * own header too.
 *
 * The button carries `Use icon / Eye_off` — balances shown, tap to hide. The
 * design draws only that state, so the shown-when-hidden glyph is the same
 * export with the diagonal dropped; see `account-art.ts`.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  ACCOUNT_EYE,
  ACCOUNT_EYE_OFF,
  tintArt,
} from '@/components/rightbank/account/account-art';
import {
  figmaAccounts as a,
  accountsCopy,
  type FigmaAccountTokens,
  GipFont,
} from '@/constants/rightbank-theme';

const n = a.nav;

export function AccountsNavBar({
  t,
  hidden,
  onToggleHidden,
}: {
  t: FigmaAccountTokens;
  hidden: boolean;
  onToggleHidden: () => void;
}) {
  return (
    <View style={styles.bar}>
      <Text style={[styles.title, { color: t.ink }]}>{accountsCopy.title}</Text>

      <Pressable
        onPress={onToggleHidden}
        accessibilityRole="switch"
        accessibilityState={{ checked: hidden }}
        accessibilityLabel={hidden ? 'Show balances' : 'Hide balances'}
        testID="account_balance_visibility_switch"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: t.navButton },
          pressed && styles.pressed,
        ]}>
        <SvgXml
          xml={tintArt(hidden ? ACCOUNT_EYE : ACCOUNT_EYE_OFF, '#5C5C5C', t.navGlyph)}
          width={n.eyeArt.width}
          height={n.eyeArt.height}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: n.height, justifyContent: 'center' },
  title: {
    fontFamily: GipFont.bold,
    fontSize: n.titleSize,
    lineHeight: n.titleLine,
    textAlign: 'center',
  },
  button: {
    position: 'absolute',
    right: n.side,
    width: n.button,
    height: n.button,
    borderRadius: n.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: { opacity: 0.6 },
});
