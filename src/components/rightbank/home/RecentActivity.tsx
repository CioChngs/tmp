import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
    ARROW_DOWN,
    ARROW_UP,
    FigmaIcon,
    MERCHANT_CU,
} from '@/components/rightbank/home/figma-assets';
import { SectionHeader } from '@/components/rightbank/home/SectionHeader';
import { activityRows, figmaHome, Font, type Mode } from '@/constants/rightbank-theme';

/**
 * Recent activity — Figma `Frame 1707480323`: the section bar over separate
 * transaction cards at gap 16.
 *
 * Figma makes each row its own rounded card rather than a divided list, which
 * is why there are no hairlines here. Each carries the running balance under the
 * amount, so the right column is two lines, not one.
 *
 * The redesign gives every row `Хас 2` at a third the spread the "Send again"
 * card gets — three drop shadows stacked at the origin, at 12/3/0.5 blur. React
 * Native 0.86 takes a CSS shadow list, so all three are drawn rather than the
 * widest one standing in for the stack.
 */
export function RecentActivity({ mode }: { mode: Mode }) {
  const t = figmaHome[mode];

  return (
    <View>
      <SectionHeader mode={mode} title="Recent activity" action="See all" />
      <View style={{ gap: 16 }}>
        {activityRows.map((r, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            testID={`home_activity_button_${i}`}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: t.surface,
                // Figma borders the first row in the surface colour itself and
                // the other two in `strokecolor/tertiary` — the merchant row
                // reads as edgeless, with only its shadow separating it.
                borderColor: r.merchant ? t.surface : t.surfaceBorder,
                boxShadow: t.rowShadow,
                // Figma pads the merchant row by 16 and the other two by 12;
                // both still come to 70 because its content is 38 and theirs 46.
                padding: r.merchant ? 16 : 12,
              },
              pressed && { opacity: 0.85 },
            ]}>
            <View style={styles.left}>
              {r.merchant ? (
                <FigmaIcon xml={MERCHANT_CU} box={36} />
              ) : (
                <View
                  style={[
                    styles.ring,
                    {
                      backgroundColor: t.surface,
                      borderColor: r.dir === 'in' ? figmaHome.creditRing : figmaHome.debitRing,
                    },
                  ]}>
                  {/* Figma's 16×16 slot holds a 7.67×10.33 arrow — scaling the
                      arrow up to the slot would thicken its stroke. */}
                  <FigmaIcon
                    xml={r.dir === 'in' ? ARROW_DOWN : ARROW_UP}
                    box={16}
                    w={7.668}
                    h={10.3333}
                  />
                </View>
              )}
              <View style={{ gap: 6, flexShrink: 1 }}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.title,
                    { color: t.ink },
                    r.merchant && { fontSize: 14, lineHeight: 17, letterSpacing: -0.28 },
                  ]}>
                  {r.title}
                </Text>
                <Text style={[styles.meta, { color: t.inkTertiary }]}>{r.time}</Text>
              </View>
            </View>

            <View style={{ gap: 6, alignItems: 'flex-end' }}>
              <Text
                style={[
                  styles.amount,
                  { color: r.dir === 'in' ? figmaHome.credit : figmaHome.debit },
                ]}>
                {r.amount}
              </Text>
              <Text style={[styles.meta, { color: t.inkTertiary }]}>{r.balance}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 70,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  ring: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Figma specifies Montserrat here and GIP everywhere else; neither is in the
  // project, so both fall back to Manrope — see migration-progress.md §24.
  // The line heights are Figma's own text boxes rather than Manrope's leading,
  // for the reason the rest of the file states: the merchant row has no fixed
  // height, so its 17 + 6 + 15 of content is what makes it the same 70 as the
  // two rows below it once its 16 of padding is added.
  title: { fontFamily: Font.bold, fontSize: 12, lineHeight: 15, letterSpacing: -0.24 },
  meta: { fontFamily: Font.regular, fontSize: 12, lineHeight: 15, letterSpacing: -0.24 },
  amount: { fontFamily: Font.semibold, fontSize: 12, lineHeight: 15, letterSpacing: -0.24 },
});
