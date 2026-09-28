/**
 * "Open an account" — Figma `16058:37255`.
 *
 * Three products under a "Бүтээгдэхүүн" header, and a Continue button pinned 40
 * above the home-indicator band. Nothing scrolls: the frame is 418 and the
 * content fits it.
 *
 * Every row carries a `Verified` badge rather than a per-product icon, which is
 * what the frame draws. The third is not openable yet — Figma marks it "Тун
 * удахгүй" and hides its chevron — so it is disabled here rather than drawn
 * grey and still tappable.
 *
 * Selection is local: the frame shows no selected state, so Continue is the
 * seam for whatever comes next and the rows lead nowhere on their own.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { verifiedArt } from '@/components/rightbank/account/account-sheet-art';
import { SheetChevron, SheetSectionHeader } from '@/components/rightbank/account/AccountSheetShell';
import {
    accountSheetCopy,
    type AccountSheetTokens,
    cssGradientAngle,
    GipFont,
    openAccountSheet as o,
    accountSheet as s,
} from '@/constants/rightbank-theme';

const copy = accountSheetCopy.open;
const c = o.card;

export function OpenAccountSheet({
  t,
  onPick,
  onContinue,
}: {
  t: AccountSheetTokens;
  /** A product row was tapped. Inert until there is a flow behind it. */
  onPick?: (key: string) => void;
  onContinue?: () => void;
}) {
  const { width } = useWindowDimensions();
  /** The button is 343 on Figma's 375 board and the gutters, not the width, are fixed. */
  const ctaWidth = width - s.gutter * 2;

  return (
    <View style={styles.body}>
      <SheetSectionHeader t={t}>{copy.header}</SheetSectionHeader>

      <View style={[styles.card, { backgroundColor: t.surface }]}>
        {copy.products.map((product, i) => {
          const soon = 'chip' in product;
          return (
            // A fragment, not a wrapper: the rule has to be the card's own
            // child so the 10 gap lands above it as well as below.
            <Fragment key={product.key}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: t.divider }]} />}
              <Pressable
                onPress={soon ? undefined : () => onPick?.(product.key)}
                accessibilityRole="button"
                accessibilityState={{ disabled: soon }}
                accessibilityLabel={
                  soon ? `${product.label} — ${product.chip}` : product.label
                }
                testID={`open_account_select_product_button_${product.key}`}
                style={({ pressed }) => [styles.row, pressed && !soon && styles.pressed]}>
                <View style={styles.rowLeft}>
                  <View style={[styles.tile, { backgroundColor: t.tile }]}>
                    <SvgXml
                      xml={verifiedArt(t.quaternary, '#FFFFFF')}
                      width={c.verified}
                      height={c.verified}
                    />
                  </View>
                  <Text style={[styles.label, { color: t.ink }]} numberOfLines={1}>
                    {product.label}
                  </Text>
                </View>

                {soon ? (
                  <View style={[styles.chip, { backgroundColor: t.chip }]}>
                    <Text style={[styles.chipLabel, { color: t.quaternary }]} numberOfLines={1}>
                      {product.chip}
                    </Text>
                  </View>
                ) : (
                  <SheetChevron color={t.ink} />
                )}
              </Pressable>
            </Fragment>
          );
        })}
      </View>

      <Pressable
        onPress={onContinue}
        accessibilityRole="button"
        accessibilityLabel={copy.cta}
        testID="open_account_continue_button"
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
        <LinearGradient
          colors={s.brand}
          locations={s.brandStops}
          {...cssGradientAngle(o.cta.angle, ctaWidth, o.cta.height)}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.ctaLabel}>{copy.cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * The header sits at 78 on the frame and the title row above already covers
   * 72 of that, so the column starts 6 lower. The card then starts at 131,
   * which is 9 below the header's own 44.
   */
  body: { flex: 1, paddingTop: o.sectionTop - s.headerTop - s.headerHeight },

  card: {
    marginTop: o.cardTop - o.sectionTop - s.sectionHeight,
    marginHorizontal: s.gutter,
    borderRadius: c.radius,
    padding: c.pad,
    gap: c.gap,
    boxShadow: c.shadow,
  },
  /**
   * Figma runs this rule 5 past the right edge of the rows it separates —
   * measured, not tidied. Half a pixel of it is pulled into each 10 gap so the
   * rule costs the column no height, as it does in the frame.
   */
  divider: { height: 1, marginVertical: -0.5, marginRight: -c.dividerOverhang },

  row: {
    height: c.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: c.rowGap, flexShrink: 1 },
  tile: {
    width: c.tile,
    height: c.tile,
    borderRadius: c.tileRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: GipFont.bold, fontSize: c.labelSize, lineHeight: c.labelLine },

  chip: {
    width: c.chip.width,
    height: c.chip.height,
    borderRadius: c.chip.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontFamily: GipFont.semibold,
    fontSize: c.chip.labelSize,
    lineHeight: c.chip.labelLine,
  },

  cta: {
    position: 'absolute',
    left: s.gutter,
    right: s.gutter,
    // Figma's 40 is measured from the frame bottom, and the 34 home-indicator
    // band is already reserved by the shell, so 6 of it is left to state here.
    // A deeper inset moves the band down and the 6 above it survives.
    bottom: o.cta.bottom - s.referenceSafeBottom,
    height: o.cta.height,
    borderRadius: o.cta.radius,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: GipFont.semibold,
    fontSize: o.cta.labelSize,
    lineHeight: o.cta.labelLine,
    color: o.cta.labelInk,
  },
  pressed: { opacity: 0.8 },
});
