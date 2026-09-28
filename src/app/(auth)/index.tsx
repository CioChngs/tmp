/**
 * Login (reference `RbLoginScreen`) — the signed-out entry point.
 *
 * This is the `(auth)` anchor, so `/` lands here whenever the session guard is
 * false. It replaced the animated Welcome screen, which the reference dropped.
 *
 * One screen with three views, which the reference switches in place rather
 * than navigating between — the photograph, the glows and the sheet stay put
 * while only the sheet's height and contents change:
 *
 *   full — username + password, the first-run form. "Өөр хэрэглэгч?" returns here.
 *   bio  — greeting over a Face ID button and a "Use password instead" pill,
 *          for a returning device.
 *   pw   — greeting over password alone (Figma 15324:57799). This is where a
 *          returning user launches: the keystore remembers the last username,
 *          so there is nothing to type but the password. Also reached from
 *          `bio`'s "Use password instead" — see below.
 *
 * Which of the three opens is decided by `initialView()` below, from the
 * remembered username. Only the username is ever stored — see
 * `@/auth/remembered-user` — so `pw` still asks for the credential itself.
 *
 * `bio`'s Face ID button runs a real `expo-local-authentication` prompt — see
 * `attemptFaceId` — with no modal over it: no scan animation, no custom
 * fail/retry card, no built-in password form. Success signs in directly;
 * anything else (a mismatch, a cancel, a dismiss, no sensor to ask at all)
 * just buzzes and leaves the button there.
 *
 * `pw` is reached only by tapping "Use password instead", a separate button
 * next to Face ID (`usePassword`). It is deliberately *not* wired to the
 * prompt's own cancel/dismiss outcome: `expo-local-authentication` reports the
 * same `user_cancel` whether the user tapped a relabelled cancel button or
 * just swiped the sheet away, so treating that as "asked for password" opened
 * `pw` on every dismissal, not just an intentional one. A distinct button, not
 * an inference from the OS result, is the only thing this screen now trusts.
 *
 * `FaceIdSheet`, which used to own the prompt and animate the hand-off, is
 * gone — the prompt itself did not need a component, only a callback. Its
 * other job, a "Welcome back" pause before `finish()`, is gone too; a valid
 * submit signs in immediately.
 *
 * Unlike every other screen, this one has no light/dark variant — the reference
 * login screen is a single fixed treatment, and there is no theme toggle here.
 */
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { peekBiometricLogin } from '@/auth/biometric-login';
import {
    forgetRememberedUser,
    peekRememberedUser,
    rememberUser,
} from '@/auth/remembered-user';
import { useAuth } from '@/auth/session';
import { GlassField } from '@/components/rightbank/login/GlassField';
import { GlassPane } from '@/components/rightbank/login/GlassPane';
import { GradientButton } from '@/components/rightbank/login/GradientButton';
import { AVATAR_SVG, FACEID_SVG } from '@/components/rightbank/login/login-art';
import { LoginBackground } from '@/components/rightbank/login/LoginBackground';
import { Font, loginCopy, loginLayout, loginPalette } from '@/constants/rightbank-theme';

type LoginView = 'full' | 'bio' | 'pw';

/**
 * How much of the screen's bottom edge the software keyboard is covering.
 *
 * `KeyboardAvoidingView` used to do this job here, with `behavior` left
 * undefined on Android on the usual assumption that `adjustResize` shrinks the
 * window for us. It does not any more: Android is edge-to-edge from SDK 54, the
 * window keeps its full height, and the keyboard arrives as an inset the app has
 * to answer for itself — so the sheet stayed where it was and the keyboard sat
 * straight on top of the fields.
 *
 * Measuring it directly also suits this screen better than `padding` would.
 * Every child of the sheet is positioned from the sheet's *bottom* edge at a
 * Figma offset; resizing the sheet would move all of them relative to each
 * other, where translating it moves the whole composition as drawn.
 *
 * iOS gets `WillShow`/`WillHide`, which carry the system's own duration and
 * arrive before the keyboard moves, so the sheet travels with it. Android only
 * has the `Did` pair.
 */
