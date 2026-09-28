/**
 * Tab 2 — Accounts. Figma `14765:54878` ("IPhone 13 mini").
 *
 * A `#F0F1F3` page under a centred 56 navigation bar, a white 52 segmented
 * track 6 below it, and the tab's content 16 below that. The whole thing
 * scrolls as one — the frame is a single 812-tall composition with nothing
 * pinned — and the floating tab bar it sits under belongs to the tabs layout,
 * so the scroll content pads itself clear of it.
 *
 * The redesign only draws the Accounts tab. Deposits, Loans and Reward keep the
 * panels they already had and are rendered under the new chrome unchanged:
 * there is no frame for them, and inventing one would be the redesign this
 * project is told not to do. They are the obvious next three frames to ask for.
 *
 * The navigation bar's eye hides every balance on the screen. The design draws
 * only the shown state, but it draws the control, and hiding balances is what
 * that control means everywhere else in the app.
 */
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountsNavBar } from '@/components/rightbank/account/AccountsNavBar';
import { AccountsPanel } from '@/components/rightbank/account/AccountsPanel';
import { DepositsPanel } from '@/components/rightbank/account/DepositsPanel';
import { LoansPanel } from '@/components/rightbank/account/LoansPanel';
import { RewardPanel } from '@/components/rightbank/account/RewardPanel';
import { SegmentedTabs } from '@/components/rightbank/account/SegmentedTabs';
import { figmaAccounts as a } from '@/constants/rightbank-theme';
import { useAppMode } from '@/theme/app-mode';

type SubTab = 'accounts' | 'deposits' | 'loans' | 'reward';

/** Figma's own four labels, in its order. */
const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'deposits', label: 'Deposits' },
  { key: 'loans', label: 'Loans' },
  { key: 'reward', label: 'Reward' },
];

export default function AccountScreen() {
  const { mode } = useAppMode();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<SubTab>('accounts');
  const [hidden, setHidden] = useState(false);

  const t = a[mode];

  return (
    <View style={[styles.root, { backgroundColor: t.page }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} animated />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + a.nav.top,
          // Clear of the floating tab bar, which draws over this screen.
          paddingBottom: insets.bottom + 104,
        }}>
        <AccountsNavBar t={t} hidden={hidden} onToggleHidden={() => setHidden((h) => !h)} />

        <View style={[styles.pad, { marginTop: a.segment.top }]}>
          <SegmentedTabs mode={mode} options={SUB_TABS} active={tab} onChange={setTab} />
        </View>

        <View style={[styles.pad, { marginTop: a.list.top }]}>
          {tab === 'accounts' && <AccountsPanel mode={mode} hidden={hidden} />}
          {tab === 'deposits' && <DepositsPanel mode={mode} />}
          {tab === 'loans' && <LoansPanel mode={mode} />}
          {tab === 'reward' && <RewardPanel mode={mode} />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: a.list.side },
});
