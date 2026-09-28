/**
 * RightBank design tokens — extracted from the reference prototype
 * (`reference/RightBank.html`, default theme "Knight", Light + Dark modes).
 *
 * Scope note: this file currently carries what the Welcome screen needs plus the
 * mode-independent brand tokens. It is structured so later screens can extend it
 * (per migration-progress.md §5 / Phase 3) without reshaping what exists.
 */

export type Mode = 'light' | 'dark';

/** Mode-independent brand identity (same in light & dark). */
export const Brand = {
  /** Primary ember gradient — used for the "Bank" wordmark and the primary button. */
  emberGradient: ['#EF4E23', '#FF8A5C'] as const, // linear-gradient(135deg, …)
  emberSolid: '#FF6B3D',
  /** Text color that sits on top of the ember button / ember fills. */
  onEmber: '#2E0B00',
  emberGlow: 'rgba(255,107,61,0.40)',
  /** Brand mark "X" gradient (150deg). */
  markGradient: ['#FFE7B8', '#FFB25C', '#FF7A18', '#E2560A'] as const,
  markGradientStops: [0, 0.32, 0.66, 1] as const,
  /** "Knight" theme accent gradient (135deg) — toggle knob, and the Face ID
   * card's "ok" badge / primary button. `onKnight` sits on top of it. */
  knightKnobGradient: ['#5E6E88', '#9DB0CB'] as const,
  onKnight: '#0A0F18',
  /** "Knight" theme accent — Face ID scan line + face-scan icon stroke. */
  knightAccent: '#93A6C2',
  /** "Knight" soft accent (steel-blue) — reused as the dark-mode "Forgot
   * password?" link (`faceIdPalette.link`). */
  knightAccentSoft: '#C3D0E2',
  sparkColors: ['#FFC85C', '#FF9A3C', '#FFD98C'] as const,
} as const;

export const Radius = {
  pill: 999,
} as const;

export const welcomePalette: Record<Mode, {
  /** Full-bleed radial background gradient stops (radial 120% 90% at 50% 6%). */
  bgGradient: string[];
  bgGradientStops: number[];
  /** Soft ambient wash blobs behind the content. Colour + peak alpha are kept
   * separate — an rgba() alpha in an SVG `stopColor` is dropped on Android. */
  washCool: string;
  washCoolOpacity: number;
  washWarm: string;
  washWarmOpacity: number;
  /** Twinkling starfield dot colors + base opacity. */
  starColors: string[];
  starOpacity: number;
  /** Trailing colour of the two diagonal shooting-star streaks. */
  streak: string;
  streakOpacity: number;
  /** Soft radial lift behind the Log in / Join button block. */
  ctaGlow: string;
  ctaGlowOpacity: number;
  /** "Right" half of the wordmark. */
  wordmarkInk: string;
  heading: string;
  muted: string;
  /** Light/dark toggle track. */
  toggleTrackBg: string;
  toggleTrackBorder: string;
  /** Secondary ("Join RightBank") button. */
  outlineBtnBg: string;
  outlineBtnBorder: string;
  outlineBtnText: string;
}> = {
  light: {
    bgGradient: ['#FFFFFF', '#FFF3E4', '#F2EFFB', '#E7E9F6'],
    bgGradientStops: [0, 0.4, 0.74, 1],
    washCool: '#5A78FF',
    washCoolOpacity: 0.14,
    washWarm: '#FF8C32',
    washWarmOpacity: 0.2,
    starColors: ['#F2A03C', '#7C93E8', '#E9873A', '#9B8BE0'],
    starOpacity: 0.72,
    streak: '#E9873A',
    streakOpacity: 0.5,
    ctaGlow: '#93A6C2',
    ctaGlowOpacity: 0.36,
    wordmarkInk: '#2B3341',
    heading: '#131A2B',
    muted: '#5D6880',
    toggleTrackBg: 'rgba(19,26,43,0.07)',
    toggleTrackBorder: 'rgba(19,26,43,0.16)',
    outlineBtnBg: 'rgba(19,26,43,0.05)',
    outlineBtnBorder: 'rgba(255,255,255,0.14)',
    outlineBtnText: '#131A2B',
  },
  dark: {
    bgGradient: ['#141B2E', '#0A101E', '#060913', '#04060C'],
    bgGradientStops: [0, 0.42, 0.72, 1],
    washCool: '#5A82FF',
    washCoolOpacity: 0.08,
    washWarm: '#FF8C32',
    washWarmOpacity: 0.07,
    starColors: ['#FFFFFF', '#AFD2FF', '#FFD9A8', '#C8D8FF'],
    starOpacity: 0.85,
    streak: '#FFFFFF',
    streakOpacity: 0.9,
    ctaGlow: '#93A6C2',
    ctaGlowOpacity: 0.26,
    wordmarkInk: '#EDF1F8',
    heading: '#EEF2FA',
    muted: '#93A0B8',
    toggleTrackBg: 'rgba(255,255,255,0.08)',
    toggleTrackBorder: 'rgba(255,255,255,0.16)',
    outlineBtnBg: 'rgba(255,255,255,0.06)',
    outlineBtnBorder: 'rgba(255,255,255,0.14)',
    outlineBtnText: '#EEF2FA',
  },
};

/** Face ID sheet (login) — mode-aware, "Knight"-derived. */
export const faceIdPalette: Record<Mode, {
  scrim: string;
  cardBg: readonly [string, string]; // linear-gradient(170deg, …)
  cardBorder: string;
  title: string;
  dim: string; // subtitle + Cancel
  pwBg: string;
  pwBorder: string;
  pwText: string;
  /** Password-form text inputs (`St()` / `wt()` in the reference). */
  inputBg: string;
  inputBorder: string;
  placeholder: string;
  /** "Forgot password?" link (measured `rgb(59,74,94)` in light). */
  link: string;
}> = {
  light: {
    scrim: 'rgba(22,28,38,0.55)',
    cardBg: ['#FFFFFF', '#F3F5F9'],
    cardBorder: 'rgba(16,24,40,0.10)',
    title: '#141A24',
    dim: '#69738A',
    pwBg: 'rgba(16,24,40,0.043)',
    pwBorder: 'rgba(16,24,40,0.10)',
    pwText: '#141A24',
    inputBg: '#FFFFFF',
    inputBorder: 'rgba(16,24,40,0.16)',
    placeholder: 'rgba(16,24,40,0.35)',
    link: '#3B4A5E',
  },
  dark: {
    scrim: 'rgba(4,7,14,0.88)',
    cardBg: ['#182030', '#0F1622'],
    cardBorder: 'rgba(255,255,255,0.14)',
    title: '#F2F5FC',
    dim: '#9DA9C4',
    pwBg: 'rgba(255,255,255,0.10)',
    pwBorder: 'rgba(255,255,255,0.14)',
    pwText: '#F2F5FC',
    inputBg: 'rgba(255,255,255,0.10)',
    inputBorder: 'rgba(255,255,255,0.20)',
    placeholder: 'rgba(255,255,255,0.40)',
    link: '#C3D0E2',
  },
};

/**
 * Home tab (`screen === 'home'`) — "Knight" theme, Light + Dark.
 * Every value is measured from the rendered reference at the 390-wide baseline
 * (dark values captured with the reference's own light/dark toggle flipped).
 */
type HomeTokens = {
  pageGradient: readonly [string, string, string];
  pageGradientStops: readonly [number, number, number];
  ink: string;
  muted: string;
  inkFaint: string;
  accentInk: string;
  darkGradient: readonly [string, string, string, string];
  darkGradientStops: readonly [number, number, number, number];
  hairline: string;
  cardShadow: string;
  tileShadow: string;
  surface: string;
  tileGradient: readonly [string, string];
  badgeBg: string;
  accent: string;
  dotIdle: string;
  toggleTrackBg: string;
  toggleTrackBorder: string;
  /** Carousel nav-arrow circle. */
  arrowBg: string;
  /** Floating tab bar. */
  navBg: string;
  navBorder: string;
  navInactive: string;
  /** Scan FAB ring. */
  fabBorder: string;
};

export const homePalette: Record<Mode, HomeTokens> = {
  light: {
    pageGradient: ['#FBFAF8', '#F2F4F8', '#EDEFF5'],
    pageGradientStops: [0, 0.55, 1],
    ink: '#141A24',
    muted: '#69738A',
    inkFaint: 'rgba(16,24,40,0.55)',
    accentInk: '#3B4A5E',
    darkGradient: ['#0C1119', '#23303F', '#4B5D74', '#7D8FA8'],
    darkGradientStops: [0, 0.45, 0.82, 1],
    hairline: 'rgba(16,24,40,0.10)',
    cardShadow: 'rgba(16,24,40,0.07)',
    tileShadow: 'rgba(16,24,40,0.10)',
    surface: '#FFFFFF',
    tileGradient: ['#FFFFFF', '#F4F6FA'],
    badgeBg: 'rgba(16,24,40,0.043)',
    accent: '#93A6C2',
    dotIdle: 'rgba(16,24,40,0.17)',
    toggleTrackBg: 'rgba(16,24,40,0.043)',
    toggleTrackBorder: 'rgba(16,24,40,0.10)',
    arrowBg: 'rgba(255,255,255,0.9)',
    navBg: 'rgba(255,255,255,0.96)',
    navBorder: 'rgba(147,166,194,0.40)',
    navInactive: '#69738A',
    fabBorder: '#FFFFFF',
  },
  dark: {
    pageGradient: ['#06070A', '#0A0C11', '#101319'],
    pageGradientStops: [0, 0.5, 1],
    ink: '#F2F5FC',
    muted: '#9DA9C4',
    inkFaint: 'rgba(255,255,255,0.62)',
    accentInk: '#C3D0E2',
    darkGradient: ['#0C1119', '#23303F', '#4B5D74', '#7D8FA8'],
    darkGradientStops: [0, 0.45, 0.82, 1],
    hairline: 'rgba(255,255,255,0.14)',
    cardShadow: 'rgba(0,0,0,0.25)',
    tileShadow: 'rgba(0,0,0,0.30)',
    surface: 'rgba(255,255,255,0.094)',
    tileGradient: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.07)'],
    badgeBg: 'rgba(255,255,255,0.10)',
    accent: '#93A6C2',
    dotIdle: 'rgba(255,255,255,0.22)',
    toggleTrackBg: 'rgba(255,255,255,0.08)',
    toggleTrackBorder: 'rgba(255,255,255,0.16)',
    arrowBg: 'rgba(26,32,44,0.92)',
    navBg: 'rgba(8,10,14,0.96)',
    navBorder: 'rgba(147,166,194,0.40)',
    navInactive: '#9DA9C4',
    fabBorder: 'rgba(226,234,247,0.55)',
  },
};