function useKeyboardOverlap() {
  // `useState` rather than `useRef` only because the compiler's rules forbid
  // reading a ref during render; the value is created once either way.
  const [overlap] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const to = (value: number, duration = 250) =>
      Animated.timing(overlap, {
        toValue: value,
        duration: duration || 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

    const subs = [
      Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) =>
        to(e.endCoordinates.height, e.duration),
      ),
      Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', (e) =>
        to(0, e?.duration),
      ),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [overlap]);

  return overlap;
}

/**
 * Which view this app *run* has been left on, or `null` before it has been
 * anywhere.
 *
 * The reference keeps this one level above the screen, which is what makes the
 * second visit different from the first: signing in leaves it on `bio`, so a
 * later sign-out returns to the greeting and a Face ID button instead of the
 * full form. Here the screen is unmounted by the root guard the moment the
 * session flips, so component state cannot carry that. Module scope reproduces
 * the reference's lifetime exactly — it survives a sign-out and resets when the
 * app restarts.
 */
let openAt: LoginView | null = null;

/**
 * Where a fresh mount lands, in priority order:
 *
 *  1. wherever this run was left (a sign-out mid-session returns you there);
 *  2. no remembered username — the full form;
 *  3. a remembered username who accepted the biometric offer — the Face ID view;
 *  4. a remembered username who did not — the returning-user form (Figma
 *     15324:57799).
 *
 * Both `peek` calls are synchronous because the root layout awaits their loads
 * before first paint, so this decision is made once, on the first render, and
 * the returning user never sees the wrong form flash.
 */
