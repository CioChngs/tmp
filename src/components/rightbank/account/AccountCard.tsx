/**
 * One account — Figma `15860:77246`.
 *
 * A 343 × 118 card at radius 24 holding two rows either side of a hairline: who
 * the account is (wallet tile, name, type) with its balance on the right, and
 * the IBAN with a copy affordance and a "Хуулга" badge under it.
 *
 * The height is Figma's and is fixed; the 84 of content is centred in it, so a
 * longer name grows away from both edges instead of pushing the card. The
 * orange ring and the verified tick are per-account marks in the design rather
 * than a rule about the first row, so both arrive as props.
 */
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  ACCOUNT_COPY,
  ACCOUNT_VERIFIED,
  ACCOUNT_WALLET,
  tintArt,
} from '@/components/rightbank/account/account-art';
import {
  figmaAccounts as a,
  accountsCopy,
  type FigmaAccountTokens,
  GipFont,
} from '@/constants/rightbank-theme';

const c = a.card;

export type AccountRow = {
  name: string;
  type: string;
  iban: { prefix: string; number: string };
  amount: string;
  cents: string;
  currency: string;
  verified: boolean;
  primary: boolean;
};

export function AccountCard({
  account,
  t,
  hidden,
  onPress,
  onStatement,
}: {
  account: AccountRow;
  t: FigmaAccountTokens;
  /** The navigation bar's eye — balances only, never the account number. */
  hidden: boolean;
  /** Opens "Account detail" — Figma `15338:61406`. */
  onPress?: () => void;
  onStatement?: () => void;
}) {
  const copy = async () => {
    await Clipboard.setStringAsync(account.iban.prefix + account.iban.number);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: t.surface,
          borderColor: account.primary ? t.primaryBorder : 'transparent',
          borderWidth: account.primary ? 1 : 0,
        },
      ]}>
      {/* The whole card opens the detail sheet, but the identity row is what
          carries the label and the button role: the copy affordance and the
          "Хуулга" badge are buttons inside this same card, and a button
          wrapping other buttons is a hierarchy no assistive technology — or
          react-native-web's DOM — can make sense of. This outer layer is a
          touch target only, so a tap anywhere on the card still opens it. */}
      <Pressable onPress={onPress} accessible={false} style={styles.inner}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${account.name}, ${account.type}`}
          testID={`account_view_button_${account.name.toLowerCase().replace(/\s+/g, '_')}`}
          style={styles.identity}>
          <View style={styles.who}>
            <View style={[styles.tile, { backgroundColor: t.iconFill }]}>
              <SvgXml
                xml={ACCOUNT_WALLET}
                width={c.icon.art.width}
                height={c.icon.art.height}
                style={{
                  position: 'absolute',
                  left: (c.icon.box - c.icon.glyph) / 2 + c.icon.art.left,
                  top: (c.icon.box - c.icon.glyph) / 2 + c.icon.art.top,
                }}
              />
            </View>

            <View style={{ gap: c.nameGap }}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: t.ink }]} numberOfLines={1}>
                  {account.name}
                </Text>
                {account.verified && (
                  <SvgXml xml={ACCOUNT_VERIFIED} width={c.verified} height={c.verified} />
                )}
              </View>
              <Text style={[styles.type, { color: t.tertiary }]} numberOfLines={1}>
                {account.type}
              </Text>
            </View>
          </View>

          {/* One `<Text>` with two spans, as Figma draws it: the 18 and the 14
              share a baseline, which two sibling views set to the same line
              height would only approximate. That is also why the hidden state
              swaps the digits inside the span rather than reaching for
              `MaskedDigits`, which is a row of views. */}
          <Text style={[styles.amount, { color: t.ink }]} numberOfLines={1}>
            {hidden ? account.amount.replace(/\d/g, '•') : account.amount}
            <Text style={[styles.cents, { color: t.cents }]}>
              {(hidden ? account.cents.replace(/\d/g, '•') : account.cents) +
                ' ' +
                account.currency}
            </Text>
          </Text>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: t.divider }]} />

        <View style={styles.foot}>
          <Pressable
            onPress={copy}
            accessibilityRole="button"
            accessibilityLabel={`Copy ${account.iban.prefix}${account.iban.number}`}
            testID={`account_copy_iban_button_${account.name.toLowerCase().replace(/\s+/g, '_')}`}
            style={({ pressed }) => [styles.ibanRow, pressed && styles.pressed]}>
            <Text style={[styles.iban, { color: t.tertiary }]} numberOfLines={1}>
              {account.iban.prefix}
              <Text style={[styles.ibanNumber, { color: t.ink }]}>{account.iban.number}</Text>
            </Text>
            {/* 13 of art in Figma's 12 box, so it overhangs by half a pixel
                each way — the box is what the row measures. */}
            <View style={styles.copyBox}>
              <SvgXml
                xml={tintArt(ACCOUNT_COPY, '#898989', t.copyInk)}
                width={c.copyArt}
                height={c.copyArt}
              />
            </View>
          </Pressable>

          <Pressable
            onPress={onStatement}
            accessibilityRole="button"
            accessibilityLabel={accountsCopy.statement}
            testID={`account_view_statement_button_${account.name.toLowerCase().replace(/\s+/g, '_')}`}
            style={({ pressed }) => [
              styles.badge,
              { backgroundColor: t.badgeFill },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.badgeLabel, { color: t.badgeInk }]}>{accountsCopy.statement}</Text>
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: c.height,
    borderRadius: c.radius,
    overflow: 'hidden',
  },
  /** The 84 of content, centred in the 118 — Figma's 17 above and below. */
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: c.pad,
    gap: c.gap,
  },

  identity: {
    height: c.identityHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: c.iconGap, flexShrink: 1 },
  tile: {
    width: c.icon.box,
    height: c.icon.box,
    borderRadius: c.icon.radius,
    overflow: 'hidden',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: c.verifiedGap },
  name: { fontFamily: GipFont.bold, fontSize: c.nameSize, lineHeight: c.nameLine },
  type: { fontFamily: GipFont.semibold, fontSize: c.typeSize, lineHeight: c.typeLine },

  amount: {
    fontFamily: GipFont.bold,
    fontSize: c.amountSize,
    lineHeight: c.amountLine,
    textAlign: 'right',
  },
  cents: { fontFamily: GipFont.medium, fontSize: c.centsSize },

  divider: { height: 1 },

  foot: {
    height: c.footHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ibanRow: { flexDirection: 'row', alignItems: 'center', gap: c.copyGap, flexShrink: 1 },
  iban: { fontFamily: GipFont.semibold, fontSize: c.ibanSize, lineHeight: c.ibanLine },
  ibanNumber: { fontFamily: GipFont.bold },
  copyBox: {
    width: c.copy,
    height: c.copy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badge: {
    width: c.badge.width,
    height: c.badge.height,
    borderRadius: c.badge.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontFamily: GipFont.semibold,
    fontSize: c.badge.labelSize,
    lineHeight: c.badge.labelLine,
    textAlign: 'center',
  },

  pressed: { opacity: 0.6 },
});
