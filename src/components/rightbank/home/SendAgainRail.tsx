import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FigmaIcon, PLUS } from '@/components/rightbank/home/figma-assets';
import { SectionHeader } from '@/components/rightbank/home/SectionHeader';
import { figmaHome, Font, sendAgainPayees, type Mode } from '@/constants/rightbank-theme';

/**
 * "Send again" — Figma `Frame 1707480336`: the section bar over a 343×98 card
 * holding a row of recent payees at gap 24.
 *
 * Figma draws six payees in a 331-wide row that overflows the card's clip, which
 * is how a designer says "this scrolls". It is a horizontal `ScrollView` here
 * rather than a clipped row, so the payees past the fourth are reachable.
 *
 * The redesign swaps the card's hairline for `Хас 2` — three drop shadows
 * stacked at the origin, at 24/6/1 blur. The border goes with it: what lifts the
 * card off the page now is the shadow, and keeping both made the edge read as a
 * double line.
 */
export function SendAgainRail({ mode }: { mode: Mode }) {
  const t = figmaHome[mode];

  return (
    <View>
      <SectionHeader mode={mode} title="Send again" />
      <View style={[styles.card, { backgroundColor: t.surface, boxShadow: t.cardShadow }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}>
          <Payee mode={mode} name="Add new" sub="Add new" add />
          {sendAgainPayees.map((p) => (
            <Payee key={p.name} mode={mode} name={p.name} sub={p.bank} ring={p.ring} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function Payee({
  mode,
  name,
  sub,
  ring,
  add,
}: {
  mode: Mode;
  name: string;
  sub: string;
  ring?: string;
  add?: boolean;
}) {
  const t = figmaHome[mode];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={add ? 'Add a new payee' : `Send again to ${name}, ${sub}`}
      testID={add ? 'home_add_payee_button' : `home_send_again_button_${name.toLowerCase().replace(/\s+/g, '_')}`}
      style={({ pressed }) => [styles.payee, pressed && { opacity: 0.7 }]}>
      <View
        style={[
          styles.avatar,
          add
            ? { borderStyle: 'dashed', borderColor: t.ink }
            : { borderColor: ring ?? t.inkTertiary },
        ]}>
        {add ? (
          <FigmaIcon xml={PLUS} box={20} w={13.3333} h={13.3333} tint={t.ink} />
        ) : (
          <View style={[styles.initial, { backgroundColor: ring ?? t.inkTertiary }]}>
            <Text style={styles.initialText}>{name.slice(0, 1)}</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={1} style={[styles.name, { color: t.ink }]}>
        {name}
      </Text>
      <Text numberOfLines={1} style={[styles.bank, { color: t.inkTertiary }]}>
        {sub}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // `overflow: 'hidden'` keeps the scrolled rail inside the 20 radius; it does
  // not touch the card's own shadow, which is drawn outside the border box.
  card: { height: 98, borderRadius: 20, overflow: 'hidden', justifyContent: 'center' },
  rail: { paddingHorizontal: 16, gap: 24, alignItems: 'center' },
  payee: { width: 49, alignItems: 'center', gap: 6 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Figma puts a 30×30 bank logo inside the 40 ring; the app has no logo assets
  // for the payees, so the disc carries the payee's initial at the same size.
  initial: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  initialText: { fontFamily: Font.bold, fontSize: 13, color: '#FFFFFF' },
  name: { fontFamily: Font.semibold, fontSize: 12, textAlign: 'center' },
  bank: { fontFamily: Font.regular, fontSize: 10, textAlign: 'center' },
});
