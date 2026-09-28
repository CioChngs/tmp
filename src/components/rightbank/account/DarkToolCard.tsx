import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, homePalette, type Mode } from '@/constants/rightbank-theme';

/**
 * Dark gradient "tool" banner — reused for "Account reference" (Accounts) and
 * "CreditScore" (Loans). Same `darkGradient` as the Home hero/avatar. Reference:
 * 354 wide, radius 20, padding 14/16, icon tile 44×44 (radius 14, translucent
 * white bg), title 15/700 white, subtitle 12.5/400 white@~80%, pill CTA button
 * (bg rgba(0,0,0,.26), radius 12, padding 9/14, white 12.5/600).
 */
export function DarkToolCard({
  mode,
  icon,
  title,
  subtitle,
  cta,
  onPress,
}: {
  mode: Mode;
  icon: string;
  title: string;
  subtitle: string;
  cta: string;
  onPress?: () => void;
}) {
  const p = homePalette[mode];
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={p.darkGradient}
        locations={p.darkGradientStops}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.ring} />
      <View style={styles.iconTile}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={cta}
        testID={`account_tool_${title.toLowerCase().replace(/\s+/g, '_')}_button`}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.8 }]}> 
        <Text style={styles.ctaText}>{cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16,24,40,0.1)',
  },
  ring: {
    position: 'absolute',
    right: -20,
    top: -35,
    width: 162,
    height: 162,
    borderRadius: 81,
    borderWidth: 16,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: Font.bold, fontWeight: '700', fontSize: 15, color: '#FFFFFF' },
  subtitle: { fontFamily: Font.regular, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  cta: {
    backgroundColor: 'rgba(0,0,0,0.26)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  ctaText: { fontFamily: Font.semibold, fontWeight: '600', fontSize: 12.5, color: '#FFFFFF' },
});
