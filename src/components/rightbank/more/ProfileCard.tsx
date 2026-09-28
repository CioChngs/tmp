import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, homePalette, type Mode } from '@/constants/rightbank-theme';

/**
 * More tab — profile hero card. Reference: 160deg dark gradient (same stops as
 * the home hero's `darkGradient`), radius 20, padding 18. Avatar 54×54 circle,
 * ember-tinted bg + border. "✓ Identity verified" pill. "Edit" ghost button.
 */
export function ProfileCard({ mode }: { mode: Mode }) {
  const p = homePalette[mode];
  return (
    <View style={[styles.card, { borderColor: p.hairline }]}>
      <LinearGradient
        colors={p.darkGradient}
        locations={p.darkGradientStops}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>EG</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>Erdene Ganbold</Text>
        <Text style={styles.phone}>+976 9911 2233</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeCheck}>✓</Text>
          <Text style={styles.badgeText}>Identity verified</Text>
        </View>
      </View>
      <Pressable style={styles.editBtn}>
        <Text style={styles.editText}>Edit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
    shadowColor: 'rgba(16,24,40,1)',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(20,8,2,0.42)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,220,185,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Font.bold, fontWeight: '700', fontSize: 19, color: '#FFEBD9' },
  name: { fontFamily: Font.bold, fontWeight: '700', fontSize: 17, color: '#FFFFFF' },
  phone: {
    fontFamily: Font.regular,
    fontWeight: '400',
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
    backgroundColor: 'rgba(12,6,2,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,220,185,0.4)',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  badgeCheck: { fontFamily: Font.bold, fontWeight: '700', fontSize: 10.5, color: '#FFE9D6' },
  badgeText: { fontFamily: Font.bold, fontWeight: '700', fontSize: 10.5, color: '#FFE9D6' },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  // Reference: a real HTML <button> the page never gave a font-family, so it
  // falls back to the browser's default UI font (Arial on this render) at
  // weight 600 — Arial has no 600 face, so the engine snaps up to Bold (700).
  // Font.bold reproduces that same rendered heaviness (Font.semibold read
  // visibly lighter than the reference next to it).
  editText: { fontFamily: Font.bold, fontWeight: '700', fontSize: 12, lineHeight: 14, color: '#FFFFFF' },
});
