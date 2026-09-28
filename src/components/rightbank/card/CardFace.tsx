import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EyeIcon } from '@/components/rightbank/EyeIcon';
import type { cardArts } from '@/constants/rightbank-theme';
import { Font } from '@/constants/rightbank-theme';

/**
 * One physical/virtual card face — 296×186.5, radius 20, `140deg` brand
 * gradient, 1px `rgba(255,255,255,.12)` border, `0 16 40 rgba(0,0,0,.5)` shadow.
 * Reference layout (padding 18, column, height 100%): brand row (name + sub /
 * VISA wordmark or Mastercard dual-circles) → gold chip (40×28 r6, mt 14) →
 * PAN (mt auto) → cardholder / expires / cvv row. A 32×32 translucent "reveal"
 * button sits absolute top:52 right:12.
 */
export function CardFace({
  card,
  active = true,
}: {
  card: (typeof cardArts)[number];
  active?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <LinearGradient
          colors={card.gradient}
          locations={card.gradientStops}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* reference corner sheen: two radial highlights, approximated with
            soft translucent blobs (RN has no radial-gradient primitive). */}
        <View pointerEvents="none" style={styles.sheenTopRight} />
        <View pointerEvents="none" style={styles.sheenBottomLeft} />

        <View style={styles.inner}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>RightBank</Text>
              <Text style={styles.brandSub}>{card.label}</Text>
            </View>
            {card.brand === 'visa' ? (
              <Text style={styles.visaLogo}>VISA</Text>
            ) : (
              <View style={styles.mcLogo}>
                <View style={[styles.mcCircle, { backgroundColor: '#EB001B' }]} />
                <View style={[styles.mcCircle, { backgroundColor: '#F79E1B', marginLeft: -9 }]} />
              </View>
            )}
          </View>

          <LinearGradient
            colors={['#E8D08A', '#B9922F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chip}
          />

          <View style={styles.bottom}>
            <Text style={styles.pan}>{revealed ? card.fullPan : `•••• •••• •••• ${card.pan}`}</Text>
            <View style={styles.metaRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>CARDHOLDER</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  ERDENE GANBOLD
                </Text>
              </View>
              <View>
                <Text style={styles.metaLabel}>EXPIRES</Text>
                <Text style={styles.metaValue}>{card.expires}</Text>
              </View>
              <View>
                <Text style={styles.metaLabel}>CVV</Text>
                <Text style={styles.metaValue}>{revealed ? card.cvv : '•••'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {active ? (
        <Pressable
          onPress={() => setRevealed((r) => !r)}
          accessibilityRole="button"
          accessibilityLabel={revealed ? 'Hide card details' : 'Show card details'}
          testID="card_details_visibility_button"
          style={styles.eyeBtn}
          hitSlop={6}>
          {/* Reference `fl`: masked → plain eye ("Show card details"), revealed →
              slashed eye ("Hide card details") — opposite of the password-field
              convention (`off` = slash), so this passes `off={revealed}`. */}
          <EyeIcon off={revealed} size={16} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

export const CARD_W = 296;
export const CARD_H = 186.5;

const styles = StyleSheet.create({
  wrap: { width: CARD_W, position: 'relative' },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  sheenTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  sheenBottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  inner: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  brand: { fontFamily: Font.semibold, fontSize: 12, color: '#FFFFFF', opacity: 0.85 },
  brandSub: { fontFamily: Font.regular, fontSize: 10.5, color: '#FFFFFF', opacity: 0.6, marginTop: 1 },
  visaLogo: { fontFamily: Font.bold, fontSize: 17, letterSpacing: 1.5, color: '#FFFFFF', fontStyle: 'italic' },
  mcLogo: { flexDirection: 'row', alignItems: 'center' },
  mcCircle: { width: 22, height: 22, borderRadius: 11, opacity: 0.95 },
  chip: { marginTop: 14, width: 40, height: 28, borderRadius: 6, opacity: 0.9 },
  bottom: { marginTop: 'auto', paddingTop: 16 },
  pan: { fontFamily: Font.semibold, fontSize: 18, letterSpacing: 2, color: '#FFFFFF' },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 10, alignItems: 'flex-end' },
  metaLabel: { fontFamily: Font.regular, fontSize: 8.5, color: '#FFFFFF', opacity: 0.55, letterSpacing: 1 },
  metaValue: {
    fontFamily: Font.semibold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  eyeBtn: {
    position: 'absolute',
    top: 52,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
