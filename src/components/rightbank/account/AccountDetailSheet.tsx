/**
 * "Account detail" — Figma `15338:61406`.
 *
 * The sheet an account card opens: the account itself on a gradient card, the
 * "Account reference" banner, then two labelled sections of list rows —
 * "Interest · up to 3%" and "Manage". Everything under the title row scrolls,
 * because the sections together are taller than the 561 the frame gives them.
 *
 * The identity on the gradient card comes from whichever account was tapped.
 * Everything below it is the frame's own copy: there is no data behind the
 * interest figures, the SMS thresholds or the standing-order count yet, and
 * inventing a source for them is not this change. Each `Manage` row's handler
 * is the seam for that — they are inert until there is something to open.
 */
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  SHEET_COPY,
  SHEET_PEN,
  verifiedArt,
} from '@/components/rightbank/account/account-sheet-art';
import {
  SheetChevron,
  SheetSectionHeader,
} from '@/components/rightbank/account/AccountSheetShell';
import {
  accountSheetCopy,
  type AccountSheetTokens,
  cssGradientAngle,
  accountDetailSheet as d,
  GipFont,
  accountSheet as s,
} from '@/constants/rightbank-theme';

const copy = accountSheetCopy.detail;
const b = d.balance;
const r = d.reference;
const c = d.card;

export type AccountDetailIdentity = {
  name: string;
  type: string;
  iban: string;
  amount: string;
  cents: string;
  currency: string;
  verified: boolean;
};

export function AccountDetailSheet({
  t,
  account,
  hidden,
}: {
  t: AccountSheetTokens;
  account: AccountDetailIdentity;
  /** The Accounts navigation bar's eye, carried through to this sheet. */
  hidden: boolean;
}) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.body}>
      {/* The two cards at the top are one group, 16 apart; the group is 6 from
          the section header below it, like every other child of the body. */}
      <View style={{ gap: d.headGap }}>
        <BalanceCard t={t} account={account} hidden={hidden} />
        <ReferenceBanner />
      </View>

      <SheetSectionHeader t={t}>{copy.interest.header}</SheetSectionHeader>

      <ListCard t={t}>
        {copy.interest.rows.map((row, i) => (
          <Row key={row.title} t={t} first={i === 0} glyph={row.glyph} title={row.title} sub={row.sub}>
            <Text
              style={[styles.value, { color: row.dim ? t.tertiary : t.ink }]}
              numberOfLines={1}>
              {row.value}
            </Text>
          </Row>
        ))}
      </ListCard>

      <SheetSectionHeader t={t}>{copy.manage.header}</SheetSectionHeader>

      <ListCard t={t}>
        {copy.manage.rows.map((row, i) => (
          <Row
            key={row.key}
            t={t}
            first={i === 0}
            glyph={row.glyph}
            bold={'bold' in row && row.bold}
            title={row.title}
            sub={'sub' in row ? row.sub : undefined}
            danger={'danger' in row && row.danger}>
            {'value' in row && row.value ? (
              <Text style={[styles.value, { color: t.ink }]} numberOfLines={1}>
                {row.value}
              </Text>
            ) : (
              <SheetChevron color={t.ink} />
            )}
          </Row>
        ))}
      </ListCard>
    </ScrollView>
  );
}

/**
 * The account itself, on the brand gradient. Two rows 16 apart: who the account
 * is with its balance, and the account line with the Statements pill.
 */
function BalanceCard({
  t,
  account,
  hidden,
}: {
  t: AccountSheetTokens;
  account: AccountDetailIdentity;
  hidden: boolean;
}) {
  /** The gradient's own box:  needs the width it is drawn at. */
  const { width } = useWindowDimensions();
  const cardWidth = width - s.gutter * 2;

  const copyIban = async () => {
    await Clipboard.setStringAsync(account.iban);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <View style={styles.balance}>
      <LinearGradient
        colors={s.brand}
        locations={s.brandStops}
        {...cssGradientAngle(b.angle, cardWidth, 99)}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.balanceRow, styles.identityRow]}>
        <View style={styles.who}>
          {account.verified && (
            <SvgXml xml={verifiedArt('#FFFFFF', '#F26800')} width={b.verified} height={b.verified} />
          )}
          <Text style={styles.name} numberOfLines={1}>
            {account.name}
          </Text>
          {/* Renaming the account is drawn but has nowhere to go yet. */}
          <View style={styles.pen}>
            <SvgXml xml={SHEET_PEN} width={b.penArt} height={b.penArt} />
          </View>
        </View>

        {/* One `<Text>` with two spans so the 18 and the 14 share a baseline,
            exactly as on `AccountCard`. */}
        <Text style={styles.amount} numberOfLines={1}>
          {hidden ? account.amount.replace(/\d/g, '•') : account.amount}
          <Text style={styles.cents}>
            {(hidden ? account.cents.replace(/\d/g, '•') : account.cents) + ' ' + account.currency}
          </Text>
        </Text>
      </View>

      <View style={styles.balanceRow}>
        <View style={{ gap: b.metaGap }}>
          <Text style={styles.meta} numberOfLines={1}>
            {account.type}
          </Text>
          <Pressable
            onPress={copyIban}
            accessibilityRole="button"
            accessibilityLabel={`Copy ${account.iban}`}
            testID="account_detail_copy_iban_button"
            style={({ pressed }) => [styles.ibanRow, pressed && styles.pressed]}>
            <Text style={styles.meta} numberOfLines={1}>
              {account.iban}
            </Text>
            <View style={styles.copyBox}>
              <SvgXml xml={SHEET_COPY} width={b.copyArt} height={b.copyArt} />
            </View>
          </Pressable>
        </View>

        <TranslucentPill label={copy.statements} actionId="statements" />
        <TranslucentPill label={copy.reference.cta} actionId="reference" />
      </View>
    </View>
  );
}

