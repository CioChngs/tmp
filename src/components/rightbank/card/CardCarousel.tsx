import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CARD_W, CardFace } from '@/components/rightbank/card/CardFace';
import { cardArts, cardTabPalette, Font, homePalette, type Mode } from '@/constants/rightbank-theme';

const GAP = 12;
const SIDE = 18;

/**
 * Horizontal snap carousel of card faces. Reference: rail padding `16 18 6`,
 * gap 12, `scroll-snap-type: x mandatory`; an amber "⏳ N DAYS" pill centred
 * under a card that's expiring; a Home-style dot row (active 18×6, idle 6×6)
 * below the rail.
 */
export function CardCarousel({ mode }: { mode: Mode }) {
  const p = homePalette[mode];
  const cp = cardTabPalette[mode];
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + GAP));
    if (i !== index) setIndex(i);
  };

  return (
    <View>
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + GAP}
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingLeft: SIDE, paddingRight: SIDE, paddingTop: 16, paddingBottom: 6, gap: GAP }}>
        {cardArts.map((card, i) => (
          <View key={card.id} style={styles.item}>
            <CardFace card={card} active={i === index} />
            {card.expiringDays != null ? (
              <View style={[styles.badge, { backgroundColor: cp.amberBg, borderColor: cp.amberBorder }]}>
                <Text style={[styles.badgeText, { color: cp.amberText }]}>{`⏳ ${card.expiringDays} DAYS`}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {cardArts.map((card, i) => (
          <View
            key={card.id}
            style={[
              styles.dot,
              i === index
                ? { width: 18, backgroundColor: p.accent }
                : { width: 6, backgroundColor: p.dotIdle },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { width: CARD_W, alignItems: 'center', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  badgeText: { fontFamily: Font.extrabold, fontSize: 10.5, letterSpacing: 0.2 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 4 },
  dot: { height: 6, borderRadius: 999 },
});
