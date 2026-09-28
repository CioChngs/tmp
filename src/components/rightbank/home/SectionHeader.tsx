import { Pressable, StyleSheet, Text, View } from 'react-native';

import { figmaHome, Font, type Mode } from '@/constants/rightbank-theme';

/**
 * The section title bar the Home body repeats — Figma's `Navigation Bar`, 44
 * tall with a 24-tall line centred in it, optionally with a trailing action.
 *
 * It is one component because Figma uses the identical node for "Send again"
 * and "Recent activity"; only the trailing "See all" differs.
 *
 * The 6 below it is the parent frame's `gap-[6px]` and belongs to the bar, not
 * to each caller — leaving it out shortens every section by 6 and walks
 * everything after it up the page.
 */
export function SectionHeader({
  mode,
  title,
  action,
  onAction,
}: {
  mode: Mode;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const t = figmaHome[mode];

  return (
    <View style={styles.bar}>
      <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
      {action ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          testID={`home_section_${title.toLowerCase().replace(/\s+/g, '_')}_action`}>
          {/* Figma insets the action by 8, not the page's 16. */}
          <Text style={[styles.action, { color: t.inkTertiary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
    marginBottom: 6,
  },
  title: { fontFamily: Font.bold, fontSize: 14, lineHeight: 24 },
  action: { fontFamily: Font.semibold, fontSize: 14, lineHeight: 24 },
});
