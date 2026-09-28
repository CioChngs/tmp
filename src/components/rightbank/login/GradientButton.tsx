import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { Font, loginGradient, loginLayout, loginPalette } from '@/constants/rightbank-theme';

/**
 * The login sheet's action button (reference `btn()`).
 *
 * The reference never dims this — an incomplete form leaves the button looking
 * exactly the same and answers a press with an error buzz instead. That is
 * reproduced rather than "fixed" with a disabled state, because the disabled
 * look would change the screen the user sees for most of its life.
 *
 * Pass `gradient: null` for the transparent "Join RightBank" variant.
 */
export function GradientButton({
  bottom,
  label,
  testID,
  onPress,
  gradient,
  weight = 'semibold',
  icon,
}: {
  bottom: number;
  label: string;
  testID: string;
  onPress: () => void;
  gradient: 'up' | 'flat' | null;
  weight?: 'semibold' | 'bold';
  icon?: React.ReactNode;
}) {
  const ends = gradient ? loginGradient[gradient] : null;

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        !gradient && styles.ghost,
        { bottom },
        pressed && styles.pressed,
      ]}>
      {ends && (
        <LinearGradient
          colors={loginGradient.colors}
          locations={loginGradient.locations}
          start={ends.start}
          end={ends.end}
          style={StyleSheet.absoluteFill}
        />
      )}
      {icon}
      <Text
        style={[
          styles.label,
          { fontFamily: weight === 'bold' ? Font.bold : Font.semibold },
          // Figma gives the filled button 15/Bold with 0.75 tracking and the
          // ghost one 14/SemiBold with none — the tracking is not shared.
          !gradient && styles.ghostLabel,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: loginLayout.gutter,
    right: loginLayout.gutter,
    height: loginLayout.buttonHeight,
    borderRadius: loginLayout.buttonRadius,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: loginLayout.buttonPaddingX,
  } as ViewStyle,
  ghost: { paddingHorizontal: loginLayout.ghostPaddingX },
  label: {
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.75,
    color: loginPalette.text,
  },
  ghostLabel: { fontSize: 14, letterSpacing: 0 },
  pressed: { transform: [{ scale: 0.96 }] },
});