/**
 * Account tab (`screen === 'account'`) — segmented Accounts/Deposits/Loans/Reward.
 * Tinted-card recipe measured from the reference: a soft 160deg gradient wash +
 * a themed border tint (`rgba(<base>, 0.42)`) + the shared card shadow/radius 20.
 */
type Tint = { grad: readonly [string, string]; border: string; base: string };

type AccountTokens = {
  segTrackBg: string;
  segInactiveText: string;
  gold: Tint; // Everyday account, daily-saving streak
  sky: Tint; // currency conversion, term deposits
  indigo: Tint; // loan rows
  mint: Tint; // reward "earned this month"
  danger: Tint; // overdue / action-needed
  /** Danger-card text (darker than the `danger.base` border/glow tint). */
  dangerText: string;
  overdueBadgeBg: string;
  progressTrack: string;
  progressFillIndigo: string;
  progressFillSky: string;
  /** Term-deposit rate pill (mint wash, neutral border — not a mint border). */
  ratePillBg: string;
  ratePillBorder: string;
  ratePillText: string;
};

export const accountPalette: Record<Mode, AccountTokens> = {
  light: {
    segTrackBg: 'rgba(16,24,40,0.043)',
    segInactiveText: '#69738A',
    gold: { grad: ['#FFF9EC', '#FDF0D8'], border: 'rgba(240,180,41,0.42)', base: '#F0B429' },
    sky: { grad: ['#EFF9FE', '#DDEFF9'], border: 'rgba(76,201,240,0.42)', base: '#4CC9F0' },
    indigo: { grad: ['#F5F3FE', '#E8E4FB'], border: 'rgba(124,140,255,0.42)', base: '#7C8CFF' },
    mint: { grad: ['#F1FBF4', '#DFF3E6'], border: 'rgba(61,220,151,0.42)', base: '#3DDC97' },
    danger: { grad: ['#FFEFF2', '#FFD9E0'], border: 'rgba(255,0,51,0.6)', base: '#FF0033' },
    dangerText: '#C8001F',
    overdueBadgeBg: '#FF0033',
    progressTrack: 'rgba(16,24,40,0.10)',
    progressFillIndigo: '#8B7CF6',
    progressFillSky: '#4CC9F0',
    ratePillBg: 'rgba(61,220,151,0.12)',
    ratePillBorder: 'rgba(147,166,194,0.333)',
    ratePillText: '#3B4A5E',
  },
  dark: {
    segTrackBg: 'rgba(255,255,255,0.08)',
    segInactiveText: '#9DA9C4',
    gold: { grad: ['#2A2314', '#241D10'], border: 'rgba(240,180,41,0.45)', base: '#F0B429' },
    sky: { grad: ['#132229', '#0E1B22'], border: 'rgba(76,201,240,0.45)', base: '#4CC9F0' },
    indigo: { grad: ['#201D33', '#19172B'], border: 'rgba(124,140,255,0.45)', base: '#7C8CFF' },
    mint: { grad: ['#132821', '#0F211B'], border: 'rgba(61,220,151,0.45)', base: '#3DDC97' },
    danger: { grad: ['#2B1418', '#241014'], border: 'rgba(255,90,120,0.55)', base: '#FF6B85' },
    dangerText: '#FF6B85',
    overdueBadgeBg: '#FF4D6D',
    progressTrack: 'rgba(255,255,255,0.14)',
    progressFillIndigo: '#8B7CF6',
    progressFillSky: '#4CC9F0',
    ratePillBg: 'rgba(61,220,151,0.16)',
    ratePillBorder: 'rgba(147,166,194,0.4)',
    ratePillText: '#C3D0E2',
  },
};

/** Child-savings card — full-bleed violet gradient (135deg), white text. */
export const childSavingsGradient = ['#7C5BD9', '#4B2FA8', '#2A1668'] as const;
export const childSavingsGradientStops = [0, 0.55, 1] as const;

/** Reward tier badge (measured "PLATINUM" pill). */
export const platinumGold = '#C8A961';

/** Accounts sub-tab — mock account list (reference order + exact strings). */
export const accountsList = [
  { glyph: '◈', name: 'Everyday', iban: 'MN32 0000 5000000000', symbol: '', amount: "987'654'321", decimals: '.00', suffix: '₮', typeLine: 'MNT · Current account', meta: "1.2% · +3'980₮ accrued", tint: 'gold' as const },
  { glyph: '◆', name: 'Savings', iban: 'MN32 0000 5000000127', symbol: '', amount: "12'400'000", decimals: '.00', suffix: '₮', typeLine: 'MNT · Savings account', meta: "5% · +51'670₮ accrued", tint: null },
  { glyph: '◇', name: 'US Dollar', iban: 'MN32 0000 5000000771', symbol: '$', amount: '3,250', decimals: '.40', suffix: '', typeLine: 'USD · FX account', meta: '0.4% · +$1.08 accrued', tint: null },
  { glyph: '◇', name: 'Chinese Yuan', iban: 'MN32 0000 5000000884', symbol: '¥', amount: '8,420', decimals: '.00', suffix: '', typeLine: 'CNY · FX account', meta: "0.3% · +¥2.10 accrued", tint: null },
] as const;

/** Deposits sub-tab — child savings, streak, term deposits. */
export const childSavingsKids = [
  { initial: 'Э', name: 'Энгүүн-Үянга' },
  { initial: 'Т', name: 'Тэмүүлэн' },
] as const;

export const termDeposits = [
  { title: '12-month term deposit', matures: 'Matures 14 Feb 2027', rate: '12.8%', principal: "15'000'000₮", interest: "+1'440'000₮", opened: 'Opened 14 Feb 2026 · 47% of term', progress: 0.47 },
  { title: 'Flexible savings', matures: 'Matures Open-ended', rate: '8.4%', principal: "3'000'000₮", interest: "+189'000₮", opened: 'Opened 02 Nov 2025 · 75% of term', progress: 0.75 },
] as const;

/** Loans sub-tab. */
export const loans = [
  { icon: '🏠', name: 'Mortgage', rateLine: '6% · ends May 2038', remaining: "142'300'000₮", repaidPct: '34% repaid', progress: 0.34, next: "Next 1'180'000₮ · 15 Aug 2026" },
  { icon: '🚗', name: 'Car loan', rateLine: '14.4% · ends Dec 2027', remaining: "9'600'000₮", repaidPct: '70% repaid', progress: 0.7, next: "Next 890'000₮ · 10 Aug 2026" },
  { icon: '🛋', name: 'Consumer loan', rateLine: '19.2% · ends Mar 2027', remaining: "1'470'000₮", repaidPct: '67% repaid', progress: 0.67, next: "Next 245'000₮ · 28 Jul 2026" },
] as const;

/** Reward sub-tab — "How you earn" itemised list, exact reference order/strings. */
export const rewardEarnRows = [
  { icon: '◈', title: 'Everyday', meta: "987'654'321₮ × 7% a year ÷ 12", amount: "+288'066", of: "of 5'761'317₮" },
  { icon: '◆', title: 'Savings', meta: "12'400'000₮ × 1% a year ÷ 12", amount: '+517', of: "of 10'333₮" },
  { icon: '◇', title: 'US Dollar', meta: '$3,250.40 × 1% a year ÷ 12', amount: '+462', of: "of 9'242₮" },
  { icon: '◇', title: 'Chinese Yuan', meta: '¥8,420.00 × 1% a year ÷ 12', amount: '+168', of: "of 3'354₮" },
  { icon: '🏦', title: '12-month term deposit', meta: "15'000'000₮ × 1% a year ÷ 12", amount: '+625', of: "of 12'500₮" },
  { icon: '🏦', title: 'Flexible savings', meta: "3'000'000₮ × 1% a year ÷ 12", amount: '+125', of: "of 2'500₮" },
  { icon: '🧸', title: 'Child savings · Энгүүн-Үянга', meta: "4'820'000₮ × 2% a year ÷ 12", amount: '+402', of: "of 8'033₮" },
  { icon: '🧸', title: 'Child savings · Тэмүүлэн', meta: "1'240'000₮ × 2% a year ÷ 12", amount: '+103', of: "of 2'067₮" },
  { icon: '🏠', title: 'Mortgage', meta: "142'300'000₮ × 1% a year ÷ 12", amount: "+5'929", of: "of 118'583₮" },
  { icon: '🚗', title: 'Car loan', meta: "9'600'000₮ × 1% a year ÷ 12", amount: '+400', of: "of 8'000₮" },
  { icon: '🛋', title: 'Consumer loan', meta: 'Payment overdue — no points this month', amount: '—', of: '' },
] as const;

export const rewardFeeRows = [
  { icon: '🌍', title: 'SWIFT transfers', meta: "50'000₮ net fee × 10%", amount: "+5'000", of: "of 50'000₮" },
  { icon: '💳', title: 'International card payments', meta: "484'200₮ × 1% merchant fee × 10%", amount: '+484', of: "of 4'842₮" },
] as const;

export const rewardAppRows = [
  { icon: '🧾', title: 'Bills paid in the app', meta: '4 × 200 points, capped at 2000', amount: '+800', of: '' },
] as const;

export const rewardSpendRows = [
  { icon: '₮', title: 'Cash back to Everyday', meta: "1'000 points = 1'000₮", points: "1'000" },
  { icon: '📱', title: 'Mobile top-up', meta: 'Any Mongolian number', points: "2'000" },
  { icon: '☕', title: 'Coffee voucher', meta: 'Tom n Toms · partner offer', points: "1'500" },
  { icon: '🎟', title: 'Cinema ticket', meta: 'Urgoo cinema · partner offer', points: "4'500" },
] as const;

export const rewardBenefits = [
  { icon: '🛟', title: 'Instant overdraft', meta: "Up to 500'000₮ with one flat fee", status: 'ACTIVE' as const },
  { icon: '💱', title: 'Treasury FX rates', meta: 'Better than the published rate on large trades', status: 'ACTIVE' as const },
  { icon: '🧾', title: 'Free account reference', meta: 'Two documents a year at no charge', status: 'ACTIVE' as const },
  { icon: '✈️', title: 'Airport lounge', meta: 'Reach Platinum to unlock', status: 'LOCKED' as const },
] as const;

