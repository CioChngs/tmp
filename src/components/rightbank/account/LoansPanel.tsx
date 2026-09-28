import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { DarkToolCard } from '@/components/rightbank/account/DarkToolCard';
import { accountPalette, Font, homePalette, loans, type Mode } from '@/constants/rightbank-theme';

/** Reference `alarmK` pulse — the danger card's glow breathes on a 2.2s loop. */
function useAlarmPulse() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [t]);
  return useAnimatedStyle(() => ({ opacity: t.value }));
}

/**
 * Loans sub-tab. Reference order: CreditScore banner (dark) → "Upcoming
 * payments" section header + danger card (action needed, overdue badge) →
 * "Your loans" section header + loan rows (indigo tint, progress bar) →
 * "Check my loan offers" outline pill.
 */
export function LoansPanel({ mode }: { mode: Mode }) {
  const p = homePalette[mode];
  const ap = accountPalette[mode];
  const glowStyle = useAlarmPulse();

  return (
    <View style={{ gap: 12 }}>
      <DarkToolCard mode={mode} icon="📊" title="CreditScore" subtitle="by BurenScore · fee 3'000₮" cta="Check ›" />

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeader, { color: p.ink }]}>Upcoming payments</Text>
        <Text style={[styles.sectionMeta, { color: p.muted }]}>holidays 0/2 used</Text>
      </View>

      <View style={styles.dangerWrap}>
        {/* Sibling to the clipped card below (not a child) so its outward
            box-shadow can grow past the card edge on the `alarmK` pulse. */}
        <Animated.View pointerEvents="none" style={[styles.dangerGlow, glowStyle]} />
        <View style={[styles.dangerCard, { borderColor: ap.danger.border }]}>
          <LinearGradient
            colors={ap.danger.grad}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionNeeded, { color: ap.dangerText }]}>ACTION NEEDED</Text>
            <Text style={[styles.dangerAmount, { color: ap.dangerText }]}>
              2'327'250<Text style={styles.dangerDecimals}>.00</Text> ₮
            </Text>
            <Text style={[styles.dangerSub, { color: ap.dangerText }]}>3 payments</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View
              style={[
                styles.overdueBadge,
                { backgroundColor: ap.overdueBadgeBg, boxShadow: `0px 0px 14px ${ap.danger.base}D9` },
              ]}>
              <Text style={styles.overdueBadgeText}>1 OVERDUE</Text>
            </View>
            <Text style={[styles.dangerSub, { color: ap.dangerText }]}>257'250₮</Text>
          </View>
          <Text style={[styles.chevron, { color: ap.dangerText }]}>›</Text>
        </View>
      </View>

      <Text style={[styles.sectionHeader, { color: p.ink }]}>Your loans</Text>

      {loans.map((l) => (
        <View key={l.name} style={[styles.tintCard, { borderColor: ap.indigo.border }]}>
          <LinearGradient
            colors={ap.indigo.grad}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.row}>
            <Text style={{ fontSize: 20 }}>{l.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: p.ink }]}>{l.name}</Text>
              <Text style={[styles.rowMeta, { color: p.muted }]}>{l.rateLine}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.remaining, { color: p.ink }]}>{l.remaining}</Text>
              <Text style={[styles.remainingLabel, { color: p.muted }]}>remaining</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: ap.progressTrack }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${l.progress * 100}%`, backgroundColor: ap.progressFillIndigo },
              ]}
            />
          </View>
          <View style={styles.row}>
            <Text style={[styles.repaidPct, { color: p.muted, flex: 1 }]}>{l.repaidPct}</Text>
            <Text style={[styles.next, { color: p.ink }]}>{l.next}</Text>
          </View>
        </View>
      ))}

      <Pressable accessibilityRole="button" testID="loan_offers_button" style={[styles.offersBtn, { borderColor: p.hairline }]}> 
        <Text style={[styles.offersBtnText, { color: p.ink }]}>Check my loan offers</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontFamily: Font.semibold, fontWeight: '600', fontSize: 14.5 },
  rowMeta: { fontFamily: Font.regular, fontSize: 12, marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2 },
  sectionHeader: { fontFamily: Font.bold, fontWeight: '700', fontSize: 16.5, letterSpacing: -0.35 },
  sectionMeta: { fontFamily: Font.regular, fontSize: 12 },
  dangerWrap: { position: 'relative' },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    overflow: 'hidden',
    boxShadow: '0px 0px 0px 1px rgba(255,0,51,0.3), 0px 0px 16px rgba(255,0,51,0.32)',
  },
  /** Not clipped by `dangerCard`'s `overflow: hidden` — the `alarmK` glow
   * needs to bloom past the card edge, which a clipped child can't do. */
  dangerGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 20,
    boxShadow: '0px 0px 0px 1px rgba(255,0,51,0.65), 0px 0px 32px rgba(255,0,51,0.62)',
  },
  actionNeeded: { fontFamily: Font.bold, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.6 },
  dangerAmount: { fontFamily: Font.bold, fontSize: 22, fontWeight: '700', letterSpacing: -0.9, marginTop: 4, fontVariant: ['tabular-nums'] },
  dangerDecimals: { fontSize: 14 },
  dangerSub: { fontFamily: Font.semibold, fontSize: 12.5, fontWeight: '600', marginTop: 4 },
  overdueBadge: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 6 },
  overdueBadgeText: { fontFamily: Font.extrabold, fontWeight: '800', fontSize: 9, color: '#FFFFFF', letterSpacing: 0.3 },
  chevron: { fontSize: 20, fontFamily: Font.semibold, fontWeight: '600' },
  tintCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    gap: 12,
    overflow: 'hidden',
    boxShadow: '0px 2px 10px rgba(16,24,40,0.07)',
  },
  remaining: { fontFamily: Font.bold, fontWeight: '700', fontSize: 17, fontVariant: ['tabular-nums'] },
  remainingLabel: { fontFamily: Font.semibold, fontSize: 11, marginTop: 1 },
  progressTrack: { height: 7.5, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 7.5, borderRadius: 4 },
  repaidPct: { fontFamily: Font.semibold, fontSize: 12 },
  next: { fontFamily: Font.bold, fontWeight: '700', fontSize: 12.5 },
  offersBtn: { borderRadius: 14, borderWidth: 1, paddingVertical: 15, alignItems: 'center' },
  offersBtnText: { fontFamily: Font.semibold, fontWeight: '600', fontSize: 15 },
});
