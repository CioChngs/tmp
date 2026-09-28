import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, homePalette, type Mode } from '@/constants/rightbank-theme';

/**
 * Shared settings/action row — icon badge, title + subtitle, optional trailing
 * node, optional chevron. Reference: 38×38 r12 icon badge (`rgba(16,24,40,.043)`),
 * row `gap 12, padding 13 0`, title 14.5/600, subtitle 12/400 muted, 1px hairline
 * divider between rows (omit on the last row of a card).
 */
export function ListRow({
  mode,
  icon,
  title,
  subtitle,
  trailing,
  chevron,
  danger,
  divider = true,
  onPress,
  iconBg,
}: {
  mode: Mode;
  icon: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  chevron?: boolean;
  danger?: boolean;
  divider?: boolean;
  onPress?: () => void;
  iconBg?: string;
}) {
  const p = homePalette[mode];
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      testID={onPress ? `settings_open_button_${title.toLowerCase().replace(/\s+/g, '_')}` : undefined}
      style={[styles.row, divider && { borderBottomWidth: 1, borderBottomColor: p.hairline }]}>
      <View style={[styles.badge, { backgroundColor: iconBg ?? p.badgeBg }]}>
        <Text style={{ fontSize: 17 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.title, { color: danger ? '#FF7D93' : p.ink }]}
          numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: p.muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {chevron ? <Text style={[styles.chevron, { color: p.muted }]}>›</Text> : null}
    </Wrap>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  badge: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Font.semibold, fontSize: 14.5 },
  subtitle: { fontFamily: Font.regular, fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 17 },
});