/**
 * Card tab (`screen === 'card'`) — Knight/Light. Measured from the reference's
 * rendered DOM (inline styles read directly off the live nodes, so these are
 * the authored CSS values, not derived).
 */
type CardTabTokens = {
  pageTitle: string;
  newCardBg: string;
  newCardBorder: string;
  amberBg: string;
  amberBorder: string;
  amberText: string;
  dangerBg: string;
  dangerText: string;
  walletBtnBg: string;
  walletBtnText: string;
  dashedBorder: string;
};

export const cardTabPalette: Record<Mode, CardTabTokens> = {
  light: {
    pageTitle: '#141A24',
    newCardBg: '#FFFFFF',
    newCardBorder: 'rgba(16,24,40,0.10)',
    amberBg: 'rgba(233,169,60,0.133)',
    amberBorder: 'rgba(233,169,60,0.533)',
    amberText: '#E9A93C',
    dangerBg: 'rgba(255,90,110,0.12)',
    dangerText: '#FF7D93',
    walletBtnBg: '#000000',
    walletBtnText: '#FFFFFF',
    dashedBorder: 'rgba(255,255,255,0.55)',
  },
  dark: {
    pageTitle: '#F2F5FC',
    newCardBg: 'rgba(255,255,255,0.10)',
    newCardBorder: 'rgba(255,255,255,0.16)',
    amberBg: 'rgba(233,169,60,0.16)',
    amberBorder: 'rgba(233,169,60,0.5)',
    amberText: '#E9A93C',
    dangerBg: 'rgba(255,107,133,0.16)',
    dangerText: '#FF6B85',
    walletBtnBg: '#FFFFFF',
    walletBtnText: '#0A0F18',
    dashedBorder: 'rgba(255,255,255,0.55)',
  },
};

/** Physical/virtual card art — 140deg gradients, exact reference RGB stops. */
export const cardArts = [
  {
    id: 'visa-platinum',
    label: 'Physical · Visa Platinum',
    brand: 'visa' as const,
    pan: '8841',
    fullPan: '4278 9051 3364 8841',
    cvv: '412',
    expires: '08/26',
    expiringDays: 28,
    gradient: ['#5A2408', '#A8480F', '#E07A22'] as const,
    gradientStops: [0, 0.52, 1] as const,
  },
  {
    id: 'mastercard-gold',
    label: 'Physical · Mastercard Gold',
    brand: 'mastercard' as const,
    pan: '2207',
    fullPan: '5412 7534 9081 2207',
    cvv: '057',
    expires: '03/28',
    expiringDays: null,
    gradient: ['#1E222A', '#343A46', '#525A6B'] as const,
    gradientStops: [0, 0.55, 1] as const,
  },
  {
    id: 'virtual',
    label: 'Virtual · Virtual card',
    brand: 'visa' as const,
    pan: '5560',
    fullPan: '4532 1198 7743 5560',
    cvv: '839',
    expires: '11/27',
    expiringDays: null,
    gradient: ['#241E4E', '#3B2E75', '#5B47A8'] as const,
    gradientStops: [0, 0.55, 1] as const,
  },
] as const;

/** Manrope family keys as loaded by `@expo-google-fonts/manrope`. */
export const Font = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

/**
 * Manrope standing in for **GIP**, matched by weight rather than by name.
 *
 * GIP is not in the project yet and Manrope is the substitute, but the two do
 * not line up rung for rung: GIP's Bold is appreciably heavier than Manrope's,
 * so mapping `GIP:Bold` to `Manrope_700Bold` — which is what reading the name
 * across does — lands a visibly lighter screen than the frame.
 *
 * The ladder below is measured, not judged. Rendering each candidate at the
 * design's own size and line box and comparing mean ink coverage against
 * Figma's own export of the same string:
 *
 * | String | Figma (GIP) | Manrope 600 | Manrope 700 | Manrope 800 |
 * | --- | --- | --- | --- | --- |
 * | `Хүнс` Bold 14 | 0.2306 | — | 0.2078 | **0.2259** |
 * | `Харилцах данс` SemiBold 12 | 0.2147 | 0.2032 | **0.2239** | — |
 *
 * So each GIP weight is one Manrope rung heavier, and `regular` has nowhere to
 * go: 400 is the lightest loaded, and GIP Regular appears only in the IBAN
 * prefix, where the grey carries the hierarchy anyway.
 *
 * Used by the Accounts screen (§33). The same shift very likely applies to
 * every screen that names a GIP weight; it is not applied globally because
 * that would silently re-weight screens signed off under the old mapping.
 * Swapping `Font` for `GipFont` in them is the whole change when that is
 * wanted — and all of it becomes a no-op the day GIP itself arrives.
 */
export const GipFont = {
  regular: Font.regular,
  medium: Font.semibold,
  semibold: Font.bold,
  bold: Font.extrabold,
  /**
   * `GIP:ExtraBold`, used for the two account sheets' titles. It has nowhere to
   * go: 800 is the heaviest Manrope face loaded and `bold` already claims it,
   * so ExtraBold and Bold render identically until the real font arrives. The
   * name is kept so the day it does, this is one more line to point at a file
   * rather than a `bold` that has to be found and re-read.
   */
  extrabold: Font.extrabold,
} as const;

/**
 * The six offer-tile skins from the reference promo rail, in reference order —
 * its `invite`, `subs`, `deposit`, `overdraft`, `fx` and `cashback` gradients.
 *
 * Each is a `radial-gradient(85% 120% at 78% 15%, …)` in the reference. `at` is
 * that light origin, which the native port approximates by starting a linear
 * gradient from the same point. The reference pairs every skin with fixed copy;
 * the API banners bring their own, so only the colours live here.
 */
export const bannerSkins = [
  { grad: ['#F2A65A', '#C2410C', '#4A1D06'] as const, at: { x: 0.82, y: 0.1 } },
  { grad: ['#7C6CF0', '#4433A8', '#1B1440'] as const, at: { x: 0.78, y: 0.15 } },
  { grad: ['#34C79A', '#17795F', '#07271F'] as const, at: { x: 0.8, y: 0.12 } },
  { grad: ['#4FB0E8', '#1F5F96', '#082238'] as const, at: { x: 0.76, y: 0.14 } },
  { grad: ['#E86FA8', '#9B2C63', '#330C21'] as const, at: { x: 0.8, y: 0.1 } },
  { grad: ['#E9C15A', '#A8760F', '#2E1F05'] as const, at: { x: 0.78, y: 0.12 } },
] as const;

/* ------------------------------------------------------------------ *
 * Login screen
 *
 * Source of truth is the Figma frame `IPhone13Mini` (node 14909:53946) in the
 * Xacteen design system, 375 × 812 with a 44 status bar and a 34 home
 * indicator. Where the old `reference/RightBank.html` prototype disagrees,
 * Figma wins; the few places they differ are called out inline.
 *
 * The one screen in the app with no light/dark variant: it sits on a fixed
 * photograph, so every value here is mode-independent. The theme toggle in its
 * top-right still flips the app-wide mode — it just changes nothing on this
 * screen.
 * ------------------------------------------------------------------ */

/**
 * The ember gradient behind "Log in RightBank".
 *
 * Figma: `linear-gradient(155.03792987712308deg, rgb(240,83,39) 11.557%,
 * rgb(253,132,86) 88.443%)`. A CSS angle is measured clockwise from "to top"
 * and its gradient line is sized to cover the box, so it cannot be restated as
 * a corner-to-corner `start`/`end` pair without knowing the box. These are
 * solved for Figma's 343 × 48 button (375 frame − 2 × 16 gutter):
 *
 *   dir  = (sin θ, −cos θ)                  … +y is down
 *   len  = |w·sin θ| + |h·cos θ|
 *   ends = centre ∓ dir·len/2, normalised by (w, h)
 *
 * The ends land outside the unit square, which is correct — that is what makes
 * a steep angle read as a near-vertical wash across a wide, short button rather
 * than a diagonal one. `locations` carries the 11.557 % / 88.443 % stops.
 *
 * These are solved for iOS and Android, where `start`/`end` are unit coordinates
 * on the real rect (CAGradientLayer's convention). react-native-web instead
 * derives a CSS angle from the pair as if the box were square, so a web build
 * paints these at 176° rather than 155°. Native is the target; the web preview
 * shows a slightly more vertical wash.
 */
export const loginGradient = {
  colors: ['rgb(240,83,39)', 'rgb(253,132,86)'] as const,
  locations: [0.11557, 0.88443] as const,
  /** 155.0379° — "Log in RightBank". Verified against the Figma render: sampling
   * the frame at the button's left edge, right edge, top and bottom reproduces
   * these stops to within one 8-bit step. */
  up: { start: { x: 0.3842, y: -1.2779 }, end: { x: 0.6158, y: 2.2779 } },
  /** 131.65° — the `bio` / `pw` buttons. No Figma frame covers those two views,
   * so this one is still the prototype's `LG_GRAD`, solved the same way. */
  flat: { start: { x: 0.1875, y: -1.5727 }, end: { x: 0.8125, y: 2.5727 } },
} as const;

export const loginPalette = {
  /** Behind the photograph, for the frame it does not cover. */
  backdrop: '#1A0F08',
  /**
   * Bottom sheet: Figma `rgba(0,0,0,0.2)` over its 20px glass blur
   * (`Insta: Effect(type: GLASS, radius: 20)`).
   *
   * Radii, not intensities. `GlassPane` converts for whichever primitive the
   * platform has; see it for why web does not go through `expo-blur`.
   */
  sheetTint: 'rgba(0,0,0,0.2)',
  sheetBlurRadius: 20,
  /**
   * Input field: `rgba(255,255,255,0.18)` over a 7.5px backdrop blur.
   * Figma variable `BackgroundColorLight/Secondary` for the text.
   */
  fieldFill: 'rgba(255,255,255,0.18)',
  fieldBlurRadius: 7.5,
  /** Field text and placeholder are the same colour — Figma draws the resting
   * field with its placeholder at full `#FAFAFC`, not a dimmed variant. */
  fieldText: '#FAFAFC',
  /** Figma variable `BackgroundColorLight/Primary`. */
  text: '#FFFFFF',
  /** "Other user?" — prototype only; no Figma frame covers the `bio` view. */
  muted: 'rgba(255,255,255,0.6)',
  /** Hairline ring around the sun toggle and the locale flag (Figma: 0.5px). */
  chromeRing: '#FFFFFF',
  /** The two `filter: blur(137px)` warm patches in the top corners. */
  cornerGlow: '#FDE4C5',
  /** `Ellipse 93` — a blurred `#FF6601` circle bled in from the top-left. */
  ambientGlow: '#FF6601',
} as const;

