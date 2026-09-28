import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardCarousel } from '@/components/rightbank/card/CardCarousel';
import { EyeIcon } from '@/components/rightbank/EyeIcon';
import { ListRow } from '@/components/rightbank/ListRow';
import { MaskedDigits } from '@/components/rightbank/MaskedDigits';
import { SectionCard } from '@/components/rightbank/SectionCard';
import { Switch } from '@/components/rightbank/Switch';
import { cardTabPalette, Font, homePalette, type Mode } from '@/constants/rightbank-theme';
import { useAppMode } from '@/theme/app-mode';

/**
 * Tab 3 — Card (`screen === 'card'`). Header → card carousel → freeze/PIN/
 * linked-account card → renewal banner → Payment controls → Activity/holds
 * card → Card management card. The floating tab bar belongs to the tabs layout.
 * Reference scroll padding 60/0/110; section title margin `22 0 10`.
 */

const BALANCE = "987'654'321";

function MaskedBalance({ mode }: { mode: Mode }) {
  const p = homePalette[mode];
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.balanceRow}>
      <MaskedDigits
        value={`${BALANCE}₮`}
        hidden={hidden}
        textStyle={styles.balanceText}
        color={p.ink}
      />
      <Pressable
        onPress={() => setHidden((h) => !h)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
        testID="card_balance_visibility_button"
        style={[styles.eyeToggle, { backgroundColor: p.badgeBg, borderColor: p.hairline }]}>
        {/* Reference "Show balance" button: masked → plain eye, revealed →
            slashed eye — the same inverted convention as the card reveal. */}
        <EyeIcon off={!hidden} size={14} color={p.muted} />
      </Pressable>
    </View>
  );
}

export default function CardScreen() {
  const { mode } = useAppMode();
  const insets = useSafeAreaInsets();
  const p = homePalette[mode];
  const cp = cardTabPalette[mode];

  const [frozen, setFrozen] = useState(false);
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [atmWithdrawals, setAtmWithdrawals] = useState(true);
  const [paymentsAbroad, setPaymentsAbroad] = useState(true);

  return (
    <View style={[styles.root, { backgroundColor: p.pageGradient[0] }]}>
      <LinearGradient
        colors={p.pageGradient}
        locations={p.pageGradientStops}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} animated />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 104,
        }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: cp.pageTitle }]}>Cards</Text>
            <Text style={[styles.subtitle, { color: p.muted }]}>Freeze, PIN and card details.</Text>
          </View>
          <Pressable accessibilityRole="button" testID="card_new_card_button" style={[styles.newCardBtn, { backgroundColor: cp.newCardBg, borderColor: cp.newCardBorder }]}> 
            <Text style={[styles.newCardText, { color: cp.pageTitle }]}>＋ New card</Text>
          </Pressable>
        </View>

        <CardCarousel mode={mode} />

        <View style={styles.pad}>
          <SectionCard mode={mode} style={{ marginTop: 10 }}>
            <ListRow
              mode={mode}
              icon="❄️"
              title="Freeze card"
              subtitle="Instantly block all payments"
              trailing={<Switch value={frozen} onValueChange={setFrozen} testID="card_freeze_switch" />}
            />
            <ListRow
              mode={mode}
              icon="🔢"
              title="Get a new PIN"
              subtitle="PIN and I-PIN reissued · 1'000₮"
              chevron
            />
            <ListRow
              mode={mode}
              icon="💼"
              title="5000 000 000"
              subtitle="Linked account"
              trailing={<MaskedBalance mode={mode} />}
              divider={false}
            />
          </SectionCard>

          <View
            style={[
              styles.banner,
              { backgroundColor: cp.amberBg, borderColor: cp.amberBorder },
            ]}>
            <View style={styles.bannerHead}>
              <Text style={{ fontSize: 20 }}>⏳</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: p.ink }]}>Expires this month</Text>
                <Text style={[styles.bannerSub, { color: p.muted }]}>08/26 — 28 days left · 31 Aug</Text>
              </View>
            </View>
            <View style={[styles.robotRow, { backgroundColor: p.badgeBg, borderColor: p.hairline }]}>
              <Text style={{ fontSize: 13, lineHeight: 15.6 }}>🤖</Text>
              <Text style={[styles.robotText, { color: p.muted }]}>
                You use this card regularly, so the card office prepares the renewal automatically 30
                days ahead. You only choose how to receive it.
              </Text>
            </View>
            <Pressable accessibilityRole="button" testID="card_choose_delivery_button" style={styles.deliveryBtn}>
              <LinearGradient
                colors={['#5E6E88', '#9DB0CB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.deliveryText}>Choose delivery</Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionTitle, { color: p.ink }]}>Payment controls</Text>
          <SectionCard mode={mode}>
            <ListRow
              mode={mode}
              icon="🌐"
              title="Online payments"
              subtitle="E-commerce and subscriptions"
              trailing={<Switch value={onlinePayments} onValueChange={setOnlinePayments} testID="card_online_payments_switch" />}
            />
            <ListRow
              mode={mode}
              icon="🏧"
              title="ATM withdrawals"
              subtitle="Cash from any ATM"
              trailing={<Switch value={atmWithdrawals} onValueChange={setAtmWithdrawals} testID="card_atm_withdrawals_switch" />}
            />
            <ListRow
              mode={mode}
              icon="✈️"
              title="Payments abroad"
              subtitle="Foreign merchants and ATMs"
              trailing={<Switch value={paymentsAbroad} onValueChange={setPaymentsAbroad} testID="card_payments_abroad_switch" />}
              divider={false}
            />
          </SectionCard>

          <SectionCard mode={mode} style={{ marginTop: 14 }}>
            <ListRow
              mode={mode}
              icon="📃"
              title="Activity"
              subtitle="Cafe Amar · Today · 08:41"
              trailing={<Text style={[styles.countText, { color: p.muted }]}>3</Text>}
              chevron
            />
            <ListRow
              mode={mode}
              icon="⏳"
              title="Authorisation holds"
              subtitle="Released within 30 days"
              trailing={
                <View style={styles.holdsTrailing}>
                  <Text style={[styles.holdsAmount, { color: p.ink }]}>484&apos;200₮</Text>
                  <View style={[styles.countBadge, { backgroundColor: cp.amberBg, borderColor: cp.amberBorder }]}>
                    <Text style={[styles.countBadgeText, { color: cp.amberText }]}>3</Text>
                  </View>
                </View>
              }
              divider={false}
            />
          </SectionCard>

          <Text style={[styles.sectionTitle, { color: p.ink }]}>Card management</Text>
          <SectionCard mode={mode}>
            <ListRow
              mode={mode}
              icon="📲"
              title="Add to digital wallet"
              subtitle="Provisioning needs a one-time code"
              trailing={
                <Pressable accessibilityRole="button" testID="card_add_to_wallet_button" style={[styles.walletBtn, { backgroundColor: cp.walletBtnBg }]}> 
                  <View style={[styles.walletMark, { borderColor: cp.dashedBorder }]}>
                    <Text style={styles.walletMarkText}>MARK</Text>
                  </View>
                  <Text style={[styles.walletBtnText, { color: cp.walletBtnText }]}>Add to Wallet</Text>
                </Pressable>
              }
            />
            <ListRow mode={mode} icon="🔁" title="Replace card" subtitle="Damaged, or renew before it expires" />
            <ListRow mode={mode} icon="📦" title="Track my card" subtitle="No order in progress" chevron />
            <ListRow
              mode={mode}
              icon="🚨"
              title="Report lost or stolen"
              subtitle="Blocks the card permanently"
              chevron
              danger
              iconBg={cp.dangerBg}
            />
            <ListRow
              mode={mode}
              icon="🗑"
              title="Close card"
              subtitle="Permanent · Face ID and code required"
              chevron
              danger
              iconBg={cp.dangerBg}
              divider={false}
            />
          </SectionCard>
        </View>
      </ScrollView>
    </View>
  );
}

