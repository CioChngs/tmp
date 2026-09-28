import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { homePalette, type Mode } from '@/constants/rightbank-theme';

/** White (or dark-surface) rows container — radius 20, padding 2/16, soft shadow. */
export function SectionCard({
  mode,
  children,
  style,
}: {
  mode: Mode;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const p = homePalette[mode];
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: p.surface,
          borderColor: p.hairline,
          shadowColor: mode === 'dark' ? 'rgba(0,0,0,1)' : 'rgba(16,24,40,1)',
          shadowOpacity: mode === 'dark' ? 0.25 : 0.07,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