/**
 * Sheet height per view, and the bottom offsets of everything inside it — all
 * measured from the physical bottom of Figma's 375 × 812 frame. Figma lays the
 * sheet out top-down (a 16-gap column at y 492) but every offset below is the
 * same distance expressed from the bottom, which is the edge the sheet is
 * pinned to and the only one a taller screen does not move.
 */
export const loginLayout = {
  gutter: 16,
  sheetRadius: 30,
  fieldHeight: 56,
  fieldRadius: 20,
  /** Figma's input is `px 16 / py 4` around a 24 line with 12 gaps: 4+12+24+12+4. */
  fieldPaddingX: 16,
  buttonHeight: 48,
  buttonRadius: 18,
  /** Figma gives the filled button `px 32` and the ghost one `px 28`. */
  buttonPaddingX: 32,
  ghostPaddingX: 28,
  /** Top chrome: a 32-square control at y 65, below Figma's 44-tall status bar. */
  chromeSize: 32,
  chromeTop: 21,
  /**
   * Figma's frame is an iPhone 13 mini: a **34** home indicator, which is what
   * the 89 / 29 button offsets below are measured against. (The old HTML
   * prototype assumed 24 — following it put every control 10 too high on any
   * modern iPhone.) Real insets are offset from this.
   */
  referenceSafeBottom: 34,
  /**
   * The smallest gap the design leaves between its lowest control and the
   * bottom of the reference frame's indicator band, from `bio` and `pw`. It is
   * the floor a screen with an *opaque* bottom bar has to keep — see `lowest`.
   */
  minBottomClear: 6,
  /**
   * The lowest control's own offset, per state. `full` sits at 29, which is
   * inside the 34 band on purpose: iOS draws a hairline pill near the bottom of
   * that band and content is allowed to share the rest of it. An Android
   * navigation bar is not shareable, so the login screen lifts `full` clear of
   * it rather than reproducing the overlap — see `(auth)/index.tsx`.
   */
  full: {
    sheet: 379,
    title: 335.5,
    username: 264,
    password: 192,
    forgot: 160,
    submit: 89,
    join: 29,
    lowest: 29,
  },
  bio: {
    sheet: 292,
    avatar: 208,
    hello: 168,
    other: 142,
    submit: 40,
    /**
     * "Use password instead" — not from Figma; there is no frame for `bio` at
     * all, only the reference, which drew this pill inside the biometric
     * modal rather than on the base screen. Centred in the free space between
     * the Face ID button's top edge (`submit` 40 + `buttonHeight` 48 = 88) and
     * `other` (142): (88 + 142) / 2, less half the pill's own ~33 height.
     */
    usePassword: 98,
    lowest: 40,
  },
  pw: { sheet: 342, avatar: 258, hello: 218, other: 192, password: 120, submit: 40, lowest: 40 },
} as const;

/**
 * Login copy, verbatim from the Figma frame.
 *
 * Figma labels the fields and the sheet heading in Mongolian and leaves both
 * button labels in English. That is the design as drawn, so it is what ships —
 * but note it makes login the only Mongolian screen in the app while Home,
 * Account, Card and More are still English. Collected here so switching back,
 * or handing the screen to a real i18n layer, is one edit rather than six.
 *
 * The `pw` (password-only) state now has its own frame, 15324:57799, which is
 * where `greeting` and `otherUser` come from — both were English placeholders
 * until it arrived. `bio` still has no frame, so `faceId` stays as the
 * prototype had it.
 */
export const loginCopy = {
  /** "Log in" — the sheet heading. */
  title: 'Нэвтрэх',
  /** "Username" */
  username: 'Хэрэглэгчийн нэр',
  /** "Password" */
  password: 'Нууц үг',
  /** "Forgot password" — no question mark in Figma. */
  forgot: 'Нууц үг мартсан',
  submit: 'Log in RightBank',
  join: 'Join RightBank',
  faceId: 'Face ID',
  /** Figma node 15324:57812 — the password-only submit, GIP SemiBold 15/24. */
  signIn: 'Log in',
  /** "Other user?" — Figma node 15324:57816. */
  otherUser: 'Өөр хэрэглэгч?',
  /** "Hello, " — Figma node 15324:57815, with the name in bold after it. */
  greeting: 'Сайн уу, ',
} as const;

/* -------------------------------------------------------------------------- */
/*  Home — Figma `15314:40225` (dark) / `15324:56122` (light)                  */
/* -------------------------------------------------------------------------- */

/**
 * The Home screen's own tokens, taken from the two Figma Home frames rather
 * than from the HTML prototype.
 *
 * `homePalette` above still describes the prototype's Home and is what the
 * pre-Figma components read; these are additive, so nothing that already
 * renders changes shape. The two overlap in spirit but not in value — the
 * prototype's Home is a light page with a dark hero card floating on it, and
 * Figma's is a full-bleed blue header with the page hanging off its bottom
 * edge — so mapping one onto the other would have meant bending both.
 *
 * Everything here is measured, not guessed: the flat values come from
 * `get_design_context` on the individual nodes, and the hero gradient from
 * sampling the exported frame (the hero's own fill sits under ~60 pattern
 * vectors, so it has no readable node of its own).
 */
export const figmaHome = {
  /**
   * The blue header, `Frame 1707480257`, 375×370 with its bottom corners
   * rounded at 30 (fitted against the exported frame: the left edge leaves
   * x=0 at y≈345 and reaches x=20 by y=368).
   *
   * 370 counts from the top of the screen, so the live height is
   * `insets.top + BODY`; every offset below is measured down from the bottom
   * of the status bar, which is where the design's 44 ends.
   */
  hero: {
    /** 370 − 44pt status bar. */
    body: 326,
    radius: 30,
    /**
     * Two Figma layers make the backdrop, and they ship as one image —
     * `assets/home/hero-bg.png`, at 2×.
     *
     * The first is `Frame 1707480371 1`: a 1072×417 raster whose visible window
     * is exactly the header. It is a mesh render with film grain and a teal
     * spill in the bottom-right corner, none of which a stop list reproduces,
     * so this is one of the places where the exact asset beats a redrawn
     * approximation.
     *
     * The second is `Group 1000004912`: three 5000px rotated gradient
     * rectangles, two of them in `color-dodge`, which warm the middle of the
     * image. Neither their geometry nor their own gradients survive at screen
     * scale, but their *effect* does — and it is a smooth two-dimensional bump,
     * brightest down the centre and falling off to both edges, peaking around
     * y 190…250. In `L = -ln(1 - s)` that field is additively separable, so it
     * was fitted as a row term plus a column term and applied to the export
     * once, offline.
     *
     * Baking it is what keeps this to one plain `<Image>`: no `mixBlendMode` at
     * runtime, nothing for Android to get wrong, and one fewer full-screen
     * composited layer per frame. Against Figma's own render of the header the
     * result is a mean **3.4/255** per channel.
     *
     * (An earlier pass shipped the field as a ten-stop `color-dodge` gradient
     * measured from the two edge columns only. Those columns sit in the bump's
     * *trough*, so the middle of the header came out ~20/255 short in red — see
     * migration-progress.md §26.)
     */
    /**
     * `Component 662` — a horse in fine vertical hatch, at 10%, inset 2 from
     * both edges and starting 149 down the frame. Figma clips it to the header,
     * so the export is already the 371×221 that shows.
     *
     * A PNG rather than markup: the three exported layers are 342 KB of hatch
     * paths, which is both a heavy parse and a large `SvgView` — the shape of
     * the crash in §24.6. At 3× the same picture is 45 KB of bitmap.
     */
    horse: { left: 2, top: 105, width: 371, height: 221, opacity: 0.1 },
    /** Offsets below the status bar (Figma y − 44). */
    greetingTop: 16,
    balanceTop: 93,
    pillsTop: 160,
    cardTop: 216,
  },

  /** Shared by both modes — the header is identical in the two frames. */
  onHero: {
    /** "Good morning," — rgba(245,245,245,0.8). */
    greeting: 'rgba(245,245,245,0.8)',
    /** `backgroundcolorlight/primary`. */
    primary: '#FFFFFF',
    /** `backgroundcolorlight/secondary` — the two header pills' text. */
    secondary: '#FAFAFC',
    /** The pills and the round header buttons. */
    glass: 'rgba(255,255,255,0.2)',
    /** The overdraft plate, the reward chip and the overdraft pill. */
    glassSoft: 'rgba(255,255,255,0.1)',
    progressTrack: 'rgba(255,255,255,0.2)',
    /**
     * `linear-gradient(175.19deg, #FF9900 24.997%, #FF5100 93.537%)` — the
     * redesign's own declaration, replacing the flat `#8EABD4` the blue header
     * used. 175° is all but straight down, and the fill is 8 tall, so the run
     * is effectively vertical whatever the track's width.
     */
    progressAngle: 175.1877,
    progressFill: ['#FF9900', '#FF5100'] as const,
    progressStops: [0.24997, 0.93537] as const,
  },

  /**
   * The quick-action tiles — `Frame 1707480576`, three equal tiles at gap 12.
   *
   * The redesign makes all three the same: the blue 226.39° gradient skin is
   * gone, and so is Transfer's full-opacity version of it that used to mark it
   * as the primary action. What is left is one warm card — a flat `#FEF4ED`
   * hairline over a 10% wash of the same colour — and three illustrated icons
   * doing the work the fill used to do. The label is black in both frames.
   *
   * There is no shadow. The tiles read as cards in the export, but sampling
   * Figma's own render across a tile edge finds the page unchanged either side
   * of the border: what separates them is that hairline and nothing else.
   */
  tile: {
    radius: 26,
    height: 100,
    gap: 12,
    fill: 'rgba(254,244,237,0.1)',
    border: '#FEF4ED',
    /** Icon 40 at y 15, label centred on y 74 — both inside the 1px border. */
    iconTop: 15,
    iconBox: 40,
    labelCentre: 74,
    labelSize: 15,
    /** GIP's `leading: normal` box at 15; stated so Manrope cannot widen it. */
    labelLine: 18,
    labelInk: '#000000',
  },

  /**
   * The header's account row — `Frame 1707480347`, 344 wide at x 15.5.
   *
   * Three glass buttons at gap 16: the account selector, then Copy, then
   * Statement. Copy is new in the redesign, and it displaced the old
   * 133-wide labelled "Statement" pill — both trailing buttons are now 40
   * squares at radius 16 with a 20 glyph, so the row reads as one control and
   * two affordances rather than two pills.
   */
  accountRow: {
    inset: 15.5,
    height: 40,
    radius: 16,
    gap: 16,
    button: 40,
    glyph: 20,
    /** Figma's own width for the selector on the 375 board. */
    selector: 232,
  },

  /** Promo / alert rail — `Frame 1707480575`, cards 316×99 at gap 26. */
  promo: {
    width: 316,
    height: 99,
    gap: 26,
    radius: 20,
    overdue: { fill: '#CA4144', border: '#E5585B' },
    expiry: { fill: '#233B7E', border: '#587DE5' },
  },

  /** Semantic amounts, shared by both modes. */
  debit: '#FF3646',
  credit: '#22AB94',
  debitRing: '#F7525F',
  creditRing: '#22AB94',

  light: {
    page: '#FFFFFF',
    /** `textcolorblack/primary`. */
    ink: '#000000',
    /** `textcolorblack/tertiary` — timestamps, "See all", sub-labels. */
    inkTertiary: '#898989',
    /** Tiles and rows: white with a hairline. */
    surface: '#FFFFFF',
    surfaceBorder: '#F5F3F6',
    /**
     * `Хас 2` — three drop shadows stacked at the origin, at 6/4/4%. RN 0.86
     * takes a CSS shadow list, so all three survive; the older code kept only
     * the widest because `shadowRadius` takes one.
     */
    cardShadow:
      '0px 0px 24px rgba(0,0,0,0.06), 0px 0px 6px rgba(0,0,0,0.04), 0px 0px 1px rgba(0,0,0,0.04)',
    /** The same effect at a third the spread — the activity rows' own. */
    rowShadow:
      '0px 0px 12px rgba(0,0,0,0.06), 0px 0px 3px rgba(0,0,0,0.04), 0px 0px 0.5px rgba(0,0,0,0.04)',
  },

  dark: {
    page: '#0D0B0A',
    ink: '#FFFFFF',
    /** `backgroundcolorlight/tertiary`. */
    inkTertiary: '#F8F8F8',
    surface: 'rgba(255,255,255,0.1)',
    surfaceBorder: 'rgba(255,255,255,0.1)',
    /**
     * Not designed: the redesign shipped one light frame, and a 6% black
     * shadow is invisible on a near-black page. The geometry is Figma's and
     * only the opacity is carried over from the dark frame's old single
     * shadow, so the cards keep some lift in dark mode without inventing a
     * different shape.
     */
    cardShadow:
      '0px 0px 24px rgba(0,0,0,0.3), 0px 0px 6px rgba(0,0,0,0.2), 0px 0px 1px rgba(0,0,0,0.2)',
    rowShadow:
      '0px 0px 12px rgba(0,0,0,0.3), 0px 0px 3px rgba(0,0,0,0.2), 0px 0px 0.5px rgba(0,0,0,0.2)',
  },
} as const;

