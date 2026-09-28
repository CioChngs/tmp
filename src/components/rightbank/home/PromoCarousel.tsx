import { LinearGradient } from 'expo-linear-gradient';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';

import { useBanners, type Banner } from '@/api';
import {
    FigmaIcon,
    WARNING_CIRCLE,
} from '@/components/rightbank/home/figma-assets';
import { bannerSkins, figmaHome, Font, type Mode } from '@/constants/rightbank-theme';

/**
 * Home promo rail — Figma `Frame 1707480575`: 316×99 cards at gap 26, the first
 * inset 16 from the screen edge.
 *
 * Rendered full-bleed. The parent gives this section no horizontal padding and
 * the ScrollView re-adds 16, so the first card lines up with the page while the
 * rest can scroll to the physical edge — and the next card peeks 17px past the
 * right edge exactly as the frame shows.
 *
 * The rail mixes account state with marketing: the two alert cards are fixed and
 * always first, and the API banners follow. Figma's own rail does the same, in
 * both frames, with the order differing only in which card the board happens to
 * open on.
 */

const SIDE = 16;
const { promo } = figmaHome;

/**
 * Figma draws the card 316 wide on a 375 board, with the next one starting 26
 * later and peeking 17 past the right edge. Holding the gap and the peek and
 * letting the card take the rest keeps that rhythm at any width — a fixed 316
 * on a wider screen leaves the rail visibly narrower than the tiles and rows
 * above and below it, which all reach the 16 gutter.
 *
 * W − 59 is 316 exactly at 375.
 */
const PEEK = 375 - (SIDE + promo.width + promo.gap); // 17
const cardWidth = (screen: number) => screen - SIDE - promo.gap - PEEK;

/**
 * The white outline pill both alert cards carry — Figma 71×25, radius 34, a
 * white-10% fill under a 1px white border at right 15 / top 10.
 */
function ActionPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

/**
 * The card shell: fill, 1px border, radius 20 and the engraved swirl Figma
 * overlays on every alert card.
 *
 * The swirl is one exported vector 334×180 hanging off the top-left at (4, −1)
 * and clipped by the card, so it is placed at its own offset rather than
 * stretched to fit — stretching would bend the arcs.
 */
function Card({
  width,
  fill,
  border,
  testID,
  children,
}: {
  width: number;
  fill: string;
  border: string;
  testID: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        { width, backgroundColor: fill, borderColor: border },
        pressed && { opacity: 0.9 },
      ]}>
      <Image
        source={require('@/assets/home/promo-card-pattern.png')}
        style={styles.pattern}
      />
      {children}
    </Pressable>
  );
}

/** Figma `Frame 1707480293` — an overdue loan payment. */
function OverdueCard({ width }: { width: number }) {
  return (
    <Card testID="home_promo_overdue_card" width={width} fill={promo.overdue.fill} border={promo.overdue.border}>
      <View style={styles.headline}>
        <FigmaIcon xml={WARNING_CIRCLE} box={16} w={13.0053} h={13.0054} />
        <Text style={styles.caps}>1 PAYMENT  OVERDUE</Text>
      </View>
      {/* Figma sets three sizes on one line: 18 for the whole units, 16 for the
          separator, 14 for the fractional part and the currency. */}
      <View style={styles.amountRow}>
        <Text style={styles.amountMajor}>257,250</Text>
        <Text style={styles.amountDot}>.</Text>
        <Text style={styles.amountMinor}>00₮</Text>
      </View>
      <Text style={styles.footnote}>Consumer loan 8 days late</Text>
      <ActionPill label="Pay now" />
    </Card>
  );
}

/** Figma `Frame 1707480292` — a card nearing expiry. */
function CardExpiryCard({ width }: { width: number }) {
  return (
    <Card testID="home_promo_expiry_card" width={width} fill={promo.expiry.fill} border={promo.expiry.border}>
      <View style={styles.headline}>
        <Text style={styles.caps}>⏳ CARD EXPIRY</Text>
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amountMajor}>28 days left</Text>
      </View>
      <Text style={styles.footnote}>Visa Platinum *** 8841 08/26</Text>
      <ActionPill label="Renew" />
    </Card>
  );
}

