import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import {
    confirmBiometric,
    peekBiometricLogin,
    queryBiometricCapability,
    setBiometricLogin,
    type BiometricCapability,
} from '@/auth/biometric-login';
import { FACE_ID_MARK } from '@/components/rightbank/biometric-art';
import { GaussianBlob } from '@/components/rightbank/GaussianBlob';
import {
    biometricCopy,
    cssGradientAngle,
    faceIdPalette,
    Font,
    loginPalette,
    biometricSheet as s,
    type Mode,
} from '@/constants/rightbank-theme';

/**
 * "Face ID-аар нэвтрэх үү?" — the offer to turn biometric sign-in on, shown once
 * after a successful login. Figma `15726:76357`.
 *
 * ## When it appears
 *
 * Mounted by `(app)/_layout.tsx`, a sibling of the tab navigator, so it can
 * cover any signed-in screen — including the floating tab bar, which is the
 * navigator's own `tabBar` and cannot be covered from inside a tab. Because that
 * layout only exists inside the `(app)` group, the sheet structurally cannot
 * appear on an auth screen: the root guard unmounts the whole group the moment
 * the session ends.
 *
 * It is armed by `askBiometric`, which sign-in sets and nothing else does, and
 * it waits for the security interstitial to be dismissed first — two sheets over
 * each other would be a pile, not a sequence.
 *
 * ## When it does not
 *
 * Two suppressions, and only two:
 *
 *  - biometric login is already on;
 *  - the device has no biometric hardware, or has some but with nothing
 *    enrolled — an unenrolled sensor would let us switch on a sign-in that can
 *    never succeed.
 *
 * Both are decided here rather than by the caller, so there is one place that
 * knows the rule. Until the answer is in, this renders nothing; if the answer is
 * "don't ask", it reports done and never paints.
 *
 * "Одоо биш" is a decline for *this* login, not forever: the sheet comes back on
 * the next one. That is the spec as given — the only two reasons to stay away
 * are the two above.
 */