/** The mode-dependent half of {@link figmaHome}. */
export type FigmaHomeTokens = (typeof figmaHome)['light' | 'dark'];

/**
 * "Send again" payees — Figma `Frame 1707480327`.
 *
 * Mock rows, as in the frame: there is no payee endpoint yet. `ring` is the
 * accent Figma gives each avatar, kept so the rail is not a row of identical
 * grey discs while the bank logos are still missing.
 */
export const sendAgainPayees = [
  { name: 'Mom', bank: 'Khan bank', ring: '#1B7F4B' },
  { name: 'Baby', bank: 'Xacbank', ring: '#F05327' },
  { name: 'Boss', bank: 'Trade & develop...', ring: '#1B6FD4' },
  { name: 'Broda', bank: 'Trade & develop...', ring: '#1B6FD4' },
] as const;

/**
 * Recent-activity rows — Figma `Frame 1707480334`, exact strings from the frame.
 *
 * `dir` drives the icon ring and the amount colour: `out` is the red
 * `systemcolor/error-primary` ring over an up arrow, `in` the green
 * `success-primary` ring over a down arrow. The first row has neither — Figma
 * gives it a merchant mark instead, which is the shape a real logo would take.
 */
export const activityRows = [
  {
    merchant: true,
    title: 'CU',
    time: '2024/03/02 10:20',
    amount: '-2,000.00₮',
    balance: 'Үлдэгдэл: 6,149.34',
    dir: 'out',
  },
  {
    merchant: false,
    title: 'Автомат төлөлт',
    time: '2024/03/02 10:20',
    amount: '-1,896,850.57₮',
    balance: 'Үлдэгдэл: 6,149.34',
    dir: 'out',
  },
  {
    merchant: false,
    title: 'Ээжээс нь',
    time: '2024/03/02 10:20',
    amount: '+896,850.57₮',
    balance: 'Үлдэгдэл: 6,149.34',
    dir: 'in',
  },
] as const;

/**
 * The floating tab bar — Figma `Component 602`, a 343×70 bar inside a 375×103
 * box, with the scan button raised out of its top edge.
 *
 * This replaces the prototype's dark glass pill wholesale: the bar is white,
 * the tabs are duotone 24 icons over 12 labels, and the active tab is marked by
 * the brand gradient running through both its icon and its label rather than by
 * a filled slot. The prototype's floating and pulsing FAB animations are not in
 * the design and go with it.
 *
 * The four item centres are Figma's own, kept as fractions of the bar so they
 * stay put on a screen wider than the 375 board: they are symmetric about the
 * scan button (40.5 / 107 and 235.5 / 302 of 343) but not evenly spread, so
 * four equal flex slots would walk the outer two ~6 inwards.
 */
export const figmaTabBar = {
  height: 70,
  radius: 27,
  /** 375 − 343, halved: the bar is centred, not inset by the page's 16. */
  gutter: 16,
  /** Figma's board leaves 6 between the bar's bottom and the home indicator. */
  bottomGap: 6,
  surface: '#FCFCFC',
  shadow:
    '0px 0px 16px rgba(0,0,0,0.04), 0px 0px 12px rgba(0,0,0,0.04), 0px 0px 4px rgba(0,0,0,0.04), 0px 0px 0.5px rgba(0,0,0,0.04)',

  /** The scan button: a 52 disc whose centre sits 5 above the bar's top edge. */
  fab: 52,
  fabOverhang: 21,
  fabGlyph: 29,
  /** `Ellipse 1453`, `linear-gradient` from (0,26) to (47.69,40.34) in its 52 box. */
  fabFill: ['#F05327', '#FD8456'] as const,
  /** `Ellipse 1454` behind it: the same disc 1 larger, blurred 0.5, in the
   *  brand gradient — a hairline halo, so the blur is dropped. */
  fabRing: 54,
  /**
   * `Ellipse 3871` behind both: the same 52 disc in the brand gradient under a
   * layer blur of radius 26, spilling to a 104 box. Baked to
   * `assets/tabbar/fab-glow.png`, with its falloff measured off Figma's own
   * render rather than modelled — Figma's blur has compact support and a
   * Gaussian at the exported `stdDeviation` is far too heavy. See §29.
   */
  fabGlow: 104,

  /** Item centres as a fraction of the bar's width. */
  itemCentres: [40.5 / 343, 107 / 343, 235.5 / 343, 302 / 343] as const,
  item: { width: 64, top: 8, iconTop: 2, iconBox: 24, gap: 7.5, labelSize: 12, labelLine: 15 },
  inactive: '#B7B7B7',
  /** `linear-gradient(22.99deg, #ED1846 9.547%, #FFCC32 90.453%)`. */
  activeAngle: 22.9887,
  active: ['#ED1846', '#FFCC32'] as const,
  activeStops: [0.09547, 0.90453] as const,
} as const;

/**
 * A CSS `linear-gradient(Xdeg, …)` angle as `expo-linear-gradient` start/end.
 *
 * CSS measures the angle clockwise from "to top" and runs the gradient along
 * the line through the box's centre, ending where a perpendicular through the
 * furthest corner crosses it. `start`/`end` are *fractions of the box*, so the
 * same pair only reproduces the requested angle on a square; feed it the box's
 * real size and the endpoints fall outside 0…1 as needed.
 */
export function cssGradientAngle(deg: number, w: number, h: number) {
  const rad = (deg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad); // y grows downwards
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  return {
    start: { x: (w / 2 - half * dx) / w, y: (h / 2 - half * dy) / h },
    end: { x: (w / 2 + half * dx) / w, y: (h / 2 + half * dy) / h },
  };
}

/**
 * Biometric opt-in sheet — Figma `15726:76357` ("Component 664"), a 375 × 358
 * bottom sheet.
 *
 * Laid out exactly like the login sheet, and for the same reason: Figma's frame
 * is an iPhone 13 mini, so its 34-tall home indicator is what the 40 under the
 * buttons is measured against, and a device with a deeper inset shifts the
 * bottom-anchored rows down together rather than eating the gap.
 *
 * Only one frame exists — the design has no dark variant of this sheet — so the
 * white treatment below is what ships in both app modes. The scrim behind it is
 * not in the design at all and comes from `faceIdPalette[mode].scrim`, which is
 * what every other sheet in the app already uses.
 */
export const biometricSheet = {
  height: 358,
  radius: 30,
  gutter: 16,
  /** Same iPhone 13 mini reference as `loginLayout.referenceSafeBottom`. */
  referenceSafeBottom: 34,

  /** The drag handle: 24 × 4 at y 12, centred. Purely an affordance in Figma. */
  grabberWidth: 24,
  grabberHeight: 4,
  grabberTop: 12,
  grabberFill: '#D9DBE9',

  surface: '#FFFFFF',
  /** Content column: y 42, gap 24 between the mark and the copy, 12 inside it. */
  contentTop: 42,
  contentGap: 24,
  copyGap: 12,
  markBox: 80,
  /** The artwork is inset 9.38 % on all four sides of the 80 box. */
  markArt: 65,
  /**
   * Line heights are Figma's own text-box heights, not the typeface's default.
   * The frame sets `leading: normal`, which under GIP gives a 22 box at 18 and a
   * 16 box at 14 (its 48-tall body is three of them). Manrope's normal leading is
   * wider, so left alone the title box grows to 24 and pushes the body 2 down —
   * stating Figma's boxes keeps the column where it was drawn. Same treatment as
   * every other measured text in this file.
   */
  title: { size: 18, line: 22, color: '#000000' },
  body: { size: 14, line: 16, color: '#898989' },

  /** Buttons: two in a 343 row at bottom 40, 165 each with 13 between them. */
  buttonsBottom: 40,
  buttonHeight: 48,
  buttonRadius: 22,
  buttonGap: 13,
  buttonLabel: 16,
  ghostBorder: '#E0E0E0',
  ghostLabel: '#5C5C5C',
  /** `linear-gradient(135.94deg, #F05327 11.557%, #FD8456 88.443%)`. */
  primaryAngle: 135.941,
  primaryFill: ['#F05327', '#FD8456'] as const,
  primaryStops: [0.11557, 0.88443] as const,
  primaryLabel: '#FFFFFF',
} as const;

