import { BlurView } from 'expo-blur';
import type { RefObject } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Figma's glass — a backdrop blur of an exact radius under an exact rgba tint.
 *
 * Three implementations, because no two of these platforms expose the effect
 * the same way:
 *
 *  - **Web** has the primitive Figma is actually specifying, `backdrop-filter:
 *    blur()`, so it takes the radius verbatim and adds nothing. `expo-blur`'s
 *    web shim is deliberately bypassed: it hardcodes `saturate(180%)` and
 *    scales a tint veil off `intensity`, neither of which Figma has, and
 *    neither of which can be turned off (it applies its own style after the
 *    caller's, so a transparent `backgroundColor` is ignored).
 *  - **iOS** has no bare backdrop blur — blur is a material — so it uses
 *    `BlurView` at `intensity = radius * 5`, expo-blur's own mapping.
 *  - **Android** needs both of the props below or it silently renders nothing.
 *    `blurMethod` defaults to `'none'`, which per expo-blur's own docs "renders
 *    a semi-transparent view instead of rendering a blur effect" — which is
 *    exactly what a flat, gradient-looking sheet is. Worse, asking for a real
 *    method without a `blurTarget` falls back to `'none'` again, on the native
 *    side, with only a console warning.
 *
 * The rgba tint is drawn on top in every case, so the colour is identical
 * everywhere and only the blur differs.
 */
export function GlassPane({
  radius,
  tint,
  blurTarget,
  style,
}: {
  /** Blur radius in px, straight from Figma. */
  radius: number;
  /** The rgba fill Figma draws over the blur. */
  tint: string;
  /**
   * Android only, and required there: a ref to the `BlurTargetView` wrapping
   * the content this pane should blur. The target must not contain this pane.
   * Without it Android falls back to no blur at all, so a pane that cannot name
   * a target skips the blur layer entirely rather than paying for expo-blur's
   * tint and getting nothing back.
   */
  blurTarget?: RefObject<View | null>;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.pane, style]}>
      <Blur radius={radius} blurTarget={blurTarget} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
    </View>
  );
}

function Blur({ radius, blurTarget }: { radius: number; blurTarget?: RefObject<View | null> }) {
  if (Platform.OS === 'web') {
    return <View style={[StyleSheet.absoluteFill, webBlur(radius)]} />;
  }

  // Android with nothing to blur: the tint alone, rather than expo-blur's
  // semi-transparent stand-in, which adds a veil and no blur.
  if (Platform.OS === 'android' && !blurTarget) return null;

  return (
    <BlurView
      {...nativeBlurProps(radius)}
      tint="default"
      // `dimezisBlurView` rather than `dimezisBlurViewSdk31Plus`: the latter is
      // silently `'none'` below Android 12, which is the bug this is fixing.
      // Its documented cost is performance on old Android, and this screen is
      // static — nothing animates behind the glass.
      blurMethod="dimezisBlurView"
      blurTarget={blurTarget}
      style={StyleSheet.absoluteFill}
    />
  );
}

/**
 * `intensity` is not the same quantity on the two native platforms, so a radius
 * cannot map to one number for both.
 *
 * **iOS** (`BlurEffectView.swift`) uses it as `animator.fractionComplete` — how
 * far along a 0→1 animation into a full `UIBlurEffect` the view sits. It is a
 * fraction of a material, not a radius, so a strong blur needs a high value;
 * `radius * 5` puts a 20px sheet at the full effect. Blur and tint are the same
 * material there, so they cannot be separated: lowering it to lighten the tint
 * would lighten the blur with it.
 *
 * **Android** (`ExpoBlurView.kt`) uses it twice over. The blur radius is
 * `intensity / blurReductionFactor`, and the overlay alpha is
 * `(intensity / 100) * <tint factor>` — for `default` that factor is **0.44**,
 * a white veil. So `intensity 100` gave a 25px blur under 44 % white, which is
 * what washed the sheet out. Because the reduction factor divides one term and
 * not the other, the two *can* be separated here: `intensity = radius` with
 * `blurReductionFactor = 1` holds the radius at Figma's 20px while dropping the
 * veil to 0.44 × 0.2 = **8.8 %**. Modelled against the Figma sheet pixel that
 * lands at 177 against its 174.
 */
function nativeBlurProps(radius: number) {
  return Platform.OS === 'android'
    ? { intensity: radius, blurReductionFactor: 1 }
    : { intensity: radius * 5 };
}

/**
 * `backdropFilter` is a real react-native-web style property — expo-blur's own
 * web build sets it through a React Native `style` object — but it is not in
 * React Native's `ViewStyle`, so it has to be cast in.
 */
function webBlur(radius: number): ViewStyle {
  const blur = `blur(${radius}px)`;
  return { backdropFilter: blur, WebkitBackdropFilter: blur } as unknown as ViewStyle;
}

const styles = StyleSheet.create({
  pane: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
});