/**
 * The translucent capsule both the gradient card and the reference banner use —
 * 90 × 37 at radius 21, a 10 % white fill inside a 50 % white hairline.
 */
function TranslucentPill({
  label,
  actionId,
  onPress,
}: {
  label: string;
  actionId: 'statements' | 'reference';
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`account_detail_${actionId}_button`}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
      <Text style={styles.pillLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * "Account reference" — the dark banner under the balance card. Same dark
 * gradient family as the Home hero, but at this frame's own 344 × 85 and
 * radius 24, with a 44 ringed tile rather than the 44 rounded square the
 * prototype's `DarkToolCard` draws.
 */
function ReferenceBanner() {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.reference}>
      <LinearGradient
        colors={r.fill}
        locations={r.stops}
        {...cssGradientAngle(r.angle, width - s.gutter * 2, r.height)}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.refTile}>
        <Text style={{ fontSize: r.tile.glyph }}>{copy.reference.glyph}</Text>
      </View>

      <View style={styles.refText}>
        {/* Figma's 136 column sizes the subtitle, which wraps to two lines in
            it; the title overruns it on one line rather than wrapping. */}
        <Text style={styles.refTitle} numberOfLines={1}>
          {copy.reference.title}
        </Text>
        <Text style={styles.refSub}>{copy.reference.sub}</Text>
      </View>

      <View style={styles.refPill}>
        <TranslucentPill label={copy.reference.cta} actionId="reference" />
      </View>
    </View>
  );
}

/** A white 343 card at radius 20 holding rows with a rule between each pair. */
function ListCard({ t, children }: { t: AccountSheetTokens; children: React.ReactNode }) {
  return <View style={[styles.card, { backgroundColor: t.surface }]}>{children}</View>;
}

/**
 * One list row: a 32 tinted tile with an emoji in it, a two-line label, and
 * whatever the caller puts on the right — a value or a chevron.
 *
 * The rule above the row is drawn by the row itself rather than interleaved by
 * the parent, so the card's children stay one flat list. It is 1 tall pulled
 * half a pixel into the gap either side, because Figma's own rule sits in a
 * zero-height slot between two 12 gaps and adding its height would push every
 * row below it down by one.
 */
