import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, faceIdPalette, Font, homePalette, type Mode } from '@/constants/rightbank-theme';

/**
 * Full-screen security interstitial shown once after login (reference `r2`).
 * Mixed Mongolian/English copy + reference `Di` data block, reproduced verbatim.
 *
 * Rendered by `(app)/_layout.tsx`, above the tab navigator — not by a tab
 * screen. The floating tab bar is the navigator's `tabBar` and is therefore a
 * sibling of the screen container, so no `zIndex` from inside a screen can
 * cover it. This has to sit one level higher in the tree.
 */

const NOTICE = {
  date: '3 Aug 2026',
  ref: 'SEC-2026-08-03',
  title: 'Кодоо хэн нэгэнд бүү хэлээрэй · Never share your code',
  lead: 'Fraudsters are calling RightBank customers, claiming to be our staff or the police, and talking them into moving money or reading out SMS codes.',
  rules: [
    {
      icon: '🚫',
      t: 'We never ask for codes',
      s: 'No RightBank employee will ever ask for an SMS code, your PIN or your password — not by phone, SMS, email or chat.',
    },
    {
      icon: '🏦',
      t: 'There is no "safe account"',
      s: 'If anyone tells you to move your money to a safe or reserve account, it is a fraud. Always.',
    },
    {
      icon: '📱',
      t: 'Never install apps for a caller',
      s: 'Remote-access apps hand your phone to the caller. We will never ask you to install one.',
    },
    {
      icon: '⏱',
      t: 'Pressure is the warning sign',
      s: 'Real bank staff never rush you, never threaten arrest, and never keep you on the line while you pay.',
    },
  ],
  action: 'If a call feels wrong, hang up and call us on 7000 1234 — the number on the back of your card.',
} as const;

// ve = {neon:"#FF0033", hot:"#FF3B5C", rgb:"255,0,51"}
const DANGER = { neon: '#FF0033', hot: '#FF3B5C', rgb: '255,0,51' } as const;

type Props = {
  mode: Mode;
  onClose: () => void;
};

export function SecurityWarningModal({ mode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const fp = faceIdPalette[mode];
  const hp = homePalette[mode];

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={[
        styles.scrim,
        // The card is tall enough to reach both system bars on a short screen,
        // and it covers the whole window, so the reference's 14 becomes a
        // floor rather than the value: whichever is larger, the inset or 14.
        { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 14) },
      ]}>
      {/* reference: `backdrop-filter: blur(4px)` under `rgba(3,5,10,0.86)`.
          The blur has to be a sibling *behind* the tint rather than a parent
          with a background, because BlurView samples what is drawn behind it —
          given its own opaque-ish background it would blur that instead. */}
      <BlurView
        intensity={80}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.tint]} />

      <Animated.View
        entering={ZoomIn.duration(220)}
        style={[
          styles.card,
          {
            backgroundColor: fp.cardBg[1],
            borderColor: `rgba(${DANGER.rgb},0.5)`,
          },
        ]}>
        <LinearGradient
          colors={fp.cardBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[DANGER.neon, DANGER.hot]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.8 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>⚠</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>SECURITY WARNING</Text>
            <Text style={styles.headerSub}>
              RightBank Security · {NOTICE.date} · {NOTICE.ref}
            </Text>
          </View>
        </View>

        {/* body */}
        <View style={styles.body}>
          <Text style={[styles.title, { color: fp.title }]}>{NOTICE.title}</Text>
          <Text style={[styles.lead, { color: fp.dim }]}>{NOTICE.lead}</Text>

          <View style={[styles.rules, { borderTopColor: hp.hairline }]}>
            {NOTICE.rules.map((rule, i) => (
              <View
                key={rule.t}
                style={[
                  styles.rule,
                  i < NOTICE.rules.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth + 0.5,
                    borderBottomColor: hp.hairline,
                  },
                ]}>
                <Text style={styles.ruleIcon}>{rule.icon}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.ruleTitle, { color: fp.title }]}>{rule.t}</Text>
                  <Text style={[styles.ruleSub, { color: fp.dim }]}>{rule.s}</Text>
                </View>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.action,
              {
                backgroundColor: `rgba(${DANGER.rgb},0.10)`,
                borderColor: `rgba(${DANGER.rgb},0.4)`,
              },
            ]}>
            <Text style={styles.actionIcon}>☎</Text>
            <Text style={[styles.actionText, { color: fp.title }]}>{NOTICE.action}</Text>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.gotIt, pressed && styles.pressed]}>
            <LinearGradient
              colors={Brand.knightKnobGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.gotItText, { color: Brand.onKnight }]}>Got it</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14, // reference scrim padding
  },
  tint: { backgroundColor: 'rgba(3,5,10,0.86)' },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    // reference: 0 24px 70px rgba(0,0,0,.65) + 0 0 34px rgba(255,0,51,.35);
    // RN allows one shadow per view — keep the dominant dark drop.
    shadowColor: '#000000',
    shadowOpacity: 0.65,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 24 },
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerIconText: { fontSize: 18, color: '#FFFFFF' },
  headerTitle: {
    fontFamily: Font.extrabold,
    fontSize: 15,
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: Font.regular,
    fontSize: 11,
    marginTop: 2,
    opacity: 0.9,
    color: '#FFFFFF',
  },
  body: {
    paddingTop: 13,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 15.5,
    lineHeight: 19.8,
    letterSpacing: -0.3,
  },
  lead: {
    fontFamily: Font.regular,
    fontSize: 12.5,
    marginTop: 6,
    lineHeight: 18.75,
  },
  rules: {
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth + 0.5,
  },
  rule: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
  },
  ruleIcon: { fontSize: 16, lineHeight: 19, flexShrink: 0 },
  ruleTitle: { fontFamily: Font.bold, fontSize: 13 },
  ruleSub: { fontFamily: Font.regular, fontSize: 11.5, marginTop: 2, lineHeight: 16.7 },
  action: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 11,
    borderWidth: 1,
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  actionIcon: { fontSize: 15, lineHeight: 18 },
  actionText: { flex: 1, fontFamily: Font.regular, fontSize: 12, lineHeight: 17.4 },
  gotIt: {
    width: '100%',
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pressed: { opacity: 0.85 },
  gotItText: { fontFamily: Font.semibold, fontSize: 15 },
});
