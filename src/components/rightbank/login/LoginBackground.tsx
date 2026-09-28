import { BlurTargetView } from 'expo-blur';
import type { RefObject } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { GaussianBlob } from '@/components/rightbank/GaussianBlob';
import { loginPalette } from '@/constants/rightbank-theme';

/**
 * The login screen's photographic backdrop and its three light sources.
 *
 * Two compositions, exactly as the reference switches them:
 *
 *  - `full` / `bio` — one photo filling the frame (`LG_BG`).
 *  - `pw`           — a different photo (`LG_BG_PW`) pinned 210 above the bottom,
 *                     with a vertically mirrored copy below it. The seam lands
 *                     behind the sheet, so what shows is the reflection under
 *                     the "Hello" block.
 *
 * Nothing here reacts to the app's light/dark mode: the reference's login screen
 * is a single fixed treatment.
 *
 * The root is a `BlurTargetView` — a plain `View` everywhere except Android,
 * where it is what the sheet's blur actually samples. Hand its `ref` to the
 * `GlassPane` that should blur this; see that component for why Android cannot
 * work it out for itself.
 */

/** The reference's `LG_BG_PW` copies are 812 tall, whatever the screen is. */
const PHOTO_HEIGHT = 812;

export function LoginBackground({
  variant,
  targetRef,
}: {
  variant: 'photo' | 'mirrored';
  targetRef?: RefObject<View | null>;
}) {
  return (
    <BlurTargetView ref={targetRef} style={styles.root}>
      {variant === 'mirrored' ? (
        <>
          <Image source={require('@/assets/login/bg_pw.jpg')} style={styles.upper} />
          {/* `top: 100% − 302` in the reference. Expressed from the bottom it is
              a constant, so this does not need the screen height measured. */}
          <Image source={require('@/assets/login/bg_pw.jpg')} style={styles.lower} />
        </>
      ) : (
        <Image source={require('@/assets/login/bg.jpg')} style={styles.photo} />
      )}

      {/* Three CSS `filter: blur(…)` light sources — see `GaussianBlob` for how
          a blur becomes a radial gradient. The same rig, with the same two
          colours, reappears on the biometric opt-in sheet. */}
      <GaussianBlob
        color={loginPalette.cornerGlow}
        peak={0.228}
        sigma={137}
        style={{ left: 15.5, top: 32 }}
      />
      <GaussianBlob
        color={loginPalette.cornerGlow}
        peak={0.242}
        sigma={137}
        style={{ right: 27.5, top: 32 }}
      />
      {/* `LG_GLOW`: a 222-radius disc at 10% blurred by σ 347. A disc's own
          spread adds to the blur's, hence σ 364 rather than 347. */}
      <GaussianBlob
        color={loginPalette.ambientGlow}
        peak={0.019}
        sigma={364}
        style={{ left: 2.3, top: 11.7 }}
      />
    </BlurTargetView>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  // `width`/`height` are spelled out rather than left to an absolute inset:
  // react-native-web renders these as <img>, and a replaced element with
  // `right`/`bottom` but no width falls back to its intrinsic size — 956 x 2000
  // of photograph, unscaled. Yoga would have stretched it, so this only shows up
  // on web, which is exactly why it is worth pinning rather than relying on.
  photo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' },
  upper: {
    position: 'absolute',
    left: 0,
    width: '100%',
    bottom: 210,
    height: PHOTO_HEIGHT,
    objectFit: 'cover',
  },
  lower: {
    position: 'absolute',
    left: 0,
    width: '100%',
    bottom: 302 - PHOTO_HEIGHT,
    height: PHOTO_HEIGHT,
    objectFit: 'cover',
    transform: [{ scaleY: -1 }],
  },
});