export function BiometricOptInSheet({
  mode,
  onDone,
}: {
  mode: Mode;
  /** Called once the offer has been answered, declined, or ruled out. */
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  /** An OS prompt is on screen; a second one would stack behind the first. */
  const [busy, setBusy] = useState(false);
  const settled = useRef(false);

  /** Answers the offer exactly once, whichever route got here first. */
  const finish = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (peekBiometricLogin()) {
        if (__DEV__) console.log('[biometric opt-in] skipped: already enabled');
        finish();
        return;
      }

      const found = await queryBiometricCapability();
      if (cancelled) return;

      // A suppression is indistinguishable from a bug from the outside — the
      // sheet simply does not appear — so the reason is logged. Both halves are
      // reported because "no biometrics" on an emulator almost always means
      // hardware present with nothing enrolled, which is a setup step, not a
      // device limit.
      if (__DEV__) {
        console.log(
          `[biometric opt-in] ${found.available ? 'asking' : 'skipped'}:`,
          `hardware=${found.hasHardware} enrolled=${found.enrolled} label=${found.label}`
        );
      }

      if (!found.available) finish();
      else setCapability(found);
    })().catch((error: unknown) => {
      if (__DEV__) console.log('[biometric opt-in] skipped: capability check threw', error);
      if (!cancelled) finish();
    });

    return () => {
      cancelled = true;
    };
  }, [finish]);

  const accept = useCallback(async () => {
    if (!capability || busy || settled.current) return;
    setBusy(true);

    // The OS prompt is the confirmation. Enabling biometric sign-in on the
    // strength of a tap alone would promise a returning user a face scan that
    // this device may refuse — better to find that out now than at the next
    // login, with the password form gone.
    const confirmed = await confirmBiometric(capability.label);

    // Declining is never blocked while the prompt is up, so the answer can be
    // stale by the time it arrives. Enabling a setting the user has just said no
    // to would be worse than losing a confirmation they no longer want.
    if (settled.current) return;

    if (confirmed) {
      await setBiometricLogin(true);
      finish();
    } else {
      // Cancelled or failed: leave the sheet up rather than giving up on the
      // user's behalf. "Одоо биш" is right there.
      setBusy(false);
    }
  }, [busy, capability, finish]);

  if (!capability) return null;

  const label = capability.label;
  /**
   * Figma measures from the bottom of a 375 × 812 iPhone 13 mini, whose home
   * indicator is 34. A deeper inset moves the sheet's bottom-anchored row down
   * with it and grows the sheet to match, so the 6 Figma left between the
   * buttons and the indicator survives; at exactly 34 every number is Figma's.
   */
  const lift = Math.max(0, insets.bottom - s.referenceSafeBottom);
  /**
   * The primary button's real width. `expo-linear-gradient` takes start/end as
   * fractions of the box, so 135.94° only comes out right if the conversion is
   * given the box it will actually be drawn in — 165 on Figma's 375 board, more
   * on anything wider.
   */
  const buttonWidth = (width - s.gutter * 2 - s.buttonGap) / 2;

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={styles.scrim}>
      {/* Tapping the darkened app behind the sheet is a decline. The grabber at
          the top says the same thing; a real drag-to-dismiss gesture is not
          implemented, and is not in the design either.

          Declining stays available even mid-prompt: a sheet whose only exits are
          behind an await is a sheet that can trap someone. */}
      <Pressable
        accessible={false}
        onPress={finish}
        style={[StyleSheet.absoluteFill, { backgroundColor: faceIdPalette[mode].scrim }]}
      />

      <Animated.View
        entering={SlideInDown.duration(260)}
        exiting={SlideOutDown.duration(180)}
        style={[styles.sheet, { height: s.height + lift }]}>
        <View style={styles.grabber} />

        <View style={styles.content}>
          <View style={styles.mark}>
            <SvgXml xml={FACE_ID_MARK} width={s.markArt} height={s.markArt} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{biometricCopy.title.replace('{label}', label)}</Text>
            <Text style={styles.body}>
              {biometricCopy.body.replaceAll('{label}', label)}
            </Text>
          </View>
        </View>

        {/* Both buttons are 165 in a 343 row with 13 between them. Held as
            `flex: 1` around the designed gap rather than as two fixed widths, so
            a screen wider than Figma's 375 grows the buttons instead of the void
            between them — see migration-progress.md §24.5. */}
        <View style={[styles.buttons, { bottom: s.buttonsBottom + lift }]}>
          <Pressable
            accessibilityRole="button"
            onPress={finish}
            testID="biometric_decline_button"
            style={({ pressed }) => [styles.button, styles.ghost, pressed && styles.pressed]}>
            <Text style={[styles.buttonLabel, { color: s.ghostLabel }]}>
              {biometricCopy.decline}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            onPress={accept}
            testID="biometric_accept_button"
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <LinearGradient
              colors={s.primaryFill}
              locations={s.primaryStops}
              {...cssGradientAngle(s.primaryAngle, buttonWidth, s.buttonHeight)}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.buttonLabel, { color: s.primaryLabel }]}>
              {biometricCopy.accept}
            </Text>
          </Pressable>
        </View>

        {/* The login screen's own three-light rig, which the design reuses here
            at the same two colours and the same x centres (15.5 and right 27.5).
            In a 358-tall sheet the two corner lights land 92 above the top edge,
            so what survives the clip is the warm wash across the top.

            Figma paints them above the content, not behind it — which is why the
            title samples #0C0806 rather than pure black in the exported frame —
            so they are last here too, and held out of hit-testing so they cannot
            swallow a tap meant for a button. */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <GaussianBlob
            color={loginPalette.cornerGlow}
            peak={0.228}
            sigma={137}
            style={{ left: 15.5, top: -92.404 }}
          />
          <GaussianBlob
            color={loginPalette.cornerGlow}
            peak={0.242}
            sigma={137}
            style={{ right: 27.5, top: -92.404 }}
          />
          <GaussianBlob
            color={loginPalette.ambientGlow}
            peak={0.019}
            sigma={364}
            style={{ left: 2.266, top: 11.67 }}
          />
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
    // Above the security interstitial's 240, so the two can never argue about
    // which is in front if they ever overlap.
    zIndex: 260,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: s.surface,
    borderTopLeftRadius: s.radius,
    borderTopRightRadius: s.radius,
    overflow: 'hidden',
  },
  grabber: {
    position: 'absolute',
    alignSelf: 'center',
    top: s.grabberTop,
    width: s.grabberWidth,
    height: s.grabberHeight,
    borderRadius: s.grabberHeight,
    backgroundColor: s.grabberFill,
  },
  content: {
    position: 'absolute',
    top: s.contentTop,
    left: s.gutter,
    right: s.gutter,
    alignItems: 'center',
    gap: s.contentGap,
  },
  mark: {
    width: s.markBox,
    height: s.markBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { alignSelf: 'stretch', gap: s.copyGap },
  title: {
    fontFamily: Font.bold,
    fontSize: s.title.size,
    lineHeight: s.title.line,
    color: s.title.color,
    textAlign: 'center',
  },
  body: {
    fontFamily: Font.regular,
    fontSize: s.body.size,
    lineHeight: s.body.line,
    color: s.body.color,
    textAlign: 'center',
  },
  buttons: {
    position: 'absolute',
    left: s.gutter,
    right: s.gutter,
    flexDirection: 'row',
    gap: s.buttonGap,
  },
  button: {
    flex: 1,
    height: s.buttonHeight,
    borderRadius: s.buttonRadius,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: { borderWidth: 1, borderColor: s.ghostBorder },
  pressed: { opacity: 0.85 },
  buttonLabel: { fontFamily: Font.semibold, fontSize: s.buttonLabel },
});
