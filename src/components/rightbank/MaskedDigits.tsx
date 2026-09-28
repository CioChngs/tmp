import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

/**
 * Reference per-character balance mask (`<b><span>9<span class="dot"/></span>…`):
 * each digit keeps its glyph cell (so the block never reflows) but the glyph is
 * set `opacity:0` and a centred dot (`width/height: 0.4em`, `background:
 * currentColor` — same weight/color as the text, not a lighter muted tone) is
 * overlaid. Non-digit characters (`'`, `₮`) stay visible as-is.
 */
export function MaskedDigits({
  value,
  hidden,
  textStyle,
  color,
}: {
  value: string;
  hidden: boolean;
  textStyle: StyleProp<TextStyle>;
  color: string;
}) {
  const flat = StyleSheet.flatten<TextStyle>([textStyle, { color }]);
  const dot = (flat.fontSize ?? 14) * 0.4;
  return (
    <View style={styles.row}>
      {value.split('').map((ch, i) =>
        hidden && /[0-9]/.test(ch) ? (
          <View key={i} style={styles.cell}>
            <Text style={[flat, { opacity: 0 }]}>{ch}</Text>
            <View
              style={[
                styles.dot,
                { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color },
              ]}
            />
          </View>
        ) : (
          <Text key={i} style={flat}>
            {ch}
          </Text>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
  cell: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute' },
});