function Row({
  t,
  first,
  glyph,
  bold,
  title,
  sub,
  danger,
  children,
}: {
  t: AccountSheetTokens;
  first: boolean;
  glyph: string;
  bold?: boolean;
  title: string;
  sub?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {!first && <View style={[styles.divider, { backgroundColor: t.divider }]} />}
      <View style={styles.row}>
        <View style={[styles.rowLeft, sub === undefined && styles.rowCentred]}>
          <View
            style={[styles.tile, { backgroundColor: danger ? t.tileDanger : t.tile }]}>
            <Text style={[styles.tileGlyph, bold && styles.tileGlyphBold]}>{glyph}</Text>
          </View>
          <View style={{ gap: c.labelGap, flexShrink: 1 }}>
            <Text style={[styles.rowTitle, { color: t.ink }]} numberOfLines={1}>
              {title}
            </Text>
            {sub !== undefined && (
              <Text style={[styles.rowSub, { color: t.secondary }]} numberOfLines={1}>
                {sub}
              </Text>
            )}
          </View>
        </View>
        {children}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  /**
   * The body starts at 88 on the frame; the title row above it already
   * accounts for 72 of that, so the remainder is this padding. Cards centre
   * themselves — the section headers must stay full width to sit at the
   * gutter, so the container itself does not centre its children.
   */
  body: { gap: d.bodyGap, paddingTop: d.bodyTop - s.headerTop - s.headerHeight },

  /**
   * Figma's 343 is its 375 board less the two 16 gutters, so it is held as
   * gutters rather than as a width — on a 411 screen a fixed 343 would leave
   * the sheet's cards visibly inset from the tab's cards behind it.
   */
  balance: {
    marginHorizontal: s.gutter,
    borderRadius: b.radius,
    paddingHorizontal: b.padX,
    paddingVertical: b.padY,
    gap: b.gap,
    overflow: 'hidden',
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  /**
   * Figma's 22. Stated rather than left to the text, because the amount mixes
   * an 18 and a 14 in one line and the two of them together measure 24 even
   * with both line heights pinned — the second row's own 37 comes from the
   * pill and needs no help. The card's 12 of padding absorbs the difference.
   */
  identityRow: { height: b.rowHeight },
  who: { flexDirection: 'row', alignItems: 'center', gap: b.nameGap, flexShrink: 1 },
  name: { fontFamily: GipFont.bold, fontSize: b.nameSize, lineHeight: b.nameLine, color: '#FFFFFF' },
  pen: { width: b.pen, height: b.pen, alignItems: 'center', justifyContent: 'center' },
  amount: {
    fontFamily: GipFont.bold,
    fontSize: b.amountSize,
    lineHeight: b.amountLine,
    color: '#FFFFFF',
  },
  /**
   * The cents share the amount's line box rather than opening one of their
   * own: a 14 span nested in an 18 line is drawn on its own leading otherwise,
   * which grows Figma's 22 row to 24 and pushes the whole sheet down by two.
   */
  cents: {
    fontFamily: GipFont.semibold,
    fontSize: b.centsSize,
    lineHeight: b.amountLine,
    color: b.centsInk,
  },
  meta: {
    fontFamily: GipFont.medium,
    fontSize: b.metaSize,
    lineHeight: b.metaLine,
    color: b.metaInk,
  },
  ibanRow: { flexDirection: 'row', alignItems: 'center', gap: b.metaGap },
  copyBox: {
    width: b.copyBox,
    height: b.copyBox,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pill: {
    width: b.pill.width,
    height: b.pill.height,
    borderRadius: b.pill.radius,
    borderWidth: 1,
    borderColor: b.pillBorder,
    backgroundColor: b.pillFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontFamily: GipFont.semibold,
    fontSize: b.pill.labelSize,
    lineHeight: b.pill.labelLine,
    color: b.pillInk,
  },

  reference: {
    marginHorizontal: s.gutter,
    height: r.height,
    borderRadius: r.radius,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  refTile: {
    position: 'absolute',
    left: r.tile.left,
    width: r.tile.size,
    height: r.tile.size,
    borderRadius: r.tile.radius,
    borderWidth: 1,
    borderColor: r.tileBorder,
    backgroundColor: r.tileFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refText: { marginLeft: r.textLeft, marginRight: r.textRight, gap: r.textGap },
  refTitle: {
    fontFamily: GipFont.bold,
    fontSize: r.titleSize,
    lineHeight: r.titleLine,
    color: '#FFFFFF',
  },
  refSub: {
    fontFamily: GipFont.medium,
    fontSize: r.subSize,
    lineHeight: r.subLine,
    width: r.subWidth,
    color: r.subInk,
  },
  refPill: { position: 'absolute', right: r.pillRight },

  card: {
    marginHorizontal: s.gutter,
    borderRadius: c.radius,
    padding: c.pad,
    gap: c.gap,
    boxShadow: c.shadow,
  },
  /** Figma's zero-height rule slot: 1 of ink that costs the column nothing. */
  divider: { height: 1, marginVertical: -0.5 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  /**
   * Figma top-aligns the tile with the two-line label rather than centring it,
   * so a longer title grows downward and the tile stays put.
   */
  rowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: c.rowGap, flexShrink: 1 },
  /** The one single-line row — "Close account" — centres on the tile instead. */
  rowCentred: { alignItems: 'center' },
  tile: {
    width: c.tile,
    height: c.tile,
    borderRadius: c.tileRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileGlyph: { fontSize: c.tileGlyph },
  tileGlyphBold: { fontFamily: GipFont.extrabold },
  rowTitle: { fontFamily: GipFont.bold, fontSize: c.labelSize, lineHeight: c.labelLine },
  rowSub: { fontFamily: GipFont.regular, fontSize: c.labelSize, lineHeight: c.subLine },
  value: {
    fontFamily: GipFont.bold,
    fontSize: c.valueSize,
    lineHeight: c.valueLine,
    textAlign: 'right',
  },

  pressed: { opacity: 0.6 },
});
