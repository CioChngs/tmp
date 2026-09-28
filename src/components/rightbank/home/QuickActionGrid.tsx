import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
    BILLS,
    FigmaIcon,
    SavingsIllo,
    TRANSFER,
} from '@/components/rightbank/home/figma-assets';
import { figmaHome, Font } from '@/constants/rightbank-theme';

/**
 * Quick actions — Figma `Frame 1707480576`, 343×100 at x=16, three equal tiles
 * at gap 12.
 *
 * The redesign flattens the three into one card. Savings and Billing used to
 * share a quiet blue skin and Transfer ran the same 226.39° gradient at full
 * opacity, which is what marked it as the primary action; now all three are the
 * same warm card — a flat `#FEF4ED` hairline over a 10% wash of it — with a
 * black 15 label, and the illustrated icons carry the difference instead. So
 * there is no `primary` flag left to pass.
 *
 * The prototype's 2×2 grid, its floating icons and its breathing glow went in
 * the previous pass and have not come back. The fourth tile, Overdraft, is
 * still in the header plate.
 */
export function QuickActionGrid() {
  return (
    <View style={styles.row}>
      <Tile label="Savings">
        <SavingsIllo size={figmaHome.tile.iconBox} />
      </Tile>
      <Tile label="Billing">
        <FigmaIcon xml={BILLS} box={figmaHome.tile.iconBox} />
      </Tile>
      <Tile label="Transfer">
        <FigmaIcon xml={TRANSFER} box={figmaHome.tile.iconBox} />
      </Tile>
    </View>
  );
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`home_quick_action_button_${label.toLowerCase().replace(/\s+/g, '_')}`}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}>
      {children}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const { tile } = figmaHome;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: tile.gap, height: tile.height },
  /**
   * `paddingTop` and the gap are what put the two children where Figma draws
   * them — the icon's box at y 15 and the label centred on y 74, both measured
   * inside the 1px border, which is also where React Native positions them.
   * 15 + 40 + 10 + 18/2 = 74.
   */
  tile: {
    flex: 1,
    borderRadius: tile.radius,
    borderWidth: 1,
    borderColor: tile.border,
    backgroundColor: tile.fill,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: tile.iconTop,
    gap: 10,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: tile.labelSize,
    lineHeight: tile.labelLine,
    color: tile.labelInk,
    textAlign: 'center',
  },
});
