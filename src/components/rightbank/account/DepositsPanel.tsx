import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { DarkToolCard } from '@/components/rightbank/account/DarkToolCard';
import {
    accountPalette,
    Brand,
    childSavingsGradient,
    childSavingsGradientStops,
    childSavingsKids,
    Font,
    homePalette,
    termDeposits,
    type Mode,
} from '@/constants/rightbank-theme';

/**
 * Deposits sub-tab. Reference order: Account reference banner → Child savings
 * (full-bleed violet gradient) → daily-saving streak card (gold tint) →
 * Savings goals row → term-deposit cards (sky tint, progress bar) →
 * "+ Open a deposit" (Knight gradient) → helper caption.
 */
export function DepositsPanel({ mode }: { mode: Mode }) {
  const p = homePalette[mode];
  const ap = accountPalette[mode];

  return (
    <View style={{ gap: 12 }}>
      <DarkToolCard
        mode={mode}
        icon="📄"
        title="Account reference"
        subtitle="Official bank statement · fee 30'000₮"
        cta="Request ›"
      />

      <View style={styles.childCard}>
        <LinearGradient
          colors={childSavingsGradient}
          locations={childSavingsGradientStops}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.childRing} />
        <View style={styles.row}>
          <View style={styles.childIconTile}>
            <Text style={{ fontSize: 20 }}>🧸</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.childTitle}>Child savings</Text>
            <Text style={styles.childSubtitle}>2 children · 6'060'000₮ saved</Text>
          </View>
          <View style={styles.childCta}>
            <Text style={styles.childCtaText}>View ›</Text>
          </View>
        </View>
        <View style={[styles.row, { gap: 8 }]}>
          {childSavingsKids.map((k) => (
            <View key={k.name} style={styles.kidChip}>
              <View style={styles.kidAvatar}>
                <Text style={styles.kidInitial}>{k.initial}</Text>
              </View>
              <Text style={styles.kidName}>{k.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.tintCard, { borderColor: ap.gold.border }]}>
        <LinearGradient
          colors={ap.gold.grad}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.streakHeaderRow}>
          <View style={[styles.streakBadge, { flexShrink: 0 }]}>
            <Text style={{ fontSize: 22 }}>🔥</Text>
            <Text style={[styles.streakNum, { color: ap.gold.base }]}>47</Text>
            <Text style={[styles.streakLabel, { color: p.muted }]}>DAY STREAK</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.dailySaveTitle, { color: p.ink }]}>Daily saving · 10'000₮ a day</Text>
            <Text style={[styles.rowMeta, { color: p.muted }]}>
              Total saved 840'000₮ · ≈ 3'650'000₮/yr
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            testID="deposit_daily_saving_edit_button"
            style={[styles.editBtn, { backgroundColor: p.badgeBg, borderColor: p.hairline, flexShrink: 0 }]}
          >
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" testID="deposit_save_today_button" style={styles.streakCta}>
          <LinearGradient
            colors={Brand.knightKnobGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.streakCtaText, { color: Brand.onKnight }]}>Save today's 10'000₮</Text>
        </Pressable>
        <View style={[styles.row, { paddingTop: 2 }]}>
          <Text style={{ fontSize: 15 }}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.savingsGoalsTitle, { color: p.ink }]}>Savings goals</Text>
            <Text style={[styles.rowMeta, { color: p.muted }]}>3 goals · 22'350'000₮ saved</Text>
          </View>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 5l7 7-7 7"
              stroke={p.muted}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>

      {termDeposits.map((d) => (
        <View key={d.title} style={[styles.tintCard, { borderColor: ap.sky.border, gap: 10 }]}>
          <LinearGradient
            colors={ap.sky.grad}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.termTitle, { color: p.ink }]}>{d.title}</Text>
              <Text style={[styles.rowMeta, { color: p.muted }]}>{d.matures}</Text>
            </View>
            <View style={[styles.ratePill, { borderColor: ap.ratePillBorder, backgroundColor: ap.ratePillBg }]}>
              <Text style={[styles.ratePillText, { color: ap.ratePillText }]}>{d.rate}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={[styles.principal, { color: p.ink }]}>{d.principal}</Text>
            <Text style={[styles.interest, { color: p.accentInk }]}>{d.interest}</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: ap.progressTrack }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${d.progress * 100}%`, backgroundColor: ap.progressFillSky },
              ]}
            />
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowMeta, { color: p.muted, flex: 1 }]}>{d.opened}</Text>
            <Pressable accessibilityRole="button" testID={`deposit_top_up_${d.title.toLowerCase().replace(/\s+/g, '_')}_button`} style={[styles.topUpBtn, { backgroundColor: p.badgeBg, borderColor: p.hairline }]}> 
              <Text style={[styles.topUpText, { color: p.ink }]}>＋ Top up</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Pressable accessibilityRole="button" testID="deposit_open_button" style={styles.openDepositBtn}>
        <LinearGradient
          colors={Brand.knightKnobGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.openDepositText, { color: Brand.onKnight }]}>＋ Open a deposit</Text>
      </Pressable>

      <View style={[styles.helperCard, { backgroundColor: p.surface, borderColor: p.hairline }]}>
        <Text style={[styles.helperText, { color: p.muted }]}>
          Best rate today is <Text style={{ fontFamily: Font.bold, color: p.ink }}>12.8%</Text> on a
          12-month term deposit. Interest is credited monthly to your Everyday account.
        </Text>
      </View>
    </View>
  );
}

const shadowBtn = {
  boxShadow: '0px 6px 20px rgba(0,0,0,0.35)',
} as const;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dailySaveTitle: { fontFamily: Font.semibold, fontSize: 14 },
  savingsGoalsTitle: { fontFamily: Font.semibold, fontSize: 13 },
  termTitle: { fontFamily: Font.semibold, fontSize: 14.5 },
  rowMeta: { fontFamily: Font.regular, fontSize: 12, marginTop: 2 },
  tintCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    gap: 12,
    overflow: 'hidden',
  },
  childCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16,24,40,0.1)',
    padding: 15,
    gap: 12,
    overflow: 'hidden',
  },
  childRing: {
    position: 'absolute',
    right: -25,
    top: -37,
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 16,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  childIconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childTitle: { fontFamily: Font.bold, fontSize: 15, color: '#FFFFFF' },
  childSubtitle: { fontFamily: Font.regular, fontSize: 11.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  childCta: {
    backgroundColor: 'rgba(0,0,0,0.26)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  childCtaText: { fontFamily: Font.semibold, fontWeight: '600', fontSize: 12.5, color: '#FFFFFF' },
  kidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingLeft: 5,
    paddingRight: 10,
  },
  kidAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kidInitial: { fontFamily: Font.extrabold, fontWeight: '800', fontSize: 10, color: '#FFFFFF' },
  kidName: { fontFamily: Font.semibold, fontWeight: '600', fontSize: 11, color: '#FFFFFF' },
  streakHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakBadge: { alignItems: 'center', width: 44 },
  streakNum: { fontFamily: Font.bold, fontWeight: '700', fontSize: 19, lineHeight: 22, textAlign: 'center' },
  streakLabel: { fontFamily: Font.bold, fontWeight: '700', fontSize: 9, letterSpacing: 0.4, textAlign: 'center' },
  editBtn: { borderRadius: 10, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12 },
  editBtnText: { fontFamily: Font.semibold, fontWeight: '600', fontSize: 11.5 },
  streakCta: {
    borderRadius: 14,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadowBtn,
  },
  streakCtaText: { fontFamily: Font.semibold, fontSize: 14 },
  ratePill: { borderRadius: 999, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12 },
  ratePillText: { fontFamily: Font.bold, fontSize: 12 },
  principal: { fontFamily: Font.bold, fontSize: 21, fontVariant: ['tabular-nums'] },
  interest: { fontFamily: Font.bold, fontSize: 13.5 },
  progressTrack: { height: 7.5, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 7.5, borderRadius: 4 },
  topUpBtn: { borderRadius: 999, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12 },
  topUpText: { fontFamily: Font.semibold, fontWeight: '600', fontSize: 11.5 },
  openDepositBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    overflow: 'hidden',
    ...shadowBtn,
  },
  openDepositText: { fontFamily: Font.semibold, fontSize: 15 },
  helperCard: { borderRadius: 20, borderWidth: 1, padding: 16 },
  helperText: { fontFamily: Font.regular, fontSize: 13, lineHeight: 19 },
});