/**
 * Biometric opt-in copy, verbatim from Figma `15726:76357`.
 *
 * `{label}` is the one substitution: the frame says "Face ID" because it was
 * drawn on an iPhone, but the same sheet has to offer a fingerprint on a phone
 * with a fingerprint reader. `biometricLabel()` supplies the device's own name
 * for what it has.
 *
 * "тахиулан" is reproduced as drawn. It reads like a slip for "таниулан"
 * ("by identifying"), but the design is the specification.
 */
export const biometricCopy = {
  title: '{label}-аар нэвтрэх үү?',
  body: 'Дараагийн удаа нууц үг оруулахгүй {label} таниулан нэвтэрнэ. Тохиргоог хүссэн үедээ унтраах боломжтой.',
  decline: 'Одоо биш',
  accept: 'Идэвхжүүлэх',
} as const;

/**
 * QR scan screen — Figma `14656:64053` ("iPhone 13 mini - 40"), a full-bleed
 * camera behind a dimming scrim with a cut-out scan window.
 *
 * Every offset below is measured off that 375 × 812 board. The two that cannot
 * survive a different screen size are the scan window and the control row, and
 * both are anchored the way the board itself describes them: the window to the
 * screen's centre, the controls to the bottom chrome.
 *
 * The board draws the frame's decorations slightly off each other — the bracket
 * group is centred on x 183.5 while the scrim's hole is centred on x 187.3, and
 * their vertical centres differ by 2. Nothing in the design asks for a scan
 * window whose frame and window are 4 apart, so both are drawn concentric on
 * the offset the group node itself carries (`top: calc(50% + 11px)`); their
 * sizes are Figma's untouched. See migration-progress.md §30.
 */
export const figmaScan = {
  /** `Subtract`: black at 50% over the whole frame, minus the window. */
  scrim: 'rgba(0,0,0,0.5)',

  /**
   * The cut-out itself, from the scrim path: x 63…311.617, y 294…541 at
   * radius 20 — 248.617 × 247, not quite square.
   */
  window: { width: 248.617, height: 247, radius: 20 },
  /**
   * `Rectangle 288`: four corner brackets on a 305 box under a 5-wide round
   * stroke, so the art measures 310. The stroke is the brand gradient run
   * corner to corner, which the SVG carries itself.
   */
  brackets: 310,
  /** Both are centred on the screen, 11 below its middle. */
  windowOffsetY: 11,

  /** The segmented control: two 165 × 38 pills at radius 35, 13 apart. */
  segment: {
    top: 24,
    width: 165,
    height: 38,
    gap: 13,
    radius: 35,
    labelSize: 14,
    labelLine: 16,
    /** `linear-gradient(142.545deg, #F05327 11.557%, #FD8456 88.443%)`. */
    activeAngle: 142.545,
    active: ['#F05327', '#FD8456'] as const,
    activeStops: [0.11557, 0.88443] as const,
    inactive: 'rgba(245,243,246,0.1)',
    ink: '#FFFFFF',
  },

  /**
   * The torch and gallery buttons: 48 squares at radius 20, 40 apart, drawn on
   * the board at y 612 — which is 21 above the raised scan button's top edge,
   * and that is how they are anchored here so they hold their gap to the bar on
   * any inset.
   */
  controls: {
    size: 48,
    radius: 20,
    gap: 40,
    gapAboveFab: 21,
    fill: 'rgba(255,255,255,0.1)',
    border: '#FFFFFF',
    iconBox: 24,
  },

  /**
   * `Component 604` — the tab bar's over-camera variant. Same 343 × 70 at
   * radius 27 and the same four shadows as `figmaTabBar`; only the surface and
   * the ink change, and a 35px backdrop blur goes behind it.
   */
  bar: {
    surface: 'rgba(252,252,252,0.14)',
    ink: '#FFFFFF',
    /**
     * Figma's `backdrop-blur-[35px]` is a pixel radius; `expo-blur`'s
     * `intensity` is an opaque 1…100 scale with no published mapping, so this
     * is the one value on the screen that is matched by eye rather than
     * measured.
     */
    blurIntensity: 35,
  },
} as const;

/**
 * My QR — Figma `14656:64128` ("iPhone 13 mini - 31").
 *
 * The scanner's other half: the same segmented control at the top, the user's
 * own code on a white card in the middle of the screen, their name and account
 * under it, and a share / copy pair. The page is light, so the floating bar
 * keeps its solid variant here — only the scanner turns it to glass.
 *
 * The block (`14656:64136`) is 225 × 359 centred on the frame. Everything
 * inside it is measured from the board: a 230 card, 16, the two text lines,
 * then the buttons pinned 2 below the block's own bottom.
 */
export const figmaMyQr = {
  page: '#FCFCFC',

  /**
   * The segmented control's light variant. Geometry is `figmaScan.segment`'s —
   * the same two 165 × 38 pills 13 apart, with the active one swapped over to
   * "Миний QR". Only the unselected pill differs: over the camera it is a 10 %
   * white wash, here a `#EDF0FD` hairline on the page itself.
   */
  segment: { border: '#EDF0FD', ink: '#96A5BA' },

  /**
   * The note. Figma centres it on y 165, which is 121 below the status bar; at
   * the design's three lines of 18 that puts its top at 94. Anchoring the top
   * rather than the centre is what keeps it from drifting if it wraps to four.
   */
  note: { top: 94, width: 281, size: 14, line: 18, ink: '#8A8A8A' },

  /** `14656:64136`: 225 × 359, centred on the frame half a pixel low. */
  block: { width: 225, height: 359, offsetY: 0.5, gap: 16 },

  /**
   * The card and the code on it. Figma draws the art at a 5 % inset of the
   * card — 207 inside 230 — on its own `#F8F8F8` panel at the same radius.
   *
   * The code's own geometry, all measured off the exported SVG: a 23 quiet
   * zone inside the 207, leaving 161 for the matrix, which at the design's
   * 25 modules is a 6.44 pitch. Modules are drawn as circles a module across,
   * so a run of them reads as a capsule. The three eyes are a 7-module rounded
   * square, hollowed to 6, with a round 3-module pupil; 17.25 of corner radius
   * on a 6.44 module is the 2.6785 below, and it is used for the hole as well
   * as the frame, which is what makes the ring thin at the corners.
   */
  card: {
    size: 230,
    radius: 40,
    fill: '#FFFFFF',
    shadow:
      '0px 0px 32px rgba(0,0,0,0.04), 0px 0px 24px rgba(0,0,0,0.04), 0px 0px 8px rgba(0,0,0,0.04), 0px 0px 1px rgba(0,0,0,0.04)',
    /** The art's box inside the card, and the panel it is drawn on. */
    art: 207,
    panel: '#F8F8F8',
    ink: '#000000',
    /** In modules, not pixels: the pitch follows the data's own matrix size. */
    quiet: 23 / 6.44,
    eyeRadius: 17.25 / 6.44,
    eyeRing: 0.5,
    pupil: 3,
  },

  /** "Erdenebayar" bold and black, the surname medium and `#5C5C5C`. */
  name: { size: 16, line: 24, first: '#000000', rest: '#5C5C5C' },
  /** The prefix regular and grey, the number bold and near-black. */
  account: { size: 14, line: 19.6, prefix: '#6B7280', number: '#494949' },

  /** Share and copy: 48 squares at radius 20, 40 apart, on a `#E0E0E0` hairline. */
  actions: { size: 48, radius: 20, gap: 40, fill: '#FFFFFF', border: '#E0E0E0', iconBox: 24 },
} as const;

/* -------------------------------------------------------------------------- */
/*  Accounts — Figma `14765:54878` ("IPhone 13 mini")                          */
/* -------------------------------------------------------------------------- */

/**
 * The Accounts screen's own tokens, from the redesign frame rather than from
 * the HTML prototype.
 *
 * The prototype's Account tab is a large title over a four-up pill control and
 * a stack of tinted cards; the redesign is a centred 56 navigation bar, a white
 * 52 segmented track floating on a `#F0F1F3` page, and one card per account at
 * a fixed 118. They overlap in content and in nothing else, so — as with Home
 * in §26 — these are additive, and `accountPalette` is left where it is for the
 * three sub-tabs the redesign does not draw.
 *
 * Every offset is Figma's, measured down from the bottom of the 44pt status
 * bar: the navigation bar's y 46 is the `nav.top` of 2 below.
 *
 * Only a light frame exists. The `dark` half is derived, and says what from;
 * nothing in it is measured.
 */
