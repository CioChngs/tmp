import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * A soft circular light, centred on the point the `style` inset names.
 *
 * The design's light sources are CSS `filter: blur(…)` over a small shape, which
 * React Native has no primitive for. Blurring a shape much smaller than the blur
 * radius *is* a Gaussian, so each one is redrawn as the radial falloff the blur
 * produces, with a peak alpha of the shape's area spread over 2πσ².
 *
 * `style` positions the *centre*: the box is grown around it by 3σ, past which a
 * Gaussian is under 1 % of its peak and contributes nothing. The stops sample
 * exp(−r²/2σ²) at σ, 2σ and 3σ.
 *
 * Shared by the login screen's three-light rig and the biometric opt-in sheet,
 * which reuses the same rig — the sheet's design carries the same `#FDE4C5`
 * corner lights and the same 222-radius `#FF6601` disc at 10 %.
 *
 * ## Why it rasterises small and scales up
 *
 * `react-native-svg` on Android renders every `<Svg>` into an `ARGB_8888` bitmap
 * the size of the *view* (`SvgView.drawOutput()`), and `Canvas` refuses to draw
 * a bitmap over 100 MB:
 *
 *     σ 364 → 2184 dp → 5733² px at density 2.625 → 131 469 156 B → hard crash
 *
 * A four-stop radial falloff is smooth enough that bilinear upscaling is
 * indistinguishable from drawing it at full size — `SvgView` already paints with
 * `FILTER_BITMAP_FLAG` — so the cost is a fixed 256 dp square whatever σ is. The
 * scale is a transform, which happens on the canvas matrix and never widens the
 * bitmap; both boxes share a centre, so the light does not move.
 */
const RASTER = 256;

export function GaussianBlob({
  color,
  peak,
  sigma,
  style,
}: {
  color: string;
  /** Alpha at the centre, 0…1. */
  peak: number;
  /** Standard deviation, in dp. */
  sigma: number;
  /** Positions the light's centre. */
  style: StyleProp<ViewStyle>;
}) {
  const size = sigma * 6;
  const offset = -size / 2;
  const draw = Math.min(size, RASTER);

  return (
    <View
      style={[
        { position: 'absolute', width: size, height: size },
        style,
        { marginLeft: offset, marginTop: offset, marginRight: offset },
      ]}>
      <Svg
        width={draw}
        height={draw}
        style={{
          position: 'absolute',
          left: (size - draw) / 2,
          top: (size - draw) / 2,
          transform: [{ scale: size / draw }],
        }}>
        <Defs>
          <RadialGradient id="blob" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={peak} />
            <Stop offset="0.333" stopColor={color} stopOpacity={peak * 0.607} />
            <Stop offset="0.667" stopColor={color} stopOpacity={peak * 0.135} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={draw} height={draw} fill="url(#blob)" />
      </Svg>
    </View>
  );
}
