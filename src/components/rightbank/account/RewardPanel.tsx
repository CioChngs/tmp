import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import {
  accountPalette,
  Font,
  homePalette,
  platinumGold,
  rewardAppRows,
  rewardBenefits,
  rewardEarnRows,
  rewardFeeRows,
  rewardSpendRows,
  type Mode,
} from '@/constants/rightbank-theme';

type EarnRow = { icon: string; title: string; meta: string; amount: string; of: string };

function EarnListCard({ mode, rows }: { mode: Mode; rows: readonly EarnRow[] }) {
  const p = homePalette[mode];
  return (
    <View style={[styles.listCard, { backgroundColor: p.surface, borderColor: p.hairline }]}>
      {rows.map((r, i) => (
        <View
          key={r.title}
          style={[styles.earnRow, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: p.hairline }]}>
          <View style={[styles.badge, { backgroundColor: p.badgeBg }]}>
            <Text style={{ fontSize: 17 }}>{r.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.listRowTitle, { color: p.ink }]}>{r.title}</Text>
            <Text style={[styles.rowMeta, { color: p.muted }]}>{r.meta}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.amount, { color: r.amount.startsWith('+') ? p.accentInk : p.muted }]}>
              {r.amount}
            </Text>
            {!!r.of && <Text style={[styles.ofText, { color: p.muted }]}>{r.of}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Reward sub-tab — points hero (dark gradient + ring + PLATINUM pill),
 * "Earned this month" (mint tint + 3 stat tiles), itemised earn breakdown
 * (balances / fees / app-use, each its own list card), "Spend your points"
 * list, "Your benefits" list, closing "How you earn" essay card.
 */
export function RewardPanel({ mode }: { mode: Mode }) {
  const p = homePalette[mode];
  const ap = accountPalette[mode];

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.heroCard}>
        <LinearGradient
          colors={p.darkGradient}
          locations={p.darkGradientStops}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroRing} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>YOUR POINTS</Text>
            <Text style={styles.heroPoints}>340'229</Text>
            <Text style={styles.heroWorth}>worth 340'229₮</Text>
          </View>
          <View style={styles.platinumPill}>
            <Text style={styles.platinumText}>PLATINUM</Text>
          </View>
        </View>
        <View style={styles.heroTrack}>
          <View style={styles.heroFill} />
        </View>
        <Text style={styles.heroFooter}>Top tier · 10% bonus on every point</Text>
      </View>

      <View style={[styles.tintCard, { borderColor: ap.mint.border }]}>
        <LinearGradient
          colors={ap.mint.grad}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.row}>
          <Text style={{ fontSize: 20 }}>📈</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: p.ink }]}>Earned this month</Text>
            <Text style={[styles.rowMeta, { color: p.muted }]}>
              You contributed 5'990'771₮ to the bank in August
            </Text>
          </View>
          <Text style={[styles.earnedAmount, { color: p.ink }]}>+333'389</Text>
        </View>
        <View style={[styles.platBonusStrip, { backgroundColor: p.badgeBg, borderColor: p.hairline }]}>
          <Text style={{ fontSize: 14 }}>🎖</Text>
          <Text style={[styles.platBonusText, { color: p.ink, flex: 1 }]}>
            Platinum bonus · 10% on 303'081 points
          </Text>
          <Text style={[styles.platBonusText, { color: p.ink }]}>+30'308</Text>
        </View>
        <View style={styles.row}>
          {[
            { label: 'BALANCES', value: "296'797" },
            { label: 'FEES', value: "5'484" },
            { label: 'APP USE', value: '800' },
          ].map((s) => (
            <View key={s.label} style={[styles.statTile, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
              <Text style={[styles.statLabel, { color: p.muted }]}>{s.label}</Text>
              <Text style={[styles.statValue, { color: p.ink }]}>{s.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionHeader, { color: p.ink }]}>From balances you hold</Text>
        <Text style={[styles.sectionSub, { color: p.muted }]}>
          The bank earns a margin on this money every year, and 5% of it comes back to you, worked
          out monthly.
        </Text>
      </View>
      <EarnListCard mode={mode} rows={rewardEarnRows} />

      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionHeader, { color: p.ink }]}>From fees you pay us</Text>
        <Text style={[styles.sectionSub, { color: p.muted }]}>
          10% of the fee the bank actually keeps — foreign bank charges are taken off first.
        </Text>
      </View>
      <EarnListCard mode={mode} rows={rewardFeeRows} />

      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionHeader, { color: p.ink }]}>For using the app</Text>
        <Text style={[styles.sectionSub, { color: p.muted }]}>
          The bank earns nothing on these. Points are paid to move the traffic into the app.
        </Text>
      </View>
      <EarnListCard mode={mode} rows={rewardAppRows} />

      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionHeader, { color: p.ink }]}>Spend your points</Text>
        <Text style={[styles.sectionSub, { color: p.muted }]}>
          340'229 points available · 1 point = 1₮
        </Text>
      </View>
      <View style={[styles.listCard, { backgroundColor: p.surface, borderColor: p.hairline }]}>
        {rewardSpendRows.map((r, i) => (
          <View
            key={r.title}
            style={[
              styles.earnRow,
              i < rewardSpendRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: p.hairline },
            ]}>
            <View style={[styles.badge, { backgroundColor: p.badgeBg }]}>
              <Text style={{ fontSize: 17 }}>{r.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.listRowTitle, { color: p.ink }]}>{r.title}</Text>
              <Text style={[styles.rowMeta, { color: p.muted }]}>{r.meta}</Text>
            </View>
            <Text style={[styles.amount, { color: p.ink }]}>{r.points}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionHeader, { color: p.ink }]}>Your benefits</Text>
        <Text style={[styles.sectionSub, { color: p.muted }]}>What your tier unlocks today.</Text>
      </View>
      <View style={[styles.listCard, { backgroundColor: p.surface, borderColor: p.hairline }]}>
        {rewardBenefits.map((b, i) => (
          <View
            key={b.title}
            style={[
              styles.earnRow,
              i < rewardBenefits.length - 1 && { borderBottomWidth: 1, borderBottomColor: p.hairline },
            ]}>
            <View style={[styles.badge, { backgroundColor: p.badgeBg }]}>
              <Text style={{ fontSize: 17 }}>{b.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.listRowTitle, { color: p.ink }]}>{b.title}</Text>
              <Text style={[styles.rowMeta, { color: p.muted }]}>{b.meta}</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: p.badgeBg, opacity: b.status === 'ACTIVE' ? 1 : 0.6 },
              ]}>
              <Text style={[styles.statusPillText, { color: p.ink }]}>{b.status}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionHeader, { color: p.ink }]}>How you earn</Text>
      </View>
      <View style={[styles.essayCard, { backgroundColor: p.surface, borderColor: p.hairline }]}>
        <Text style={[styles.essayText, { color: p.muted }]}>
          Points follow what your banking is worth to us. On money you hold with us the bank earns
          a margin every year — 7% on a tugrik current account, 1% on a foreign-currency one, 1% on
          deposits, 2% on child savings — and 5% of that comes back to you, worked out monthly. On
          fees you pay us the share is 10%, calculated after the foreign banks take theirs. Loans
          earn on the months you pay on time; paying early settles the debt but does not earn
          points. Your tier follows what the relationship is worth over a year — 71'889'258₮ at the
          moment — and adds 10% to everything you earn. All rates are set by the bank and reviewed
          monthly.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontFamily: Font.bold, fontSize: 14 },
  listRowTitle: { fontFamily: Font.semibold, fontSize: 14.5 },
  rowMeta: { fontFamily: Font.regular, fontSize: 12, marginTop: 2 },
  sectionWrap: { marginTop: 10 },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16,24,40,0.1)',
    padding: 16,
    gap: 12,
    overflow: 'hidden',
  },
  heroRing: {
    position: 'absolute',
    right: -20,
    top: -35,
    width: 162,
    height: 162,
    borderRadius: 81,
    borderWidth: 16,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroLabel: { fontFamily: Font.bold, fontSize: 10.5, letterSpacing: 0.6, color: 'rgba(255,255,255,0.7)' },
  heroPoints: { fontFamily: Font.extrabold, fontSize: 30, letterSpacing: -1, color: '#FFFFFF', marginTop: 4 },
  heroWorth: { fontFamily: Font.regular, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  platinumPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: platinumGold,
    backgroundColor: 'rgba(0,0,0,0.26)',
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  platinumText: { fontFamily: Font.bold, fontSize: 11.5, letterSpacing: 0.4, color: platinumGold },
  heroTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  heroFill: { height: 6, borderRadius: 3, width: '100%', backgroundColor: '#FFFFFF' },
  heroFooter: { fontFamily: Font.regular, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  tintCard: { borderRadius: 20, borderWidth: 1, padding: 15, gap: 12, overflow: 'hidden' },
  earnedAmount: { fontFamily: Font.bold, fontSize: 19, fontVariant: ['tabular-nums'] },
  platBonusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  platBonusText: { fontFamily: Font.semibold, fontSize: 12 },
  statTile: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 10, gap: 4 },
  statLabel: { fontFamily: Font.bold, fontSize: 10, letterSpacing: 0.3 },
  statValue: { fontFamily: Font.bold, fontSize: 13.5 },
  sectionHeader: { fontFamily: Font.bold, fontSize: 16.5, letterSpacing: -0.35 },
  sectionSub: { fontFamily: Font.regular, fontSize: 12.5, marginTop: 4, lineHeight: 17 },
  listCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 2,
    boxShadow: '0px 2px 10px rgba(16,24,40,0.07)',
  },
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  badge: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  amount: { fontFamily: Font.bold, fontSize: 14 },
  ofText: { fontFamily: Font.regular, fontSize: 11, marginTop: 2 },
  statusPill: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  statusPillText: { fontFamily: Font.bold, fontSize: 10.5, letterSpacing: 0.3 },
  essayCard: { borderRadius: 20, borderWidth: 1, padding: 16 },
  essayText: { fontFamily: Font.regular, fontSize: 13, lineHeight: 20 },
});
