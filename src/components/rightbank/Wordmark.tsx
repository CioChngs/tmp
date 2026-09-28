import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, TSpan, Text as SvgText } from 'react-native-svg';

import { Brand, Font } from '@/constants/rightbank-theme';

/**
 * "RightBank" wordmark — Manrope 40 / 700 / −1 tracking, "Right" in the mode ink,
 * "Bank" in the 135° ember gradient. Rendered as ONE SVG `<Text>` with two
 * `<TSpan>`s so the two colours share a single baseline (avoids the drift you get
 * from overlaying a separate gradient element next to a plain `<Text>`).
 *
 * Note: `@expo-google-fonts` registers each weight as its own family, so the
 * family name already carries the weight. Passing `fontWeight` on top makes
 * Android apply *synthetic* bold and the text renders heavier than the
 * reference — so we set the family only.
 */

const SIZE = 40;
const LETTER_SPACING = -1;

export function Wordmark({ inkColor }: { inkColor: string }) {
  const [w, setW] = useState(190);
  // Manrope cap/line metrics: box ≈ 1.36 × fontSize, baseline ≈ 0.77 from box top.
  const boxH = Math.round(SIZE * 1.36);
  const baseline = Math.round(SIZE * 1.05);

  return (
    <View style={{ height: boxH, width: w, alignItems: 'center', justifyContent: 'center' }}>
      {/* hidden text drives the measured width */}
      <Text
        style={styles.measure}
        onLayout={(e) => setW(Math.ceil(e.nativeEvent.layout.width) + 4)}>
        RightBank
      </Text>
      <Svg width={w} height={boxH}>
        <Defs>
          <LinearGradient id="rbWordmarkBank" x1="0.15" y1="0.15" x2="0.85" y2="0.85">
            <Stop offset="0" stopColor={Brand.emberGradient[0]} />
            <Stop offset="1" stopColor={Brand.emberGradient[1]} />
          </LinearGradient>
        </Defs>
        <SvgText
          x={0}
          y={baseline}
          fontFamily={Font.bold}
          fontSize={SIZE}
          letterSpacing={LETTER_SPACING}>
          <TSpan fill={inkColor}>Right</TSpan>
          <TSpan fill="url(#rbWordmarkBank)">Bank</TSpan>
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  measure: {
    position: 'absolute',
    opacity: 0,
    fontFamily: Font.bold,
    fontSize: SIZE,
    letterSpacing: LETTER_SPACING,
  },
});