export const figmaAccounts = {
  /** `Navigation Bar` — 375 × 56 at y 46, the title centred on it. */
  nav: {
    top: 2,
    height: 56,
    titleSize: 16,
    titleLine: 28,
    /** The eye button: a 40 square at radius 14, 16 in from the right edge. */
    button: 40,
    buttonRadius: 14,
    side: 16,
    /** Figma's box for the glyph inside it; the art is 16.2562 × 15.4226. */
    glyph: 20,
    eyeArt: { width: 16.2562, height: 15.4226 },
  },

  /**
   * `14765:55205` — the sub-tab track: 343 × 52 at radius 18, 6 below the
   * navigation bar, with four pills inset 8 and 8 apart.
   *
   * Figma's pills are 76/76/76/75, which is the track's own width shared out;
   * they are laid out as four equal flex children so the row keeps filling the
   * track on a screen wider than the 375 board.
   */
  segment: {
    top: 6,
    height: 52,
    radius: 18,
    pad: 8,
    gap: 8,
    pillHeight: 36,
    pillRadius: 14,
    labelSize: 14,
    /** `linear-gradient(122.4deg, #F05327 11.557%, #FD8456 88.443%)`. */
    activeAngle: 122.4014,
    active: ['#F05327', '#FD8456'] as const,
    activeStops: [0.11557, 0.88443] as const,
    activeInk: '#FFFFFF',
    /** `Xac/color` — three brand-tinted drop shadows stacked at the origin. */
    shadow:
      '0px 0px 24px rgba(246,107,62,0.06), 0px 0px 6px rgba(246,107,62,0.04), 0px 0px 1px rgba(246,107,62,0.04)',
  },

  /** The list starts 16 below the track, at the page's own 16 side inset. */
  list: { top: 16, gap: 16, side: 16 },

  /**
   * One account — `15860:77246`, 343 × 118 at radius 24 with its content inset
   * 16 and stacked at gap 10: a 36 identity row, the hairline, a 28 row.
   *
   * The height is Figma's and is fixed, and the inner block is centred in it
   * (17 clear above and below the 84 of content), so a longer name grows away
   * from both edges rather than pushing the card.
   */
  card: {
    height: 118,
    radius: 24,
    pad: 16,
    gap: 10,
    identityHeight: 36,
    footHeight: 28,
    /** The wallet tile: a 32 square at radius 10, its 20 glyph box inset 6. */
    icon: {
      box: 32,
      radius: 10,
      glyph: 20,
      /** The art inside that 20 box — not centred, so it is placed. */
      art: { width: 17.0899, height: 16.2563, left: 1.872, top: 1.872 },
    },
    /** Tile to text, then the name row to the account type under it. */
    iconGap: 10,
    nameGap: 5,
    nameSize: 14,
    nameLine: 17,
    verified: 16,
    verifiedGap: 6,
    typeSize: 12,
    typeLine: 14,
    /** `10,254,321` at 18 with `.00 ₮` at 14 beside it, on one 22 line. */
    amountSize: 18,
    amountLine: 22,
    centsSize: 14,
    /** The IBAN row: 14 text, then the 12 copy box 6 after it. */
    ibanSize: 14,
    ibanLine: 17,
    copy: 12,
    copyArt: 13,
    copyGap: 6,
    /** `Grand / Badge Tags` — 64 × 28 at radius 12, its label 12/16. */
    badge: { width: 64, height: 28, radius: 12, labelSize: 12, labelLine: 16 },
  },

  /**
   * `15331:57940` — "Open a new account": 343 × 48 at radius 22 under a dashed
   * brand hairline, its label filled with
   * `linear-gradient(159.72deg, #F05327 11.557%, #FD8456 88.443%)`.
   *
   * React Native cannot fill text with a gradient, so the label is masked the
   * same way the selected tab's is — see `FloatingTabBar`'s `ActiveLabel`.
   */
  open: {
    height: 48,
    radius: 22,
    labelSize: 14,
    labelLine: 17,
    angle: 159.7157,
    /** The gradient's midpoint, for the mask's own fill. See `ActiveLabel`. */
    mid: '#F66B3E',
    /**
     * The dash, measured off Figma's own render of the button: runs of 9.29
     * ink to 6.43 of gap, a 15.71 period, held to ±0.5 over fifteen periods.
     *
     * React Native's `borderStyle: 'dashed'` has no say in either number — it
     * draws the platform's own pattern, which is roughly 3 and 3 and reads as
     * a dotted line at this scale. So the border is an SVG rounded rect with
     * this `strokeDasharray` instead, and the view carries no border at all.
     */
    dash: [9.29, 6.43] as const,
  },

  light: {
    page: '#F0F1F3',
    surface: '#FFFFFF',
    /** `textcolorblack/primary`. */
    ink: '#000000',
    /** `textcolorblack/tertiary` — the account type and the IBAN's prefix. */
    tertiary: '#898989',
    /** The `.00 ₮` after the balance. */
    cents: '#5C5C5C',
    /** `Line 134`: `#F5F3F6` at 40%. */
    divider: 'rgba(245,243,246,0.4)',
    /** The wallet tile behind the glyph. */
    iconFill: '#FBF5F3',
    /** `brandcolor/50` under `brandcolor/500❖`. */
    badgeFill: '#FEF0E6',
    badgeInk: '#F26800',
    /** The selected account's ring. */
    primaryBorder: '#F05327',
    /** The navigation bar's eye button, and the glyph's own fill. */
    navButton: '#FFFFFF',
    navGlyph: '#5C5C5C',
    /** The copy glyph's stroke, as exported. */
    copyInk: '#898989',
  },

  /**
   * Derived, not designed — the redesign shipped one light frame.
   *
   * The page and the card surface are Home's own Knight values, so the two tabs
   * read as one app; the divider and the two tints are the light frame's
   * colours restated as washes of white or of the brand over that surface. The
   * brand inks and the selected account's ring are unchanged, because they are
   * the brand.
   */
  dark: {
    page: '#0D0B0A',
    surface: 'rgba(255,255,255,0.1)',
    ink: '#FFFFFF',
    /**
     * The light frame's own `#898989` — still legible on `#0D0B0A`, and keeping
     * it is what holds the hierarchy the frame draws between the name and the
     * account type under it.
     */
    tertiary: '#898989',
    /** `#5C5C5C` reflected about the surface — `figmaTabBar.inactive`. */
    cents: '#B7B7B7',
    divider: 'rgba(255,255,255,0.1)',
    iconFill: 'rgba(240,83,39,0.14)',
    badgeFill: 'rgba(242,104,0,0.16)',
    badgeInk: '#F26800',
    primaryBorder: '#F05327',
    navButton: 'rgba(255,255,255,0.1)',
    navGlyph: '#FFFFFF',
    copyInk: '#B7B7B7',
  },
} as const;

/** The mode-dependent half of {@link figmaAccounts}. */
export type FigmaAccountTokens = (typeof figmaAccounts)['light' | 'dark'];

/**
 * The two accounts the redesign frame draws, with its own strings and amounts.
 *
 * Mock rows, as in the frame: there is no accounts endpoint yet, and this is
 * the one place that changes when there is. `primary` is the orange ring Figma
 * puts on the first card and `verified` the tick beside its name — both are
 * per-account marks in the design, not a "first row" rule.
 */
export const figmaAccountsList = [
  {
    name: 'Хүнс',
    type: 'Харилцах данс',
    iban: { prefix: 'MN32 0000 ', number: '5000000000' },
    amount: '10,254,321',
    cents: '.00',
    currency: '₮',
    verified: true,
    primary: true,
  },
  {
    name: 'Хүүхэд',
    type: 'Харилцах данс',
    iban: { prefix: 'MN32 0000 ', number: '5000000000' },
    amount: '1,321',
    cents: '.00',
    currency: '$',
    verified: false,
    primary: false,
  },
] as const;

/** The screen's own strings, exactly as the frame writes them. */
export const accountsCopy = {
  title: 'Accounts',
  open: '＋ Open a new account',
  statement: 'Хуулга',
} as const;

/**
 * The chrome both account sheets share — Figma `15338:61406` and `16058:37255`.
 *
 * A `#F0F1F3` panel with a 30 top radius, a grabber at 12, and a 40-tall title
 * row at 32 whose close button sits 16 in from the right edge. Below the
 * content, Figma leaves the 34 of the iPhone 13 mini's home-indicator band; a
 * deeper inset than that grows the sheet rather than eating into the content,
 * which is the same `lift` the login screen and the biometric sheet use.
 *
 * Neither frame is drawn in dark. The dark half below is derived from the
 * Accounts screen's own dark tokens, which is the surface these sheets rise
 * from — it is a reasonable reading of the design system, not a designed frame.
 */
export const accountSheet = {
  radius: 30,
  gutter: 16,
  /** Same iPhone 13 mini reference as `loginLayout.referenceSafeBottom`. */
  referenceSafeBottom: 34,

  grabberWidth: 24,
  grabberHeight: 4,
  grabberTop: 12,

  /** The title row: y 32, 343 × 40 with 8 of padding above and below the text. */
  headerTop: 32,
  headerHeight: 40,
  headerPad: 8,
  titleSize: 16,
  titleLine: 24,
  /** `Use icon / Close`: a 24 box holding 9.5 of art, at the right gutter. */
  closeBox: 24,
  closeArt: 9.5,

  /** `Use icon / Right`: a 24 box holding 5.5 × 9.5 of art. */
  chevronBox: 24,
  chevronArt: { width: 5.5, height: 9.5 },

  /** The section headers Figma calls "Navigation Bar" — 44 tall, text at 16. */
  sectionHeight: 44,
  sectionSize: 14,
  sectionLine: 24,

  /** The brand gradient, at each frame's own angle. */
  brand: ['#F05327', '#FD8456'] as const,
  brandStops: [0.11557, 0.88443] as const,

  light: {
    page: '#F0F1F3',
    surface: '#FFFFFF',
    ink: '#000000',
    secondary: '#5C5C5C',
    tertiary: '#898989',
    quaternary: '#B7B7B7',
    grabber: '#D9DBE9',
    divider: '#F5F3F6',
    tile: '#F5F5F6',
    /** The one destructive tile — "Close account". */
    tileDanger: 'rgba(247,82,95,0.1)',
    chip: '#F5F5F5',
    scrim: 'rgba(22,28,38,0.55)',
  },
  dark: {
    page: '#0D0B0A',
    surface: 'rgba(255,255,255,0.1)',
    ink: '#FFFFFF',
    secondary: '#B7B7B7',
    tertiary: '#898989',
    quaternary: '#B7B7B7',
    grabber: 'rgba(255,255,255,0.2)',
    divider: 'rgba(255,255,255,0.1)',
    tile: 'rgba(255,255,255,0.08)',
    tileDanger: 'rgba(247,82,95,0.16)',
    chip: 'rgba(255,255,255,0.08)',
    scrim: 'rgba(0,0,0,0.6)',
  },
} as const;

export type AccountSheetTokens = (typeof accountSheet)['light' | 'dark'];

/**
 * "Account detail" — Figma `15338:61406`.
 *
 * 375 × 683 of the 812 board. Everything below the title row scrolls: the two
 * sections together are taller than the 561 Figma gives them, which is why the
 * frame's own body is an overflow-auto column.
 */
