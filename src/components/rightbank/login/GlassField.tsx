import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { GlassPane } from '@/components/rightbank/login/GlassPane';
import { EYE_SVG } from '@/components/rightbank/login/login-art';
import { Font, loginLayout, loginPalette } from '@/constants/rightbank-theme';

/**
 * The login sheet's frosted input (reference `field()`).
 *
 * Positioned like every other child of the sheet: stretched between the 16px
 * gutters and anchored by its distance from the bottom.
 */
export function GlassField({
  bottom,
  placeholder,
  testID,
  value,
  onChangeText,
  secure = false,
  reveal,
  onToggleReveal,
  ...input
}: {
  bottom: number;
  placeholder: string;
  testID: string;
  value: string;
  onChangeText: (next: string) => void;
  /** Renders the eye toggle and masks the text until `reveal`. */
  secure?: boolean;
  reveal?: boolean;
  onToggleReveal?: () => void;
} & Pick<React.ComponentProps<typeof TextInput>, 'onSubmitEditing' | 'returnKeyType' | 'autoComplete' | 'textContentType'>) {
  return (
    <View style={[styles.field, { bottom }]}>
      {/* No `blurTarget`, so on Android this is the tint alone. What it would
          blur is the sheet, which contains it — the one thing a blur target
          cannot be — and the loss is small either way: the field already sits
          on 20px of blurred photograph, so its own 7.5 takes the effective
          radius from 20 to √(20² + 7.5²) ≈ 21.4. What reads as "field" here is
          the rgba lift, not the extra blur. */}
      <GlassPane radius={loginPalette.fieldBlurRadius} tint={loginPalette.fieldFill} />

      {/* The input has to sit in its own view rather than directly beside the
          glass. That pane is positioned, and CSS paints a positioned box above
          in-flow content whatever the source order — so on web a bare
          <TextInput> here lands *under* the blur and its placeholder comes out
          smeared. A wrapper is positioned too, so order decides again. */}
      <View style={styles.content}>
        <TextInput
          {...input}
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          // The reference sets `::placeholder{opacity:1}` — the placeholder is
          // the same colour as typed text, not a dimmed version of it.
          placeholderTextColor={loginPalette.fieldText}
          secureTextEntry={secure && !reveal}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, secure && styles.inputWithEye]}
        />

        {secure && (
          <Pressable
            onPress={onToggleReveal}
            hitSlop={10}
            accessibilityRole="button"
            testID={`${testID}_toggle`}
            accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
            style={styles.eye}>
            <SvgXml xml={EYE_SVG} width={19.5} height={15.5} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    position: 'absolute',
    left: loginLayout.gutter,
    right: loginLayout.gutter,
    height: loginLayout.fieldHeight,
    borderRadius: loginLayout.fieldRadius,
    overflow: 'hidden',
  },
  content: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  input: {
    flex: 1,
    paddingHorizontal: loginLayout.fieldPaddingX,
    fontFamily: Font.regular,
    fontSize: 14,
    color: loginPalette.fieldText,
  },
  // Reference `padding: 0 52px 0 16px`, clearing the eye button.
  inputWithEye: { paddingRight: 52 },
  eye: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
