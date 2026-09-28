import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    confirmBiometric,
    peekBiometricLogin,
    queryBiometricCapability,
    setBiometricLogin,
} from '@/auth/biometric-login';
import { useAuth } from '@/auth/session';
import { ListRow } from '@/components/rightbank/ListRow';
import { ProfileCard } from '@/components/rightbank/more/ProfileCard';
import { SectionCard } from '@/components/rightbank/SectionCard';
import { Switch } from '@/components/rightbank/Switch';
import { Font, homePalette } from '@/constants/rightbank-theme';
import { useAppMode } from '@/theme/app-mode';

/**
 * Tab 4 — More (`screen === 'more'`). Header "More / Profile, security and
 * app preferences." Grouped settings list: profile card, sign out, Security,
 * Limits, Preferences, Documents, Support, Legal, Bank admin (demo-only,
 * dashed card), footer version string. Reference scroll padding 60/18/110.
 */

const SIDE = 18;

export default function MoreScreen() {
  const { mode } = useAppMode();
  // The one setting on this screen that is real: the biometric opt-in sheet
  // promises "Тохиргоог хүссэн үедээ унтраах боломжтой" — you can turn it off
  // whenever you like — and this is the switch that has to honour that. The
  // other two below are still the reference's decorative defaults.
  const [faceId, setFaceId] = useState(peekBiometricLogin);
  const [twoFactor, setTwoFactor] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const insets = useSafeAreaInsets();
  const p = homePalette[mode];
  const { signOut } = useAuth();

  /**
   * Turning it on takes the same OS prompt the opt-in sheet takes, for the same
   * reason: the switch must not claim a sign-in this device would refuse. A
   * refusal leaves the switch where it was, because `faceId` is what draws it.
   * Turning it off is unconditional — a security setting you cannot leave is
   * not a setting.
   */
  const toggleFaceId = useCallback(async (on: boolean) => {
    if (!on) {
      setFaceId(false);
      await setBiometricLogin(false);
      return;
    }

    const capability = await queryBiometricCapability();
    if (!capability.available) return;
    if (!(await confirmBiometric(capability.label))) return;

    setFaceId(true);
    await setBiometricLogin(true);
  }, []);

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
        <View style={styles.pad}>
          <Text style={[styles.title, { color: p.ink }]}>More</Text>
          <Text style={[styles.subtitle, { color: p.muted }]}>
            Profile, security and app preferences.
          </Text>

          <ProfileCard mode={mode} />

          {/* No navigation call: clearing the session flips the root guard,
              which unmounts the whole `(app)` group and lands on the login
              screen. Nothing signed-in stays mounted behind it. */}
          <Pressable
            onPress={signOut}
            accessibilityRole="button"
            testID="more_sign_out_button"
            style={[styles.signOut, { borderColor: 'rgba(255,90,110,0.3)' }]}>
            <Text style={{ fontSize: 17 }}>🚪</Text>
            <Text style={styles.signOutText}>Sign out</Text>
            <Text style={styles.signOutChevron}>›</Text>
          </Pressable>

          <Text style={[styles.sectionTitle, { color: p.ink }]}>Security</Text>
          <SectionCard mode={mode}>
            <ListRow
              mode={mode}
              icon="🙂"
              title="Face ID / biometrics"
              subtitle="Required for payments and login"
              trailing={
                <Switch value={faceId} onValueChange={(on) => void toggleFaceId(on)} testID="more_face_id_switch" />
              }
            />
            <ListRow mode={mode} icon="🔢" title="Change passcode" chevron />
            <ListRow mode={mode} icon="📱" title="Trusted devices" subtitle="2 devices" chevron />
            <ListRow
              mode={mode}
              icon="🛡️"
              title="Two-factor authentication"
              subtitle="SMS + biometrics"
              trailing={<Switch value={twoFactor} onValueChange={setTwoFactor} testID="more_two_factor_switch" />}
            />
            <ListRow
              mode={mode}
              icon="🕘"
              title="Login history"
              subtitle="Last: today 08:02, Ulaanbaatar"
              chevron
              divider={false}
            />
          </SectionCard>

          <Text style={[styles.sectionTitle, { color: p.ink }]}>Limits</Text>
          <SectionCard mode={mode}>
            <ListRow
              mode={mode}
              icon="↗"
              title="Daily transfer limit"
              trailing={<Text style={[styles.limitValue, { color: p.ink }]}>20&apos;000&apos;000₮</Text>}
            />
            <ListRow
              mode={mode}
              icon="🌐"
              title="Interbank per transaction"
              trailing={<Text style={[styles.limitValue, { color: p.ink }]}>10&apos;000&apos;000₮</Text>}
            />
            <ListRow
              mode={mode}
              icon="✈️"
              title="Foreign currency limit"
              subtitle="Annual, per regulation"
              trailing={<Text style={[styles.limitValue, { color: p.ink }]}>$50&apos;000</Text>}
              divider={false}
            />
          </SectionCard>

          <Text style={[styles.sectionTitle, { color: p.ink }]}>Preferences</Text>
          <SectionCard mode={mode}>
            <ListRow
              mode={mode}
              icon="🖼"
              title="Login screen picture"
              subtitle="Use your own photo behind the login screen"
            />
            <ListRow
              mode={mode}
              icon="🎨"
              title="Appearance"
              subtitle="Light · Knight · High graphics"
              chevron
            />
            <ListRow
              mode={mode}
              icon="🔔"
              title="Notifications"
              subtitle="Payments, security, offers"
              trailing={<Switch value={notifications} onValueChange={setNotifications} testID="more_notifications_switch" />}
            />
            <ListRow mode={mode} icon="🔊" title="Sound & haptics" chevron />
            <ListRow
              mode={mode}
              icon="🌐"
              title="Language"
              subtitle="English"
              chevron
              divider={false}
            />
          </SectionCard>

          <Text style={[styles.sectionTitle, { color: p.ink }]}>Documents</Text>
          <SectionCard mode={mode}>
            <ListRow mode={mode} icon="🧾" title="Account statements" subtitle="PDF or CSV" chevron />
            <ListRow
              mode={mode}
              icon="📄"
              title="Account certificate"
              subtitle="For visas and employers"
              chevron
            />
            <ListRow mode={mode} icon="🧮" title="Tax summary 2026" chevron divider={false} />
          </SectionCard>

          <Text style={[styles.sectionTitle, { color: p.ink }]}>Support</Text>
          <SectionCard mode={mode}>
            <ListRow
              mode={mode}
              icon="💬"
              title="Chat with us"
              subtitle="Usually replies in 2 minutes"
              chevron
            />
            <ListRow mode={mode} icon="📞" title="Call 24/7" subtitle="+976 7000 1234" chevron />
            <ListRow mode={mode} icon="📍" title="Branches & ATMs" chevron />
            <ListRow mode={mode} icon="❓" title="Help centre" chevron divider={false} />
          </SectionCard>

          <Text style={[styles.sectionTitle, { color: p.ink }]}>Legal</Text>
          <SectionCard mode={mode}>
            <ListRow mode={mode} icon="📘" title="Terms and conditions" chevron />
            <ListRow mode={mode} icon="🔐" title="Privacy policy" chevron />
            <ListRow
              mode={mode}
              icon="🏛"
              title="Deposit insurance"
              subtitle="Protected up to 20'000'000₮"
              chevron
              divider={false}
            />
          </SectionCard>

          <Text style={[styles.sectionTitle, styles.adminTitle, { color: p.ink }]}>Bank admin</Text>
          <Text style={[styles.adminSubtitle, { color: p.muted }]}>
            Back office. Not shipped to customers.
          </Text>
          <SectionCard mode={mode} style={styles.dashedCard}>
            <ListRow
              mode={mode}
              icon="🏛"
              title="Reward configuration"
              subtitle="Margin share 5% · SWIFT 10% · card 0.1%"
              chevron
              divider={false}
            />
          </SectionCard>

          <Text style={[styles.footer, { color: p.muted }]}>
            RightBank · version 3.2.0 (prototype)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: SIDE },
  title: { fontFamily: Font.bold, fontWeight: '700', fontSize: 25, letterSpacing: -0.9 },
  subtitle: { fontFamily: Font.regular, fontWeight: '400', fontSize: 12.5, marginTop: 3 },

  signOut: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    padding: 13,
    shadowColor: 'rgba(16,24,40,1)',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  signOutText: { flex: 1, fontFamily: Font.bold, fontWeight: '700', fontSize: 14, color: '#FF7D93' },
  signOutChevron: { fontFamily: Font.regular, fontWeight: '400', fontSize: 16, color: '#FF7D93' },

  sectionTitle: {
    fontFamily: Font.bold,
    fontWeight: '700',
    fontSize: 16.5,
    letterSpacing: -0.35,
    marginTop: 22,
    marginBottom: 10,
  },
  adminTitle: { marginBottom: 0 },
  adminSubtitle: {
    fontFamily: Font.regular,
    fontWeight: '400',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 16.8,
  },
  dashedCard: { borderStyle: 'dashed' },

  limitValue: { fontFamily: Font.bold, fontWeight: '700', fontSize: 13.5 },

  footer: { fontFamily: Font.regular, fontWeight: '400', fontSize: 11, textAlign: 'center', marginTop: 16 },
});