function initialView(): LoginView {
  if (openAt) return openAt;
  if (!peekRememberedUser()) return 'full';
  return peekBiometricLogin() ? 'bio' : 'pw';
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const keyboardOverlap = useKeyboardOverlap();

  const [view, setView] = useState<LoginView>(initialView);
  // Seeded from the keystore so the returning user's identity is already in
  // hand: it names the greeting, and it is half of the credential pair that
  // `login()` will want once the sign-in API is wired up.
  const [username, setUsername] = useState(() => peekRememberedUser()?.username ?? '');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  /** Guards the Face ID button against a second tap while a prompt is up. */
  const [bioBusy, setBioBusy] = useState(false);

  /**
   * Every view change drops whatever was typed and re-masks the field, so a
   * password never survives a switch to another user (reference behaviour).
   * The reference does this in an effect keyed on the view; here it is folded
   * into the one transition function, which is the same thing without the
   * extra render.
   */
  const changeView = useCallback((next: LoginView) => {
    openAt = next;
    setView(next);
    setPassword('');
    setReveal(false);
  }, []);

  const valid =
    view === 'full' ? username.trim().length >= 3 && password.length >= 4 : password.length >= 4;

  const finish = useCallback(() => {
    // The one write. Only the username — never the password, which is why the
    // returning form still asks for one. Fire-and-forget: the cache updates
    // synchronously inside `rememberUser`, so nothing below this line is
    // waiting on the keystore.
    //
    // When the real sign-in call lands, this is where its response goes too:
    // `rememberUser({ username, displayName: response.customerName })`, and the
    // greeting starts reading a name instead of a login handle with no other
    // change anywhere.
    void rememberUser({ username: username.trim() });

    // Within this run the next visit is the biometric form, as the reference
    // does it. A *restart* consults the keystore instead and opens at `pw` —
    // `openAt` does not survive the process.
    changeView('bio');

    // No `router.replace`: `signIn` flips the root guard, which unmounts the
    // whole `(auth)` group and lands on the `(app)` anchor.
    signIn();
  }, [changeView, signIn, username]);

  const submit = useCallback(() => {
    // The reference answers an incomplete form with an error buzz and no state
    // change — it never disables or dims the button.
    if (!valid) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    // No "Welcome back" pause here any more — that was `FaceIdSheet`'s, and it
    // is gone. A valid submit signs in immediately.
    finish();
  }, [finish, valid]);

  /**
   * "Өөр хэрэглэгч?" — this device stops belonging to anyone in particular.
   *
   * Drops the stored username as well as the typed one, so the full form comes
   * back empty and the *next* launch starts there too rather than greeting
   * someone who has handed the phone over.
   */
  const useAnotherAccount = useCallback(() => {
    void forgetRememberedUser();
    setUsername('');
    changeView('full');
  }, [changeView]);

  /**
   * "Face ID" on the `bio` view. Runs the real OS prompt; only a success
   * signs in. Every other outcome — a genuine mismatch, the user cancelling,
   * the sheet being swiped away, no sensor to ask at all — is a buzz and
   * nothing more. None of them opens `pw`; see the file header for why that
   * used to happen and why it was wrong.
   */
  const attemptFaceId = useCallback(async () => {
    if (bioBusy) return;
    setBioBusy(true);
    try {
      const [hasHardware, enrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      if (hasHardware && enrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Sign in to RightBank',
          disableDeviceFallback: true,
        });
        if (result.success) {
          finish();
          return;
        }
      }
      // Unavailable, cancelled, dismissed, or a mismatch — all the same from
      // here. "Use password instead" is the actual way out, and it is a
      // button of its own, not an inference from any of these.
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBioBusy(false);
    }
  }, [bioBusy, finish]);

  /**
   * "Use password instead" — the only way `bio` reaches `pw`. See the file
   * header: this used to be inferred from the Face ID prompt's own
   * cancel/dismiss result, which fired on a swipe-away as readily as an
   * intentional tap. It is a real, separate button now for exactly that
   * reason.
   */
  const usePassword = useCallback(() => changeView('pw'), [changeView]);

  /**
   * Figma's offsets are measured from the bottom of its 375 × 812 frame, whose
   * home indicator is 34 tall. A device with a deeper inset shifts everything
   * up by the difference, keeping the gap Figma drew between the buttons and
   * the indicator; an iPhone at exactly 34 lands on the Figma values untouched.
   *
   * That alone is not enough on Android. Figma puts the `full` state's lowest
   * button at 29 — *inside* the 34 band — which is fine against a hairline home
   * indicator and content is allowed to share the rest of that band. A
   * three-button navigation bar is 48 and opaque: at 29 + 14 of difference the
   * button lands 5 underneath it. So a bottom inset deeper than the reference
   * band is read as a bar rather than an indicator, and the lowest control is
   * lifted clear of it by the smallest gap the design itself uses.
   *
   * `bio` and `pw` already sit at 40 and are unaffected — their 14 of
   * difference is exactly the clearance this computes. Only `full` moves, and
   * only on a device that has something solid down there.
   */
  const figmaLift = Math.max(0, insets.bottom - loginLayout.referenceSafeBottom);
  const lift =
    figmaLift > 0
      ? Math.max(
          figmaLift,
          insets.bottom + loginLayout.minBottomClear - loginLayout[view].lowest
        )
      : figmaLift;
  const y = (bottom: number) => bottom + lift;

  /**
   * What the sheet blurs. Android cannot infer it: expo-blur needs an explicit
   * target view or it renders no blur at all. Everywhere else this ref is
   * simply unused.
   */
  const backdropRef = useRef<View | null>(null);

  /** Figma puts the chrome at y 65 under a 44 status bar — 21 clear of it. */
  const chromeTop = insets.top + loginLayout.chromeTop;

  /**
   * The sheet rides above the keyboard, but never so far that its rounded top
   * leaves the screen: on a short device the fields win over the heading, and
   * clipping the sheet's own corners would look like a bug rather than a
   * compromise. `maxRise` is whatever room there is between the sheet's top and
   * the status bar.
   */
  const sheetHeight = loginLayout[view].sheet + lift;
  const maxRise = Math.max(1, screenHeight - insets.top - sheetHeight);
  const rise = keyboardOverlap.interpolate({
    inputRange: [0, maxRise],
    outputRange: [0, -maxRise],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      <LoginBackground variant={view === 'pw' ? 'mirrored' : 'photo'} targetRef={backdropRef} />
      {/* Tap anywhere that is not a control to put the keyboard away. Two
          scrims rather than one wrapper around the whole screen: a wrapper only
          works if every interactive descendant claims its own touch, and a
          `TextInput` does not do that on web — RN-Web renders a plain `<input>`
          whose click bubbles, so the wrapper would dismiss the keyboard for the
          very field the user just tapped and the form could not be typed in at
          all. A scrim painted *underneath* the controls cannot be reached from
          them, on any platform. This one covers the photograph; the sheet has
          its own for the glass between its fields. */}
      <Pressable
        accessible={false}
        onPress={Keyboard.dismiss}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style="light" animated />

      {/* Decorative in Figma too — a locale flag with nothing behind it. The
          ring is its own 0.5 border; the flag itself is inset to 26 inside the
          32 circle. */}
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[styles.chrome, styles.flag, { top: chromeTop }]}>
        <Image source={require('@/assets/login/flag.png')} style={styles.flagImage} />
      </View>

      <View style={styles.keyboardHost}>
        <Animated.View
          style={[styles.sheet, { height: sheetHeight, transform: [{ translateY: rise }] }]}>
          {/* Behind everything else rather than wrapping it: a blur samples what
              is drawn behind it, so a tinted parent would blur its own fill.
              No lit top edge — the HTML prototype had an
              `inset 0 1px 0 rgba(255,255,255,0.22)` highlight, but sampling the
              Figma render across the sheet's top edge finds no row brighter
              than the body, just the photo antialiasing into it. */}
          <GlassPane
            radius={loginPalette.sheetBlurRadius}
            tint={loginPalette.sheetTint}
            blurTarget={backdropRef}
          />

          {/* The sheet's half of the dismiss gesture — see the scrim over the
              photograph above. Directly on top of the glass and under every
              field, label and button, so it catches the space between them and
              nothing else. */}
          <Pressable
            accessible={false}
            onPress={Keyboard.dismiss}
            style={StyleSheet.absoluteFill}
          />

          {view === 'full' && (
            <>
              <Text style={[styles.title, { bottom: y(loginLayout.full.title) }]}>{loginCopy.title}</Text>

              <GlassField
                bottom={y(loginLayout.full.username)}
                placeholder={loginCopy.username}
                testID="login_username_input"
                value={username}
                onChangeText={setUsername}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
              />
              <GlassField
                bottom={y(loginLayout.full.password)}
                placeholder={loginCopy.password}
                testID="login_password_input"
                value={password}
                onChangeText={setPassword}
                secure
                reveal={reveal}
                onToggleReveal={() => setReveal((on) => !on)}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />

              <View style={[styles.forgotRow, { bottom: y(loginLayout.full.forgot) }]}>
                <Pressable
                  accessibilityRole="button"
                  testID="login_forgot_password_button"
                  onPress={() => {
                    // Inert in the reference too — no recovery flow exists yet.
                  }}>
                  <Text style={styles.forgot}>{loginCopy.forgot}</Text>
                </Pressable>
              </View>

              <GradientButton
                bottom={y(loginLayout.full.submit)}
                label={loginCopy.submit}
                testID="login_submit_button"
                gradient="up"
                weight="bold"
                onPress={submit}
              />
              <GradientButton
                bottom={y(loginLayout.full.join)}
                label={loginCopy.join}
                testID="login_join_button"
                gradient={null}
                onPress={() => {
                  // TODO: sign-up flow — next screen in migration-progress.md
                }}
              />
            </>
          )}

          {view !== 'full' && (
            <Hello
              name={peekRememberedUser()?.displayName ?? username}
              avatar={y(loginLayout[view].avatar)}
              greeting={y(loginLayout[view].hello)}
              other={y(loginLayout[view].other)}
              onOtherUser={useAnotherAccount}
            />
          )}

          {view === 'bio' && (
            <>
              <GradientButton
                bottom={y(loginLayout.bio.submit)}
                label={loginCopy.faceId}
                testID="login_face_id_button"
                gradient="flat"
                onPress={attemptFaceId}
                icon={<SvgXml xml={FACEID_SVG} width={19.5} height={19.5} style={styles.faceIcon} />}
              />
            </>
          )}

          {view === 'pw' && (
            <>
              <GlassField
                bottom={y(loginLayout.pw.password)}
                placeholder={loginCopy.password}
                testID="login_password_input"
                value={password}
                onChangeText={setPassword}
                secure
                reveal={reveal}
                onToggleReveal={() => setReveal((on) => !on)}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />
              <GradientButton
                bottom={y(loginLayout.pw.submit)}
                label={loginCopy.signIn}
                testID="login_submit_button"
                gradient="flat"
                onPress={submit}
              />
            </>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * Avatar + greeting + "Өөр хэрэглэгч?", shared by the bio and pw views.
 *
 * Figma (15324:57927) stacks these three at gap 16, with 10 between the two
 * lines. They are positioned absolutely here rather than in a column because
 * every other child of the sheet is, and the resulting offsets are identical.
 */
function Hello({
  name,
  avatar,
  greeting,
  other,
  onOtherUser,
}: {
  /**
   * Whoever this device remembers — a display name once the sign-in API
   * supplies one, the login username until then.
   */
  name: string;
  avatar: number;
  greeting: number;
  other: number;
  onOtherUser: () => void;
}) {
  // Figma shows a single given name ("Тэмүүлэн"), and the line is one
  // non-wrapping row inside a 375 frame, so a full name would be truncated
  // rather than shortened. Taking the first word keeps the shape either way.
  const first = name.trim().split(/\s+/)[0] ?? '';

  return (
    <>
      <View style={[styles.avatar, { bottom: avatar }]}>
        <SvgXml xml={AVATAR_SVG} width={60} height={60} />
      </View>

      <Text numberOfLines={1} style={[styles.greeting, { bottom: greeting }]}>
        {loginCopy.greeting}
        <Text style={styles.greetingName}>{first}</Text>
      </Text>

      <View style={[styles.otherRow, { bottom: other }]}>
        <Pressable
          accessibilityRole="button"
          testID="login_use_another_account_button"
          onPress={onOtherUser}
          hitSlop={8}>
          <Text style={styles.other}>{loginCopy.otherUser}</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: loginPalette.backdrop },
  chrome: {
    position: 'absolute',
    width: loginLayout.chromeSize,
    height: loginLayout.chromeSize,
    zIndex: 2,
  },
  flag: {
    right: loginLayout.gutter,
    // Decorative, so it lets the dismiss scrim beneath it have the tap.
    pointerEvents: 'none',
    borderRadius: loginLayout.chromeSize / 2,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: loginPalette.chromeRing,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Figma: a 26 flag centred in the 32 ring, not filling it.
  flagImage: { width: 26, height: 26, borderRadius: 13 },
  // `box-none` so this full-screen wrapper is not itself a touch target: it sits
  // over the photograph, and without it every tap above the sheet would land on
  // an empty flex container instead of the dismiss scrim underneath.
  keyboardHost: { flex: 1, justifyContent: 'flex-end', pointerEvents: 'box-none' },
  sheet: {
    borderTopLeftRadius: loginLayout.sheetRadius,
    borderTopRightRadius: loginLayout.sheetRadius,
    overflow: 'hidden',
  },
  title: {
    position: 'absolute',
    left: loginLayout.gutter,
    pointerEvents: 'none',
    fontFamily: Font.bold,
    fontSize: 16,
    lineHeight: 20,
    color: loginPalette.text,
  },
  forgotRow: {
    position: 'absolute',
    left: loginLayout.gutter,
    right: loginLayout.gutter,
    height: 16,
    pointerEvents: 'box-none',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  forgot: {
    fontFamily: Font.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: loginPalette.fieldText,
  },
  faceIcon: { margin: 2.25 },
  avatar: {
    position: 'absolute',
    left: '50%',
    pointerEvents: 'none',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  greeting: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    pointerEvents: 'none',
    fontFamily: Font.regular,
    fontSize: 18,
    lineHeight: 24,
    color: loginPalette.text,
  },
  greetingName: { fontFamily: Font.bold },
  otherRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  other: {
    fontFamily: Font.semibold,
    fontSize: 14,
    lineHeight: 16,
    color: loginPalette.muted,
  },
  usePasswordRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  usePasswordPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  usePasswordText: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    lineHeight: 15,
    color: loginPalette.text,
  },
  pressed: { transform: [{ scale: 0.96 }] },
});