/**
 * An API banner, drawn on the same 316×99 plate as the alert cards.
 *
 * The gateway supplies copy but no colours, and its `imgUrl` artwork is not
 * dependable, so each banner takes a skin from `bannerSkins` by position.
 * Cycling by index rather than by `bannerId` matters — the ids come back empty
 * from the current backend, so hashing them would give every card one colour.
 *
 * `bannerName` is the only display string the DTO carries, and there is no field
 * behind a CTA, so the pill uses a generic label.
 */
function BannerCard({ banner, index, width }: { banner: Banner; index: number; width: number }) {
  const skin = bannerSkins[index % bannerSkins.length];

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { width, borderColor: 'rgba(255,255,255,0.15)' },
        pressed && { opacity: 0.9 },
      ]}>
      <LinearGradient
        colors={skin.grad}
        locations={[0, 0.48, 1]}
        start={skin.at}
        end={{ x: 0.1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={require('@/assets/home/promo-card-pattern.png')}
        style={styles.pattern}
      />
      <Text style={styles.bannerTitle} numberOfLines={3} accessibilityLabel={banner.bannerName}>
        {banner.bannerName}
      </Text>
      <ActionPill label="Learn more" />
    </Pressable>
  );
}

/** Holds the rail's height while banners load, so the page does not jump. */
function BannerSkeleton({ mode, width }: { mode: Mode; width: number }) {
  const t = figmaHome[mode];
  return (
    <View style={[styles.card, { width, backgroundColor: t.surface, borderColor: t.surfaceBorder }]} />
  );
}

export function PromoCarousel({ mode }: { mode: Mode }) {
  const { data: banners, isPending } = useBanners();
  const w = cardWidth(useWindowDimensions().width);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={w + promo.gap}
      decelerationRate="fast"
      disableIntervalMomentum
      contentContainerStyle={styles.rail}>
      <OverdueCard width={w} />
      <CardExpiryCard width={w} />
      {/* A promo failure must never put an error card in front of the customer's
          account state, so an error or an empty list simply leaves the two
          alerts standing on their own. */}
      {isPending ? (
        <BannerSkeleton mode={mode} width={w} />
      ) : (
        banners?.map((banner, i) => (
          // The backend can return an empty `bannerId`, so it cannot key a list
          // on its own — two blank ids would collide.
          <BannerCard key={`${banner.bannerId}-${i}`} banner={banner} index={i} width={w} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: { paddingHorizontal: SIDE, gap: promo.gap },
  card: {
    height: promo.height,
    borderRadius: promo.radius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pattern: { position: 'absolute', left: 4, top: 0, width: 311, height: 99 },

  headline: { position: 'absolute', left: 15, top: 15, flexDirection: 'row', alignItems: 'center', gap: 2 },
  caps: { fontFamily: Font.semibold, fontSize: 12, color: '#FFFFFF' },
  amountRow: { position: 'absolute', left: 15, top: 40, flexDirection: 'row', alignItems: 'baseline' },
  amountMajor: { fontFamily: Font.bold, fontSize: 18, color: '#FFFFFF' },
  amountDot: { fontFamily: Font.semibold, fontSize: 16, color: '#FFFFFF' },
  amountMinor: { fontFamily: Font.regular, fontSize: 14, color: '#FFFFFF' },
  footnote: { position: 'absolute', left: 16, top: 69, fontFamily: Font.regular, fontSize: 12, color: '#FFFFFF' },

  pill: {
    position: 'absolute',
    right: 15,
    top: 10,
    width: 71,
    height: 25,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontFamily: Font.semibold, fontSize: 12, color: '#FFFFFF' },

  // The banner plate has no fixed anatomy — only a title and the same pill —
  // so its copy is laid out in flow rather than pinned to the alert offsets.
  bannerTitle: {
    position: 'absolute',
    left: 15,
    right: 100,
    top: 15,
    bottom: 12,
    fontFamily: Font.semibold,
    fontSize: 13,
    lineHeight: 17,
    color: '#FFFFFF',
  },
});