export const accountDetailSheet = {
  height: 683,
  /** The scrolling body starts at 88 and its children are 6 apart. */
  bodyTop: 88,
  bodyGap: 6,
  /** The two cards at the top of the body are 16 apart. */
  headGap: 16,

  /** The gradient balance card: 343 at radius 20, px 16 / py 12, rows 16 apart. */
  balance: {
    radius: 20,
    padX: 16,
    padY: 12,
    gap: 16,
    angle: 136.166,
    /** Row 1: the name and the amount, on a 22 line. */
    rowHeight: 22,
    verified: 16,
    nameGap: 6,
    nameSize: 14,
    nameLine: 17,
    pen: 16,
    /** The pen's 10.33 of art, scaled into the 17.71 %-inset box of the 16. */
    penArt: 11.333,
    amountSize: 18,
    amountLine: 22,
    centsSize: 14,
    centsInk: 'rgba(255,255,255,0.8)',
    /** Row 2: the account line and the Statements pill. */
    metaGap: 6,
    metaSize: 12,
    metaLine: 14,
    metaInk: '#F8F8F8',
    copyBox: 16,
    copyArt: 17,
    pill: { width: 90, height: 37, radius: 21, labelSize: 12, labelLine: 14 },
    pillFill: 'rgba(255,255,255,0.1)',
    pillBorder: 'rgba(255,255,255,0.5)',
    pillInk: '#FAFAFC',
  },

  /**
   * The "Account reference" banner. This is the same dark gradient the Loans
   * tab's `DarkToolCard` draws, but at this frame's own measurements — 344 × 85
   * at radius 24 with a 44 ringed tile — so it is stated here rather than
   * bent into that component, which the un-redesigned panels still use.
   */
  reference: {
    width: 344,
    height: 85,
    radius: 24,
    angle: 109.773,
    fill: ['#535664', '#202D3A'] as const,
    stops: [0.024882, 0.97185] as const,
    tile: { left: 16, size: 44, radius: 30, glyph: 24 },
    tileFill: 'rgba(255,255,255,0.2)',
    tileBorder: '#FFFFFF',
    textLeft: 70,
    textGap: 6,
    titleSize: 16,
    titleLine: 19,
    subSize: 12,
    subLine: 14,
    subWidth: 136,
    subInk: 'rgba(255,255,255,0.8)',
    /**
     * Figma anchors the pill at x 237 in a 344 card. Held from the right
     * instead, so it stays where it was drawn relative to the edge it is
     * nearest on a screen wider than the 375 board. `textRight` stops the
     * title at the pill's left edge for the same reason.
     */
    pillRight: 344 - 237 - 90,
    textRight: 344 - 237,
  },

  /**
   * Both list cards: 343 white at radius 20, 16 of padding, rows 33 tall with
   * 12 above and below each divider. The dividers are zero-height slots in
   * Figma with a 1px line drawn across them, so the rule is pulled half a pixel
   * into the gap either side rather than adding its own height to the card.
   */
  card: {
    radius: 20,
    pad: 16,
    gap: 12,
    shadow:
      '0px 0px 24px rgba(0,0,0,0.06), 0px 0px 6px rgba(0,0,0,0.04), 0px 0px 1px rgba(0,0,0,0.04)',
    rowGap: 8,
    tile: 32,
    tileRadius: 10,
    tileGlyph: 14,
    labelGap: 4,
    labelSize: 12,
    /**
     * Figma's own text boxes, not Manrope's natural leading: the frame sets
     * `leading: normal`, which under GIP gives a 15 box for the title and a 14
     * for the subtitle. Left to itself Manrope draws each about 16.4, which
     * adds four to every row and thirty to the seven-row Manage card.
     */
    labelLine: 15,
    subLine: 14,
    valueSize: 14,
    valueLine: 17,
  },
} as const;

/**
 * "Open an account" — Figma `16058:37255`.
 *
 * 375 × 418. Nothing scrolls: three products and a Continue button.
 */
export const openAccountSheet = {
  height: 418,
  /** The section header sits 6 under the title row here, not 16. */
  sectionTop: 78,
  cardTop: 131,
  card: {
    radius: 20,
    pad: 16,
    gap: 10,
    shadow:
      '0px 0px 12px rgba(0,0,0,0.06), 0px 0px 3px rgba(0,0,0,0.04), 0px 0px 0.5px rgba(0,0,0,0.04)',
    rowHeight: 32,
    rowGap: 8,
    tile: 32,
    tileRadius: 10,
    verified: 16,
    labelSize: 14,
    labelLine: 17,
    /**
     * Figma draws the rule 316 wide inside a 311 content column, so it runs 5
     * past the rows on the right. Reproduced rather than tidied — it is a
     * measured value, and the detail sheet's own rules are flush at 311.
     */
    dividerOverhang: 5,
    chip: { width: 80, height: 22, radius: 10, labelSize: 12, labelLine: 14 },
  },
  cta: {
    bottom: 40,
    height: 48,
    radius: 22,
    angle: 155.038,
    labelSize: 16,
    labelLine: 19,
    labelInk: '#FFFFFF',
  },
} as const;

/**
 * The literal content of both sheets, as the frames set it.
 *
 * The detail sheet's identity row is filled from whichever account was tapped;
 * everything below it is the frame's own copy, because there is no data behind
 * it yet. `balance` holds the frame's literals for the case where the sheet is
 * opened without an account.
 */
export const accountSheetCopy = {
  detail: {
    title: 'Account detail',
    fallback: {
      name: 'Everyday',
      type: 'MNT Current account',
      iban: 'MN32 0000 5000000000',
      amount: '987’654’321',
      cents: '.00',
      currency: '₮',
    },
    statements: 'Statements',
    reference: {
      glyph: '📄',
      title: 'Account reference',
      sub: 'Official bank statement · fee 30\'000₮',
      cta: 'Reference',
    },
    interest: {
      header: 'Interest · up to 3%',
      rows: [
        { glyph: '📈', title: 'Your rate now', sub: 'Set by your balance band', value: '1.2%', dim: true },
        { glyph: '💰', title: 'Accrued this month', sub: 'Calculated daily, paid month-end', value: '+3\'980₮', dim: true },
        { glyph: '🧾', title: 'Paid this year', sub: 'Calculated daily, paid month-end', value: '41\'250₮', dim: false },
      ],
    },
    manage: {
      header: 'Manage',
      rows: [
        { key: 'sms', glyph: '📩', title: 'SMS notification', sub: 'in over 100\'000₮ · out over 100\'000₮', value: '1.2%' },
        // The only tile glyph that is type rather than an emoji: Figma sets this
      // fullwidth plus in GIP ExtraBold, so it needs a weight the others do not.
      { key: 'add', glyph: '＋', title: 'Add money', sub: 'From another card, bank transfer', bold: true },
        { key: 'analyser', glyph: '📈', title: 'Account analyser', sub: '3–6 month spending behaviour' },
        { key: 'statements', glyph: '🧾', title: 'Statements', sub: 'PDF · last 24 months' },
        { key: 'standing', glyph: '🔁', title: 'Standing orders', sub: '2 active' },
        { key: 'transactions', glyph: '📊', title: 'Transactions', sub: '12 on this account' },
        { key: 'close', glyph: '⚠️', title: 'Close account', danger: true },
      ],
    },
  },
  open: {
    title: 'Open an account',
    header: 'Бүтээгдэхүүн',
    products: [
      { key: 'current', label: 'Харилцах данс' },
      { key: 'demand', label: 'Хугацаагүй хадгаламж' },
      { key: 'child', label: 'Хүүхдийн мөнгөний данс', chip: 'Тун удахгүй' },
    ],
    cta: 'Continue',
  },
} as const;

/**
 * "Notification" — Figma `15804:47480`. Opened from the Home header's bell
 * (`GreetingHeader`'s `onNotifications`), as a full-screen modal rather than a
 * bottom sheet: the frame draws its own status bar and home indicator, and has
 * no bottom-anchored sheet chrome the way the account sheets do.
 *
 * Only one frame exists — no dark variant — so this is a fixed light palette,
 * the same posture `loginPalette` and the login screen's `bio`/`pw` views take
 * where Figma covers only one mode.
 *
 * The card height in Figma (125 for the first row, 102 for the rest) is just
 * however far each row's own copy happened to wrap, not a rule — reproduced
 * here as intrinsic content height (padding + the title row + a 6 gap + the
 * body, unclamped) rather than a fixed number that would stop matching the
 * moment real notification text differs in length.
 */
export const notificationsLayout = {
  /** `Navigation Bar` — 56 tall, flush under the status bar. */
  navHeight: 56,
  /** `Main / Button/.../Default`: 56 square, a 24 icon slot padded by 16. */
  backBox: 56,
  backIconBox: 24,
  backArt: { width: 15.5, height: 11.5 },
  titleSize: 16,
  titleLine: 24,

  /** The list: 343 wide at the page's own 16 gutter, 16 below the nav bar. */
  gutter: 16,
  listTop: 16,
  cardGap: 16,

  cardRadius: 20,
  cardPadTop: 11,
  cardPadSide: 11,
  cardPadBottom: 12,
  iconGap: 10,
  iconBox: 24,
  bellArt: { width: 18.5, height: 21.5 },
  /** Gap between the icon/title row and the body line below it. */
  bodyGap: 6,

  titleTextSize: 14,
  titleTextLine: 24,
  bodyTextSize: 14,
  bodyTextLine: 24,

  /** Read cards settle to this; unread ones stay at full opacity. */
  readOpacity: 0.6,
} as const;

export const notificationsPalette = {
  page: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#F5F3F6',
  ink: '#000000',
  secondary: '#5C5C5C',
  tertiary: '#898989',
  backArrow: '#505050',
  /** `Хас 2` at a third the spread — the same shadow `figmaHome.light.rowShadow` names. */
  cardShadow:
    '0px 0px 12px rgba(0,0,0,0.06), 0px 0px 3px rgba(0,0,0,0.04), 0px 0px 0.5px rgba(0,0,0,0.04)',
} as const;

export type NotificationTone = 'secondary' | 'tertiary';

export const notificationsCopy = {
  title: 'Notification',
  items: [
    {
      id: 'n1',
      unread: true,
      title: 'Валют арилжааны хэлцэл',
      body: 'Таны валют арилжааны хэлцэл зөвшөөрөгдлөө. Гүйлгээ цэсээр орж ашиглаарай.',
      tone: 'secondary' as NotificationTone,
    },
    {
      id: 'n2',
      unread: true,
      title: 'Урамшуулал олгов.',
      body: 'Хасбанкны дансандаа амжилттай орлого хийсний 100 reward урамшуулал олголоо.',
      tone: 'tertiary' as NotificationTone,
    },
    {
      id: 'n3',
      unread: false,
      title: 'Урамшуулал олгов.',
      body: 'Хасбанкны дансандаа амжилттай орлого хийсний 100 reward урамшуулал олголоо.',
      tone: 'tertiary' as NotificationTone,
    },
    {
      id: 'n4',
      unread: false,
      title: 'Урамшуулал олгов.',
      body: 'Хасбанкны дансандаа амжилттай орлого хийсний 100 reward урамшуулал олголоо.',
      tone: 'tertiary' as NotificationTone,
    },
  ],
} as const;