const SIDE = 18;

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: SIDE },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIDE },
  title: { fontFamily: Font.bold, fontSize: 25, letterSpacing: -0.9 },
  subtitle: { fontFamily: Font.regular, fontSize: 12.5, marginTop: 3 },
  newCardBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 13 },
  newCardText: { fontFamily: Font.semibold, fontSize: 12.5 },

  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  balanceText: { fontFamily: Font.bold, fontSize: 13.5, letterSpacing: 0.5 },
  eyeToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  banner: { borderRadius: 20, borderWidth: 1, padding: 13, paddingHorizontal: 15, marginTop: 12 },
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  bannerTitle: { fontFamily: Font.bold, fontSize: 13.5 },
  bannerSub: { fontFamily: Font.regular, fontSize: 11.5, marginTop: 2 },
  robotRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 11,
    borderWidth: 1,
    borderRadius: 12,
    padding: 9,
    paddingHorizontal: 11,
  },
  robotText: { flex: 1, fontFamily: Font.regular, fontSize: 11, lineHeight: 16.5 },
  deliveryBtn: {
    marginTop: 11,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  deliveryText: { fontFamily: Font.semibold, fontSize: 15, color: '#0A0F18' },

  sectionTitle: { fontFamily: Font.bold, fontSize: 16.5, letterSpacing: -0.35, marginTop: 22, marginBottom: 10 },

  countText: { fontFamily: Font.regular, fontSize: 12 },
  holdsTrailing: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  holdsAmount: { fontFamily: Font.bold, fontSize: 13 },
  countBadge: { borderWidth: 1, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 },
  countBadgeText: { fontFamily: Font.extrabold, fontSize: 9.5 },

  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  walletMark: {
    height: 15,
    minWidth: 30,
    borderRadius: 3,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  walletMarkText: { fontFamily: Font.extrabold, fontSize: 7.5, letterSpacing: 0.3, color: '#FFFFFF' },
  walletBtnText: { fontFamily: Font.bold, fontSize: 11.5 },
});
