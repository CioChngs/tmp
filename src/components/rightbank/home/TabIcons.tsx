import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  TAB_ACCOUNT,
  TAB_CARD,
  TAB_HOME,
  TAB_MORE,
  TAB_MORE_DOTS,
  TAB_SCAN,
} from '@/components/rightbank/home/tabbar-art';
import { figmaTabBar } from '@/constants/rightbank-theme';

/**
 * The floating tab bar's four glyphs and its scan mark — Figma `Component 602`.
 *
 * These replace hand-ported copies of the prototype's inline SVGs, which drew a
 * blue "Knight" palette the redesign no longer uses. The markup is the
 * designer's; see `tabbar-art.ts`.
 *
 * The selected tab is not marked by a filled slot but by the brand gradient
 * running through the glyph — and through the label beside it, which
 * `FloatingTabBar` paints the same way. `paint()` is the whole rule: the icons
 * are stored in the inactive grey, and an active one has its fills pointed at
 * the gradient Figma gives the selected glyph, at that gradient's own geometry.
 */

const GLYPHS = {
  home: TAB_HOME,
  account: TAB_ACCOUNT,
  card: TAB_CARD,
  more: TAB_MORE,
} as const;

export type TabGlyphName = keyof typeof GLYPHS;

/**
 * `Vector`'s own gradient on the Home glyph: a 45° run across the 24 box, from
 * its bottom-left to its top-right.
 */
const BRAND_DEFS =
  '<defs><linearGradient id="brand" x1="3.90934" y1="20.0907" x2="20.0907" y2="3.90934"' +
  ' gradientUnits="userSpaceOnUse"><stop stop-color="' +
  figmaTabBar.active[0] +
  '"/><stop offset="1" stop-color="' +
  figmaTabBar.active[1] +
  '"/></linearGradient></defs>';

function paint(xml: string, active: boolean, tint?: string) {
  if (active) {
    return xml
      .replace(/fill="#B7B7B7"/g, 'fill="url(#brand)"')
      .replace('</svg>', BRAND_DEFS + '</svg>');
  }
  // `Component 604`, the bar's over-camera variant, draws every glyph white
  // instead of grey. Same one-rule substitution, a flat colour instead of the
  // gradient — the duotone opacities ride along untouched.
  if (tint) return xml.replace(/fill="#B7B7B7"/g, `fill="${tint}"`);
  return xml;
}

export function TabGlyph({
  name,
  active,
  tint,
}: {
  name: TabGlyphName;
  active: boolean;
  tint?: string;
}) {
  const box = figmaTabBar.item.iconBox;

  return (
    <View style={{ width: box, height: box }}>
      <SvgXml xml={paint(GLYPHS[name], active, tint)} width={box} height={box} />
      {/* `Ellipse 3858` — a 12×2 grey ellipse at 20% under the More dots, which
          only that tab has. It stays grey when the tab is selected: Figma gives
          it its own flat fill rather than the gradient the glyph takes. */}
      {name === 'more' ? (
        <SvgXml xml={paint(TAB_MORE_DOTS, false, tint)} width={12} height={2} style={styles.dots} />
      ) : null}
    </View>
  );
}

/** The scan mark inside the raised button: four corner brackets, 23.57 in a 29 box. */
export function ScanGlyph() {
  const box = figmaTabBar.fabGlyph;

  return (
    <View style={{ width: box, height: box }}>
      {/* Figma insets the art 9.36% on all four sides of the 29 box. */}
      <SvgXml xml={TAB_SCAN} width={23.5718} height={23.5718} style={styles.scan} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Figma puts it at y 25 of the item box, which is 23 into the 24 icon box.
  dots: { position: 'absolute', alignSelf: 'center', top: 23 },
  scan: { position: 'absolute', left: 2.7141, top: 2.7141 },
});
