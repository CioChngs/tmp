/**
 * My QR — Figma `14656:64128` ("iPhone 13 mini - 31").
 *
 * The scanner's other half: the same segmented control, the user's own code on
 * a white card in the middle of the screen, their name and account under it,
 * and a share / copy pair.
 *
 * A tab with no item in the bar, for the same reason `scan` is one — the design
 * keeps the floating bar on screen, and the two screens are each other's
 * destination through the segmented control. The page is light here, so the bar
 * stays solid; only the scanner turns it to glass.
 *
 * The block is centred on the screen rather than laid out from the top, which
 * is what Figma does with it, and is what keeps the card off both the control
 * above it and the bar below it on a taller device.
 */
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { peekRememberedUser } from '@/auth/remembered-user';
import { MYQR_COPY, MYQR_SHARE } from '@/components/rightbank/myqr/myqr-art';
import { QrCode } from '@/components/rightbank/myqr/QrCode';
import { SegmentedTabs } from '@/components/rightbank/scan/SegmentedTabs';
import { Font, figmaMyQr as m, figmaScan as s } from '@/constants/rightbank-theme';
import { ScreenNavigationBar } from '@/theme/system-navigation-bar';

/**
 * The same placeholder account Home's hero shows, and the seam where the real
 * one will arrive. `prefix` is the branch, `number` the account.
 */
const ACCOUNT = { prefix: 'MN65 0032 00', number: '5000610569' };

/**
 * What the code carries: the whole account reference, unspaced. There is no
 * payment-request format to encode against yet — when there is, this is the one
 * line that changes. It is also what puts the code at the design's own 25
 * modules, since the matrix size follows the payload.
 */
const ACCOUNT_ID = (ACCOUNT.prefix + ACCOUNT.number).replace(/\s/g, '');

/** Figma's own name, standing in when nothing has been remembered yet. */
const FALLBACK_NAME = 'Erdenebayar Ganzorig';

export default function MyQrScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const remembered = peekRememberedUser();
  const full = remembered?.displayName ?? remembered?.username ?? FALLBACK_NAME;
  // The design sets the given name bold and the rest medium, so the split is on
  // the first space — and a single-word name simply stays bold.
  const space = full.indexOf(' ');
  const first = space === -1 ? full : full.slice(0, space);
  const rest = space === -1 ? '' : full.slice(space);

  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(ACCOUNT.number);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const share = useCallback(async () => {
    // The sheet is the system's own, so it carries the text the user expects to
    // paste: the name the code belongs to and the account it pays.
    await Share.share({ message: `${full}\n${ACCOUNT.prefix} ${ACCOUNT.number}` });
  }, [full]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" animated />
      {/* `#FCFCFC` in both themes, so the bar is pinned light. */}
      <ScreenNavigationBar buttons="black" />

      <SegmentedTabs
        active="my-qr"
        variant="light"
        top={insets.top + s.segment.top}
        onSelect={() => router.navigate('/scan')}
      />

      <Text style={[styles.note, { top: insets.top + m.note.top }]}>
        Anyone can scan this to send you money. It shows your name and account number, so treat it
        like a business card, not a password.
      </Text>

      <View style={styles.block}>
        <View style={styles.card}>
          {/* Figma insets the art 5 % inside the card — 207 within 230 — and the
              art carries its own `#F8F8F8` panel at the card's radius. */}
          <QrCode value={ACCOUNT_ID} size={m.card.art} />
        </View>

        <View style={styles.text}>
          <Text style={styles.name}>
            <Text style={styles.nameFirst}>{first}</Text>
            {rest}
          </Text>
          <Text style={styles.account}>
            {ACCOUNT.prefix} <Text style={styles.accountNumber}>{ACCOUNT.number}</Text>
          </Text>
        </View>

        <View style={styles.actions}>
          <ActionButton xml={MYQR_SHARE} art={19.5078} label="Хуваалцах" actionId="share" onPress={share} />
          <ActionButton xml={MYQR_COPY} art={19.5} label="Хуулах" actionId="copy" onPress={copy} />
        </View>
      </View>
    </View>
  );
}

/** One of the two 48 buttons under the card: a 19.5 glyph in a 24 box. */
function ActionButton({
  xml,
  art,
  label,
  actionId,
  onPress,
}: {
  xml: string;
  art: number;
  label: string;
  actionId: 'share' | 'copy';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`myqr_${actionId}_button`}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View style={styles.actionIcon}>
        <SvgXml xml={xml} width={art} height={art} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: m.page },

  note: {
    position: 'absolute',
    alignSelf: 'center',
    width: m.note.width,
    fontFamily: Font.medium,
    fontSize: m.note.size,
    lineHeight: m.note.line,
    color: m.note.ink,
    textAlign: 'center',
  },

  /**
   * `14656:64136`. Figma centres it on the frame and then pins the card to its
   * top and the buttons 2 below its bottom; a column with the gaps between them
   * lands in the same place and survives a taller line of text, so the height
   * is a minimum rather than a fixed measure.
   */
  block: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -m.block.height / 2 + m.block.offsetY,
    minHeight: m.block.height,
    alignItems: 'center',
  },
  card: {
    width: m.card.size,
    height: m.card.size,
    borderRadius: m.card.radius,
    backgroundColor: m.card.fill,
    boxShadow: m.card.shadow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: { width: m.block.width, marginTop: m.block.gap, alignItems: 'center', gap: 6 },
  name: {
    fontFamily: Font.medium,
    fontSize: m.name.size,
    lineHeight: m.name.line,
    color: m.name.rest,
    textAlign: 'center',
  },
  nameFirst: { fontFamily: Font.bold, color: m.name.first },
  account: {
    fontFamily: Font.regular,
    fontSize: m.account.size,
    lineHeight: m.account.line,
    color: m.account.prefix,
    textAlign: 'center',
  },
  accountNumber: { fontFamily: Font.bold, color: m.account.number },

  // Figma pins the pair 2 below the block; from the text above it that is the
  // 359 the block measures, which `marginTop: 'auto'` reproduces whatever the
  // name wraps to.
  actions: { flexDirection: 'row', gap: m.actions.gap, marginTop: 'auto', marginBottom: -2 },
  action: {
    width: m.actions.size,
    height: m.actions.size,
    borderRadius: m.actions.radius,
    borderWidth: 1,
    borderColor: m.actions.border,
    backgroundColor: m.actions.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: m.actions.iconBox,
    height: m.actions.iconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
