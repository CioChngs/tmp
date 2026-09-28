import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { welcomePalette, type Mode } from '@/constants/rightbank-theme';

/**
 * Soft radial "lift" behind the Log in / Join button block. Ports the reference
 * element:
 *   width 360, height 210, bottom -36, translateX(-50%)
 *   background: radial-gradient(55% 62% at 50% 68%, rgba(147,166,194,.3), transparent 72%)
 *   filter: blur(20px)
 * (no blur in RN-svg — approximated with a smooth multi-stop falloff.)
 */

const W = 360;
const H = 210;

export function CtaGlow({ mode }: { mode: Mode }) {
  const p = welcomePalette[mode];
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: '50%',
        marginLeft: -W / 2,
        bottom: -36,
        width: W,
        height: H,
      }}>
      <Svg width={W} height={H}>
        <Defs>
          <RadialGradient id="rbCtaGlow" cx="50%" cy="68%" rx="55%" ry="62%">
            {[0, 0.28, 0.48, 0.62, 0.72, 1].map((o) => (
              <Stop
                key={o}
                offset={o}
                stopColor={p.ctaGlow}
                stopOpacity={o >= 0.72 ? 0 : p.ctaGlowOpacity * (1 - o / 0.72) ** 2}
              />
            ))}
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} fill="url(#rbCtaGlow)" />
      </Svg>
    </View>
  );
}
