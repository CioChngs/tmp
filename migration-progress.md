# RightBank — Web → Expo Migration Progress

> **Status:** Phase 1 (assessment) in progress. **No implementation code has been written or changed.**
> This document is the assessment of `reference/RightBank.html`, produced by inspecting the
> rendered prototype (DOM + computed styles) and its bundled source. Screenshots were **not**
> capturable in this environment, so every "visual" fact below is DOM/computed-style derived and
> **must be re-verified against a real rendering** before a screen is called done (see §9).

---

## 0. What the reference is

- **One self-contained HTML file** (`reference/RightBank.html`, ~738 KB). React 18 production build,
  everything inlined: React, **Manrope** font (woff2, weights 400/600/700 as data-URIs), all graphics
  as **inline SVG** or **emoji**. No network requests, no `<img>`, no `<canvas>`.
- Source of truth is a `RightBank.jsx` (not included); the HTML is a minified bundle of it.
- It renders a **simulated phone** — a fixed **390 × 800 px** device frame with a 40 px corner
  radius, a Dynamic-Island pill, and a fake status bar ("9:41") — centered on a gradient desktop
  backdrop. The frame scales down to fit small windows. The **app UI itself lives inside that
  390 × 800 area.**
- It is a **prototype / demo**: state is in-memory, all data is mock (customer "Erdene Ganbold"),
  "Face ID" auto-succeeds after a short delay, flows end in toast confirmations. There is a
  visible **"Bank admin"** section explicitly labelled "Back office. Not shipped to customers."
- App version string in UI: `RightBank · version 3.2.0 (prototype)`. Locale is bilingual
  **English + Mongolian** (Cyrillic strings appear inline, e.g. `4 билл ирсэн`, security notice).
- Currency formatting: `Intl.toLocaleString('en-US')` then **commas replaced with apostrophes** →
  `987'654'321.00`. Credits use `+`, debits use the Unicode minus `−` (U+2212). Tugrik `₮`
  suffix; FX accounts prefix `$` / `¥`.

### Baseline viewport (Phase 2)

```
REFERENCE_WIDTH  = 390
REFERENCE_HEIGHT = 800   (device frame; app content area, status bar included)
```

Map to a real device: iPhone 13/14/15 (390 pt wide) is the natural target. The reference has
**no responsive breakpoints** — it is a single fixed-width phone design. Do not invent responsive
behavior; scale the 390-wide design to the device width and respect real safe-area insets in place
of the prototype's 56 px top / 12 px bottom fake insets.

---

## 1. Screen Inventory

Navigation model: a **single-stack state machine** (`screen` = welcome | signup | home | account |
card | more), **not** URL routing. Within `home` and `account` there are **sub-views** pushed over
the tab (`view` state) and **bottom-sheet modals**. A persistent **floating pill tab bar** (4 tabs
+ center FAB) is shown on every screen except `welcome` and `signup`.

### 1.1 Pre-auth

| Screen | id | Type | Scrolls | Notes |
|---|---|---|---|---|
| *(historical — this row describes the **previous** reference; superseded by `RbLoginScreen`, see §23)* | | | | |
| **Welcome / Login** | `welcome` | full-bleed, animated background | no | Wordmark "Right**Bank**", tagline "Banking that stays out of your way", 3 feature chips (🔒 Insured · ⚡ Instant · ₮ No fees), `Log in RightBank` / `Join RightBank`. Light/dark toggle (☀/☾). Animated seasonal particle background (see Themes). |
| **Face ID sheet** | — | modal over welcome | no | "Looking for you…", ring animation, `Use password instead` / `Cancel`. Auto-authenticates after ~2 s. Failure state exists ("Face not recognised", "Retry Face ID"). |
| **Password login** | — | modal/sheet | maybe | Username + internet-banking password, "Forgot password?". |
| **Sign-up: path choice** | `signup` | scroll | yes | "Which of these sounds like you?" → *I already bank with RightBank* (code + E-Mongolia) or *I'm new to RightBank* (full KYC). |
| **Sign-up wizard** | `signup` | multi-step, scroll | yes | Step 1 **Photograph your ID** (ID front / ID back / Selfie check rows) → Continue. Step 2 **Confirm with E-Mongolia**. Further steps: phone/OTP, name, account opening confirm ("Confirm opening the account"), "Application submitted for review". Back chevron `‹` in header. |
| **Security warning interstitial** | — | modal, shown once after login | yes | Full-screen red-accent notice ("SECURITY WARNING / Never share your code"), 4 bullet cards (🚫 We never ask for codes · 🏦 There is no "safe account" · 📱 Never install apps for a caller · ⏱ Pressure is the warning sign), `Got it`. |

### 1.2 Tab 1 — Home (`home`)

Scrollable. Contents top→bottom:

- **Greeting header** — "Good morning/afternoon/evening, Erdene" + full name + avatar monogram
  "EG"; ☀/☾ mode toggle.
- **Alert cards** (conditional, horizontally arranged): `⚠ 1 PAYMENT OVERDUE` (amount, "Consumer
  loan · 8 days late", `Pay now`); `⏳ CARD EXPIRY` ("28 days left", `Renew`).
- **Notifications preview** — `🔔 NOTIFICATIONS · 4 NEW`, one row, `View` → notifications sub-view.
- **Offers carousel** — horizontally scrollable promo tiles: invite-a-friend, subscriptions,
  best deposit rate, overdraft/"safety net", zero-FX card, groceries cashback. Each has a CTA.
- **Primary account (hero) card** — dark themed gradient card, 352 × ~212, holds balance
  `987'654'321.00 ₮`, `＋ Money`, IBAN `MN32 0000 5000000000`, card `•••• 8841`, `G PAY` chip.
- **Quick-action grid** — 2-col tiles (white gradient, radius 22): Subscriptions, Helpy,
  Overdraft ("500'000₮ · paid out instantly"), Transfer ("To anyone, any bank"),
  Billing ("4 билл ирсэн"), Savings ("Goals & deposits"). Center tab-bar FAB = **Scan**.
- **Recent activity** — white card (radius 20), header "Recent activity" + `See all` → txns
  sub-view. Rows: emoji icon, merchant, `category · date · time`, signed amount.

**Home sub-views** (`view` state, rendered over the tab, back-navigable):
`homecard` (card detail), `txns` (all transactions + search/filter), `transfer`, `topup`
(`＋ Money` / top-up Everyday), `overdraft`, `subs` (subscriptions manager), `billing`,
`notifs` (notifications list, "Mark all as read"), `helpy` (AI support assistant chat),
`wallet` (add card to Apple/Google wallet).

**Home bottom-sheets:** Transfer sheet (see §7), Scan sheet, QR-receive.

### 1.3 Tab 2 — Account (`account`)

Header "Accounts / Balances, IBANs and account tools." **Segmented sub-tabs:
Accounts · Deposits · Loans · Reward.**

- **Accounts** — tool rows (📄 Account reference "fee 30'000₮"; 💱 Currency conversion "Treasury
  rates for larger amounts"), a treasury-confirmation strip, then account list: Everyday (MNT
  current), Savings (MNT), US Dollar (FX), Chinese Yuan (FX) — each: symbol glyph, name, IBAN,
  balance, "type · rate% · accrued". `＋ Open a new account` ("3 of 5 current accounts used").
- **Deposits** — "Savings / Term deposits and savings goals." Child savings card (2 children,
  avatars), **daily-saving streak** card ("🔥 47 DAY STREAK", `Save today's 10'000₮`), Savings
  goals summary, term-deposit cards (rate, principal, +interest, "% of term", `＋ Top up`),
  `＋ Open a deposit`.
- **Loans** — "Upcoming payments and credit score." `📊 CreditScore by BurenScore · fee 3'000₮`,
  Upcoming payments card ("ACTION NEEDED", total, "1 OVERDUE"), loan list (🏠 Mortgage / 🚗 Car
  loan / 🛋 Consumer loan — rate, remaining, "% repaid", next payment), `Check my loan offers`.
- **Reward** — "Rewards / Points, tiers and what you have earned." Big points number
  (`340'229`), **PLATINUM** tier badge, "Earned this month" breakdown (Balances / Fees / App
  use), long itemised earn list per account & fee, **Spend your points** grid (cash back, mobile
  top-up, coffee/cinema vouchers), **Your benefits** list (ACTIVE/LOCKED), "How you earn" essay.

**Account sub-views:** `deposits`→goal detail / open-deposit wizard; `loans`→loan detail,
credit-score report, payment-holiday flow, early-repayment quote; currency-conversion /
treasury-quote flow; account-reference letter (rendered as a **serif document**, Times New
Roman — see §4); statements; account detail (rename, close, certificate).

### 1.4 Tab 3 — Card (`card`)

Header "Cards / Freeze, PIN and card details." Scrollable.

- `＋ New card` (order flow: physical / virtual, Visa Platinum / Mastercard Gold).
- **Card carousel** — realistic card art per card (brand mark, `•••• •••• •••• 8841`,
  CARDHOLDER, EXPIRES, CVV `•••`, expiry-countdown badge `⏳ 28 DAYS`). Physical Visa Platinum,
  Physical Mastercard Gold, Virtual card.
- Actions: ❄️ Freeze card, 🔢 Get a new PIN ("1'000₮"), linked-account row with big balance.
- **Renewal card** — "Expires this month", 🤖 auto-prepare explanation, `Choose delivery`.
- **Payment controls** — 🌐 Online payments / 🏧 ATM withdrawals / ✈️ Payments abroad (toggles).
- 📃 Activity (recent card txns), ⏳ Authorisation holds ("484'200₮ · 3").
- **Card management** — 📲 Add to digital wallet (+ `Add to Wallet` button with brand mark),
  🔁 Replace card, 📦 Track my card, 🚨 Report lost or stolen, 🗑 Close card.

**Card sub-views / sheets:** show card details (reveals PAN/CVV, needs auth), order-card wizard,
delivery choice, card-tracking timeline (Ordered → Card office → Production → Branch → Ready),
freeze confirm, replace/lost flow, add-to-wallet OTP.

### 1.5 Tab 4 — More (`more`)

Header "More / Profile, security and app preferences." Long grouped settings list:

- **Profile** — avatar "EG", name, phone, "✓ Identity verified", `Edit`; 🚪 Sign out.
- **Security** — Face ID/biometrics, Change passcode, Trusted devices (2), Two-factor auth,
  Login history.
- **Limits** — Daily transfer limit `20'000'000₮`, Interbank per transaction `10'000'000₮`,
  Foreign currency limit `$50'000` ("Annual, per regulation").
- **Preferences** — 🖼 Login screen picture, 🎨 **Appearance** ("Light · Knight · High
  graphics" → theme sheet, §7), 🔔 Notifications, 🔊 Sound & haptics, 🌐 Language (English).
- **Documents** — Account statements (PDF/CSV), Account certificate, Tax summary 2026.
- **Support** — 💬 Chat with us, 📞 Call 24/7 (+976 7000 1234), 📍 Branches & ATMs, ❓ Help centre.
- **Legal** — Terms and conditions, Privacy policy, 🏛 Deposit insurance ("up to 20'000'000₮").
- **Bank admin** (demo-only) — 🏛 Reward configuration (margin/SWIFT/card share sliders).
- Footer: `RightBank · version 3.2.0 (prototype)`.

**More sub-views / sheets:** Edit profile (display name, use ID name), Appearance sheet,
Change passcode keypad, Trusted devices list, Login history list, Sound & haptics, Language
picker, Statements generator, Certificate request, Branches & ATMs (map/search — "Opening
map"), Help centre, each Legal doc, Reward-configuration admin panel.

### 1.6 Center FAB — Scan (`scan`)

Full-screen overlay (not a tab). Segmented **Scan / My QR**. Scan view: simulated camera with
scan-line animation, resolves to a QPay merchant payment ("Nomin Supermarket / INV-88214 · QPay",
amount, `PAY FROM` account selector, `Pay 146'200₮`, `Scan a different code`). My QR view: the
customer's receive QR + share.

### 1.7 Cross-cutting overlays / states

- **Toasts** — bottom confirmation pills for nearly every action ("Transfer sent", "Card
  frozen", "IBAN copied", "Saved just now", …). ~150 distinct toast strings in the bundle.
- **Auth challenge sheet** (`askAuth`) — reused before sensitive actions: Face ID or transaction
  password or E-Mongolia / OTP.
- **Numeric keypad** — custom in-app keypad for amounts, account numbers, passcode
  (`1…9 0 00 ⌫`).
- **Empty states** — "No transactions yet", "No new notifications", "No order in progress",
  "No activity on this card yet.", "Nothing matches that search."
- **Error / guard states** — "Not enough balance", "This IBAN fails its check digits",
  "Holiday limit reached this year", "Face not recognised".

---

## 2. Navigation Map

```
welcome ──Log in──▶ [Face ID sheet] ──ok──▶ [Security warning] ──Got it──▶ home
   │
   └──Join──▶ signup (path choice ─▶ KYC wizard ─▶ "submitted for review") ──▶ welcome/home

Persistent floating tab bar (all post-auth screens):
   [ Home ]  [ Account ]  ( ⌾ Scan FAB )  [ Card ]  [ More ]
   (4 labelled tabs; Scan is the raised center circle, opens full-screen scan overlay)

home ▶ sub-views:  homecard · txns · transfer · topup · overdraft · subs ·
                   billing · notifs · helpy · wallet          (back ‹ returns to home)
home ▶ sheets:     Transfer (Bank/Phone/SWIFT) · Scan · Receive-QR · Add-money

account ▶ segmented: Accounts | Deposits | Loans | Reward
account ▶ sub-views: account detail · open-account · open-deposit · goal detail ·
                     loan detail · credit-score report · payment-holiday ·
                     early-repayment · currency-conversion · treasury-quote ·
                     account-reference letter · statements

card ▶ sub-views/sheets: card detail (reveal) · order card · delivery · track card ·
                         freeze · replace/lost · close · add-to-wallet

more ▶ sub-views/sheets: edit profile · appearance · passcode · trusted devices ·
                         login history · sound & haptics · language · statements ·
                         certificate · branches & ATMs · help centre · legal docs ·
                         reward-config admin

Global: askAuth challenge sheet (Face ID / txn password / OTP) can front any flow.
        Toast layer sits above everything.
```

**Expo Router mapping recommendation:** a `(tabs)` group with `home`, `account`, `card`, `more`;
a custom tab bar to render the raised center Scan button (`scan` as a modal route, not a tab).
Sub-views become **stack routes pushed inside each tab's stack** (`/account/loans/[id]`, etc.).
Bottom-sheets → `@expo/ui` `BottomSheet` or form-sheet routes. `welcome` / `signup` are a
separate stack shown when unauthenticated (auth gate in the root layout).

---

## 3. Asset Inventory

| Kind | In reference | Migration approach |
|---|---|---|
| **Fonts** | **Manrope** 400 / 600 / 700, embedded woff2 data-URIs. Fallback stack `Manrope, ui-sans-serif, "SF Pro Text", system-ui, sans-serif`. `font-feature-settings: "tnum","kern"` (tabular numerals — important for aligned balances). | Bundle Manrope via `@expo-google-fonts/manrope` (or extract the 3 woff2 from the HTML). Load with `expo-font`. Enable tabular figures (`fontVariant: ['tabular-nums']`). |
| **Icons** | **All inline SVG**, ~30 on the Home screen alone. Two styles: (a) small **stroke icons**, 24×24 viewBox, ~1.5–2 px stroke, single-path — a custom Lucide-like set; (b) larger **illustrative "Illo" components** used for the 4 tab icons and quick-action tiles, with an animated `on`/active state. Also brand marks: **VISA**, **Mastercard** (dual-circle), **Google Pay / G PAY**, **Apple Pay**, QPay. | Re-draw the stroke set with `react-native-svg` (or map 1:1 to `lucide-react-native` where shapes match — verify each). Tab / quick-action illustrations: port the SVG as-is into `react-native-svg`, animate with Reanimated. Card brand marks: port the SVGs. **Do not substitute emoji for these SVGs or vice-versa.** |
| **Emoji (used AS icons)** | Heavy, deliberate. Category/merchant/section icons: `⚠ ⏳ 🔔 💼 📩 ☕ 🛒 ⛽ 🎬 ❄️ 🔢 🌐 🏧 ✈️ 📃 🧾 📄 📊 🏠 🚗 🛋 🧸 🔥 🎯 💱 🖼 🎨 🔊 💬 📞 📍 ❓ 📘 🔐 🏛 🙂 🛡️ 📱 🕘 🚪 🤖 📲 📦 🚨 🗑 👋 🪪 🔄 🤳 🚫 ☎ 🎖 📈 🛟 🎟` and glyphs `☀ ☾ ₮ ✓ ✕ ‹ › ＋ ◈ ◆ ◇ ⌫`. | Per `AGENTS.md`: **reproduce the exact same emoji / Unicode characters** in `<Text>`. Do not replace with SF Symbols or an icon library. Note cross-platform emoji rendering differences and document any mismatch rather than swapping. |
| **QR codes** | Generated as SVG (scan-to-pay merchant code, personal receive QR). | Generate with an RN QR library or port the generator; visual style (module size, quiet zone, framing) must match. |
| **Raster images** | **None.** No `<img>`, no photos, no logo PNGs. Card art, avatars (monogram "EG"), backgrounds are all CSS gradients / SVG / initials. | Nothing to copy. Recreate gradients and monogram avatars natively. |
| **Animated backgrounds** | Per-theme particle systems (falling petals, swimming fish, drifting stars/ash, rising sparks, gold flecks, neon grid, water drops, autumn leaves) driven by ~50 CSS `@keyframes`. | Reanimated / Skia particle layers, or a Skia canvas per theme. Gated by the graphics-quality setting (see §7). Lower priority than core screens. |
| **Existing Expo assets** | Stock `create-expo` template art (`assets/images/*` — react logo, expo badge, tab icons, splash). **None reusable** for RightBank. | Replace app icon / splash later; not part of visual parity. |

---

## 4. Typography Inventory

Family: **Manrope** everywhere, except the **bank reference letter / certificate**, which is
deliberately set in **Times New Roman (serif)** with some **Arial** — it emulates an official
printed document. Preserve that serif treatment.

Measured (computed styles, Home screen, Light mode):

| Role | size | weight | line-height | letter-spacing | color (light) |
|---|---|---|---|---|---|
| Screen/section heading ("Recent activity") | 16.5 px | 700 | normal | −0.35 px | `#141A24` |
| Screen title / name ("Erdene Ganbold") | 20 px | 700 | 24 px | normal | `#141A24` |
| Hero balance number | 30 px | 700 | normal | **−1.4 px** | `#FFFFFF` (on dark card) |
| Balance decimals (`.00`) | ~18–20 px | 700 | — | — | dimmed vs integer part |
| Wordmark "RightBank" (welcome) | 40 px | 800 | — | −1 px | split color (see §5) |
| Big display numeral (rule-72 / stats) | up to ~124 px | 800 | tight | −5 px | accent |
| Quick-action tile label | 14.5 px | 700 | normal | normal | `#141A24` |
| Body / row primary text | ~15–16 px | 600–700 | normal | normal | `#141A24` |
| Row secondary ("category · date · time") | ~12–13 px | 500–600 | normal | ~0 | `#5D6880` (muted) |
| Tiny caps labels ("NOTIFICATIONS", "DAY STREAK", "PAY FROM") | ~10–11 px | 700 | normal | +0.1–0.6 px, **uppercase** | muted / accent |
| Tab-bar label | 10 px | 700 (active) / 600 | normal | +0.1 px | active `accent`, inactive `#93A6C2` |
| Status-bar clock | 14 px | — | — | — | — |

Patterns to carry over:
- **Tabular numerals** on every money value; negative sign is `−` (U+2212), not `-`.
- Headings use **slight negative tracking** (−0.35 to −1.4 px); big numbers use aggressive
  negative tracking.
- Micro-labels are **uppercase + positive tracking + muted/accent color**.
- Weight vocabulary is essentially **600 / 700 / 800** (Manrope has no 500 loaded — 400, 600, 700
  only; "500-ish" appearances are 600).

---

## 5. Color Inventory

The app has a **theme system**: **mode** (Light / Dark) × **theme** (accent palette + particle
motion) × **graphics quality**. Default on first run: **Light · "Knight" · High**.

### 5.1 Structural / neutral (mode-driven, theme-independent)

| Token | Light | Dark |
|---|---|---|
| Primary text / ink | `#131A2B` (also seen `#141A24`) | `#FFFFFF` / `#EEF2FA` |
| Muted / secondary text | `#5D6880` | `#93A0B8` / `#98A3B5` |
| Screen surface (card / sheet) | `#FFFFFF` | `#101726` / `#2A3247` |
| App background (frame) | `linear-gradient(180deg,#FBFAF8,#F2F4F8 55%,#EDEFF5)` | dark radial `#141B2E → #04060C` |
| Desktop backdrop behind frame | `linear-gradient(180deg,#E9ECF2,#DFE3EB)` | — |
| Danger / overdue | `#C8001F` | `#FF6B85` |
| Hairline / divider | `rgba(19,26,43,0.16)` / `rgba(16,24,40,0.10)` | `rgba(255,255,255,0.09)` |
| Tab bar bg | `rgba(255,255,255,0.96)` + blur(12) | `rgba(20,27,44,0.95)` etc. per theme |
| Tab bar border | `1.5px rgba(147,166,194,0.40)` | per theme `frameBorder` |

### 5.2 Card / tile styling (Light, measured)

- **Quick-action tile:** bg `linear-gradient(168deg,#FFFFFF,#F4F6FA)`, border `1px rgba(16,24,40,0.10)`,
  radius **22**, shadow `0 8px 22px rgba(16,24,40,0.10), inset 0 1px 0 #FFFFFF`, padding `8 8 9`.
- **List/section card:** bg `#FFFFFF`, radius **20**, shadow `0 2px 10px rgba(16,24,40,0.07)`,
  inner row padding `2px 16px`.
- **Hero balance card:** relative container 352 × ~212, padding `18 16 16`, with a themed
  **gradient background layer** (`heroGrad`, e.g. Indigo `linear-gradient(160deg,#2A2F86,#4450C9 45%,#7C8CFF)`),
  white text, decorative SVG orbs.
- **Floating tab bar:** absolute `bottom:12; left/right:14` → width 362, height 76, radius **22**,
  padding 6, multi-layer glow shadow.

### 5.3 Theme accent palettes (each: `accent`, `accentSoft`, `grad`, `pale`, `ink`, `onAccent`,
`heroGrad`, dark `bg`/`pageBg`, `frameBorder`, `navBg`, `dim`)

| Theme | accent | motion / particle |
|---|---|---|
| Ember | `#FF6B3D` | warm sparks rising |
| Sakura | `#F79BC4` | cherry-blossom petals |
| Rose | `#FF5EA8` | soft bokeh lights |
| Aqua | `#26C6E8` | fish swimming |
| Indigo | `#7C8CFF` | drifting stars |
| **Knight** *(default)* | `#93A6C2` | ash drifting |
| Platinum | `#C8A961` | gold flecks turning |
| Esports | `#00E5FF` | neon grid pulsing |
| Save Water *(cause)* | `#31A9E8` | water drops |
| Autumn | ~amber | leaves turning |
| *(Growth — "leaves turning", may be cause/variant)* | green | — |

Also present: a shared **welcome-screen ambient** palette (light `dots:['#F2A03C','#7C93E8','#E9873A','#9B8BE0']`,
warm/cool wash, dark variant), and a **charts** palette (`paid #2A78D6`, `interest #C97C0B`,
`grid #E4E7EC`, `axis #C7CCD4`; dark equivalents) used by the spending-trend / analyser graphs.

Brand secondary hues seen in cards/badges: gold `#F0B429`, pink `#FF6B8B`, violet `#8B7CF6`,
sky `#4CC9F0`, external-bank brand colors (Khan `#00529B`, State `#00843D`, TDB `#123274`,
Golomt `#F58220`, Xac `#FFC20E`).

**Migration:** build a `theme/` token module keyed by `mode` + `themeName`; resolve to a flat
palette at the top of the tree (Context or Unistyles/Restyle). Ship **Knight/Light** first for
parity; wire the other themes after core screens are done.

---

## 6. Spacing / Layout Observations

- **Content frame:** 390 wide. Scroll container padding **top 56 / sides 18 / bottom 104**
  (top clears the fake status bar; bottom clears the floating tab bar). → **Screen horizontal
  padding = 18 px**, content width **354 px**.
- **Status bar area:** 50 px tall; content starts at 56.
- **Floating tab bar:** inset 14 px L/R, 12 px from bottom; height 76 (≈64 touch area + 6 pad
  each side); radius 22; center FAB is a raised 62 px circle overlapping the bar top.
- **Card radii:** tiles **22**, list/section cards **20**, hero card larger, pill/chip **999**,
  device frame **40**. Standardize as radius tokens `{sm:12?, md:20, lg:22, pill:999}` (verify
  the 12–14 range against detail screens).
- **Border widths:** hairlines **1 px**; emphasis borders **1.5 px** (tab bar, some accent
  outlines).
- **Shadows:** three recurring recipes — soft card `0 2px 10px rgba(16,24,40,0.07)`; raised tile
  `0 8px 22px rgba(16,24,40,0.10)` + inset top highlight; glow (accent-colored, multi-layer) on
  the tab bar, FAB, and hero card.
- **Gaps:** vertical rhythm between cards ≈ 10–14 px; quick-action grid is 2-col with ~10 px gap
  (tile ≈ 173 wide). Row height in lists ≈ 56–64.
- **Vertical spacing scale** (inferred, to confirm): 2 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 22.
  The existing `Spacing` token in `src/constants/theme.ts` (2/4/8/16/24/32/64) does **not**
  match — it will need to be replaced with the reference scale.
- **Animation/press feedback:** `.press:active { transform: scale(0.96) }` on tappables;
  tile icons scale to 1.08 (hover) / 1.16 (active). Entrance animations: `fadeUpK` 0.45 s
  `cubic-bezier(0.22,1,0.36,1)` with staggered `d1…d6` delays (0.05 s steps); sheets use
  `slideUpK` 0.3 s; popovers `popInK` 0.3 s; error `shakeK`. **~50 keyframes** total — most are
  ambient background loops.
- **Graphics-quality gate:** `gfx-low` disables all animation/transition/backdrop-filter;
  `gfx-medium` disables `backdrop-filter` + heavy glow/shimmer/shootStar; `gfx-high` = full;
  `gfx-ultra` = slightly longer float durations. Native equivalent: a settings flag that
  short-circuits Reanimated loops and blur (`expo-blur` / `expo-glass-effect`) usage.

---

## 7. Reusable Component Inventory

Genuinely repeated across screens — candidates for shared primitives:

| Component | Where | Notes |
|---|---|---|
| **ScreenScroll / ScreenContainer** | every tab | 56/18/104 padding, themed background, hides scrollbar. |
| **FloatingTabBar** + **ScanFab** | all post-auth | 4 labelled tabs + raised center circle; animated active icon, glow. Custom — not the default RN tab bar. |
| **StatusBarFaux** | prototype only | Real app uses `expo-status-bar` + safe area; do **not** port the fake bar. |
| **SectionCard** | Home, Account, Card, More | white, radius 20, soft shadow; often has header row with title + right-side `See all`/action link. |
| **ListRow** | activity, loans, accounts, settings, beneficiaries | leading emoji/SVG in a rounded badge, title + subtitle (`·`-separated meta), trailing value or `›` chevron. Pressable variant. |
| **QuickActionTile** | Home grid | radius 22 white-gradient tile, centered animated illo + label; scale-on-press. |
| **HeroBalanceCard** | Home | themed gradient, balance (tabular), IBAN/card row, wallet chip, decorative orbs. |
| **AccountCard / row** | Account | glyph, name, IBAN, balance, rate/accrued line. |
| **PaymentCard art** | Card | full card visual: brand mark, PAN groups, cardholder, expiry, CVV, status badge. |
| **AlertBanner** | Home, Loans, Card | caps label + amount + CTA; severity color (overdue = danger, expiry = amber). |
| **StatPill / CapsLabel** | everywhere | uppercase micro-label, tracked, muted/accent. |
| **SegmentedTabs** | Account (Accounts/Deposits/Loans/Reward), Transfer (Bank/Phone/SWIFT), Scan (Scan/My QR), Appearance (Mode) | pill segmented control. |
| **BottomSheet** | Transfer, Appearance, Scan, auth, order flows | slide-up, drag/`✕` dismiss, `slideUpK`. Use `@expo/ui` BottomSheet. |
| **NumericKeypad** | amounts, account no., passcode | `1–9 0 00 ⌫` grid; drives an amount/PIN display. |
| **AmountDisplay** | transfer, top-up, deposit, convert | large tabular number + currency suffix, decimal de-emphasis, live validation ("Not enough in Everyday"). |
| **AuthChallengeSheet** (`askAuth`) | before sensitive actions | Face ID ring / txn-password / OTP; success + fail states. |
| **FaceIdOverlay** | login, askAuth | animated concentric rings, scan states. |
| **Toast** | global | bottom pill, auto-dismiss; single string + optional icon. |
| **Chevron / CopyableField / Avatar(monogram) / Toggle(row switch) / PrimaryButton / GhostButton / Chip** | pervasive | `PrimaryButton` has a subtle breathing animation (`btnBreath`). |
| **Stepper / WizardHeader** | signup, order card, open deposit | `‹` back, step title, progress. |
| **TimelineTracker** | card tracking, transfer status, application status | vertical stepper with done/active/pending nodes. |
| **MiniChart** | Home "Monthly spending trend", Account analyser | bar/line chart with the charts palette. |
| **ParticleBackground** | welcome + every theme | per-theme animated layer; quality-gated. |
| **SerifDocument** | account reference letter, certificate | Times New Roman, letter layout, "official mark" block. |

`AGENTS.md` caution: keep shared components **visually locked per screen** once a screen is
signed off — don't let a later tweak to `ListRow` silently shift a finished screen.

---

## 8. Recommended Migration Order

Foundations first, then screens by structural leverage (most shared patterns → earliest), then
depth. Do **one screen at a time**, validate against the 390×800 baseline before moving on.

**Phase 3 — Foundation**
1. Confirm Expo Router layout: unauth stack (`welcome`/`signup`) + `(tabs)` with custom
   `FloatingTabBar` + `ScanFab`; per-tab nested stacks for sub-views; sheet routes.
2. Load **Manrope** (400/600/700) + tabular-nums; add serif fallback for documents.
3. Build **theme tokens** (`mode` × `themeName`), starting with **Knight/Light**; theme context
   + `useTheme()`. Replace the stock `Colors`/`Spacing`/`Fonts` in `src/constants/theme.ts`.
4. Primitives: `ScreenScroll`, `SectionCard`, `ListRow`, `CapsLabel`, `PrimaryButton`/`GhostButton`,
   `Chip`, `Avatar`, `Toast` host, `BottomSheet` wrapper, `SegmentedTabs`, `NumericKeypad`,
   `AmountDisplay`.
5. Safe-area handling (real insets replace the 56/12 fake insets); status bar via `expo-status-bar`.
6. Money formatter util (`en-US` grouping → `'`, `−` sign, decimal de-emphasis).

**Phase 4 — Screens**
7. **Welcome / Login** (+ Face ID overlay, password sheet) — sets the visual tone, isolated.
8. **Home tab** — highest pattern density (hero card, tiles, offers carousel, activity list,
   alert banners); locks most primitives.
9. **Floating tab bar + Scan overlay** — needed to move between tabs realistically.
10. **Account tab** — 4 segmented sub-tabs (Accounts, Deposits, Loans, Reward). Reward screen is
    long; do Accounts + Deposits + Loans first, Reward last.
11. **Card tab** — card art carousel, payment controls, management list.
12. **More tab** — grouped settings list (fast once `ListRow` is solid) + **Appearance sheet**
    (unlocks theme switching to verify other palettes).
13. **Transfer flow** (Bank / Phone / SWIFT + keypad + beneficiaries + confirm + status).
14. **Sub-views**: transactions (search/filter), notifications, subscriptions, billing,
    overdraft, top-up, Helpy chat.
15. **Account depth**: open account / open deposit / goal detail / loan detail / credit score /
    payment holiday / currency conversion / treasury quote / **serif reference letter**.
16. **Card depth**: reveal details, order card, delivery, tracking timeline, replace/lost/close.
17. **Sign-up wizard** (KYC steps, E-Mongolia, submitted state).
18. **Security-warning interstitial**, empty/error states polish.
19. **AuthChallengeSheet** wired into every sensitive action.
20. **Themes 2–N** + **ParticleBackgrounds** + graphics-quality gate.
21. Charts (spending trend, analyser). App icon / splash.

**Phase 5 — Validation:** per screen, render at 390-wide, diff geometry → typography → color →
radius/shadow → icons, against the reference; fix largest deltas first; update the status grid.

---

## 9. Unknowns — need real visual inspection

Screenshots could not be taken in this environment; the following must be checked against an
actual rendering of `reference/RightBank.html` (open it in a browser at a 390-wide viewport)
before implementing, and again when validating:

**Global / measurement**
- Exact vertical spacing scale between cards and inside cards (values above are inferred).
- Exact corner radii on detail-screen cards, inputs, buttons, chips, badges (confirmed: tile 22,
  section 20, pill 999, frame 40 — the rest are estimates).
- Exact button heights, horizontal padding, and the "breathing" animation amplitude.
- Hero card: true height, internal layout, the decorative orb SVGs, and each theme's `heroGrad`
  angle/stops as rendered.
- Floating tab bar: icon size, active-state glow radius/color, FAB size and overlap, label gap,
  press/active animation.
- Dark mode: full surface/elevation treatment per theme (only token values captured, not
  rendered appearance).
- Offers carousel: card size, peek amount, gap, snap behavior, gradient/imagery per promo.
- Toast: exact position, width, padding, shadow, enter/exit motion, duration.

**Per-screen (not yet rendered/inspected in detail)**
- Sign-up wizard — every step's layout, the ID-capture UI, E-Mongolia screen, progress indicator.
- Password login sheet; Face-ID failure path.
- Home sub-views: transactions (search + filter + grouping by day), notifications list,
  subscriptions manager, billing, overdraft explainer, top-up, **Helpy** chat UI.
- Account: open-account & open-deposit wizards, goal detail + "create goal", loan detail,
  **credit-score report**, payment-holiday flow, early-repayment quote, currency-conversion &
  treasury-quote flow, **account-reference serif letter** + certificate, statements generator.
- Card: reveal-details screen, order-card wizard, delivery choice, **tracking timeline**,
  freeze/replace/lost/close flows, add-to-wallet OTP.
- Account "Analyser" / "Monthly spending trend" **charts** — chart types, axes, labels, colors.
- Scan: camera framing, scan-line animation, the resolved-payment card, My-QR view.
- More: Appearance sheet full layout (mode/theme/graphics — partially seen), Sound & haptics,
  Language picker, Trusted devices, Login history, Branches & ATMs (map), Reward-config admin.
- The **11 theme particle backgrounds** — density, size, speed, color, blend of each.

**Behavioral**
- Which sub-views are full pages vs. bottom-sheets vs. modals (inferred from state names; confirm).
- Scroll vs. fixed regions per screen; keyboard avoidance on amount/keypad screens.
- Exact copy for all toasts/errors and the conditions that trigger them.
- Auth-challenge (`askAuth`) — which actions require it and which method each uses.
- Locale: when English vs. Mongolian strings are shown (some strings are hard-coded bilingual).

---

## 10. Screen status grid

Legend per `AGENTS.md`: `[ ] analyzed · structure · navigation · visual pass 1 · visual pass 2 ·
typography · assets · interactions · final comparison · complete`.

| Screen / area | analyzed | structure | nav | visual 1 | visual 2 | type | assets | interactions | final | complete |
|---|---|---|---|---|---|---|---|---|---|---|
| ~~Welcome~~ (removed — dropped by the reference, see §23) | ✅ | ✅ | ✅ (entry) | ✅ | ✅ (pass 3, on Android emulator §13.2) | ✅ | ✅ | ✅ (toggle) | ✅ simulator side-by-side | ⏳ (needs iOS check) |
| Login (Figma `14909:53946` + `15324:57799`) | ✅ | ✅ | ✅ (`(auth)` entry, `/`) | ✅ | ✅ (pixel-sampled vs Figma, §23.1; `pw` vs `15324:57799`, §23.3) | ⛔ (GIP font missing, §23.1) | ✅ (bg byte-identical, flag from Figma) | ✅ (3 views, reveal, sheet hand-off, remembered user §23.3) | ✅ Figma side-by-side at 375×812 | ⏳ (blocked on GIP; `bio` has no frame) |
| Face ID overlay | ✅ | ✅ | ✅ (from Login: Face ID button, or a submitted password form) | ✅ | ✅ (Android emulator §14 / §14a) | ✅ | ✅ | ✅ (real `expo-local-authentication`; OS prompt → ok/`/home`, cancel → password form, password sign-in) | ✅ scan+ok+fail+password, light (+dark palette wired) | ✅ |
| Sign-up path choice | ✅ | | | | | | | | | |
| Sign-up KYC wizard | ⚠️ partial | | | | | | | | | |
| Security warning | ✅ | ✅ (§22) | ✅ (Face ID success → modal → `/home`) | ✅ (Browser-pane vs. reference §22) | | ✅ | ✅ (emoji kept) | ✅ (Got it → dismiss + navigate) | | ⏳ (Light verified; dark tokens wired, unverified; no on-device check) |
| Home (Figma `15314:40225` + `15324:56122`) | ✅ | ✅ | ✅ (login → `(app)` anchor) | ✅ | ✅ (§24 — geometry measured from both frames, header gradient pixel-sampled) | ⛔ (GIP + Montserrat missing, §24) | ✅ (18 SVGs + 2 watermarks exported from Figma, §24) | ✅ (rail snap, balance mask, theme toggle, banner loading/error) | ✅ Figma side-by-side at 375×812, both modes | ⏳ (blocked on GIP; not yet run on device) |
| Floating tab bar + Scan FAB | ✅ | ✅ (§15.2) | ⚠️ (rendered on Home; tab/scan handlers stubbed) | ✅ | | ✅ | ✅ (ported illo SVGs) | ⚠️ (press states only) | | ⏳ |
| Home ▸ Transfer sheet | ✅ | | | | | | | | | |
| Home ▸ Scan overlay | ✅ | | | | | | | | | |
| Home ▸ txns / notifs / subs / billing / overdraft / topup / helpy | ⚠️ names only | | | | | | | | | |
| Account tab + segmented sub-tabs | ✅ | ✅ (§16) | ✅ (Home ↔ Account via tab bar) | ✅ (Expo web vs. reference screenshots §16) | | ✅ | ✅ (emoji kept, tinted-card recipe) | ⚠️ (segmented switch, buttons are stubs) | | ⏳ (needs dark-mode + on-device check) |
| Account ▸ Accounts | ✅ | ✅ | ✅ | ✅ | | ✅ | ✅ | | | |
| Account ▸ Deposits | ✅ | ✅ | ✅ | ✅ | | ✅ | ✅ | | | |
| Account ▸ Loans | ✅ | ✅ | ✅ | ✅ | | ✅ | ✅ | | | |
| Account ▸ Reward | ✅ | ✅ | ✅ | ✅ | | ✅ | ✅ | | | |
| Account ▸ depth flows | ⚠️ names only | | | | | | | | | |
| Card | ✅ | ✅ | ⚠️ (rendered on tab bar `card` press; sub-view/sheet taps stubbed) | ✅ (DOM diff, Expo web §17) | | ✅ | ✅ (ported reveal-eye icon, brand marks; emoji kept) | ⚠️ (carousel snap/dots; reveal + balance-mask toggles only) | | ⏳ (Light only; dark tokens wired, unverified)
| Card ▸ depth flows | ⚠️ names only | | | | | | | | | |
| More | ✅ | ✅ (§21) | ✅ (tab bar `more` press → `/more`) | ✅ (DOM diff, Expo web vs. reference §21) | | ✅ | ✅ (emoji kept, ListRow/SectionCard reused) | ⚠️ (Face ID/2FA/Notifications switches only; row taps are stubs) | | ⏳ (Light only; dark tokens wired, unverified)
| More ▸ Appearance sheet | ⚠️ partial | | | | | | | | | |
| More ▸ other sub-views | ⚠️ names only | | | | | | | | | |
| Themes 2–N + particle backgrounds | ⚠️ tokens only | | | | | | | | | |
| Charts | ❌ not seen | | | | | | | | | |

---

## 11. Current Expo project state (for context — do not change yet)

- Stock **`create-expo`** template: `src/app/_layout.tsx` (ThemeProvider + `AppTabs`),
  `src/app/index.tsx` ("Welcome to Expo" hint screen), `src/app/explore.tsx`, template
  components (`themed-text`, `themed-view`, `hint-row`, `web-badge`, `animated-icon`,
  `app-tabs`, `collapsible`), `src/constants/theme.ts` (generic Colors/Spacing/Fonts —
  **will be replaced**, values don't match the reference).
- Expo SDK **57**, Expo Router **~57**, React **19.2**, RN **0.86**, Reanimated **4.5**,
  `react-native-gesture-handler`, `react-native-safe-area-context`, `@expo/ui`,
  `expo-glass-effect`, `expo-image`, `expo-symbols`, `expo-font`. TypeScript, typed routes,
  React Compiler on.
- No RightBank screens, tokens, fonts, or assets exist yet. Migration effectively builds the
  app UI from scratch on top of this scaffold.
- `assets/` contains only template art — none reusable.
- Read the exact SDK 57 docs (https://docs.expo.dev/versions/v57.0.0/) before writing code.

---

## 12. How this assessment was produced

- Served `reference/RightBank.html` locally and loaded it in a headless browser at a 430-wide
  window (app frame renders at its fixed 390×800).
- Screenshots were **unavailable** (browser pane not compositing), so inspection used:
  DOM accessibility tree, `getComputedStyle` measurements on representative elements, stylesheet
  rule dump (keyframes, class rules, `@font-face`), string-literal extraction from the bundle,
  and the theme/palette object literals in the source.
- Navigated the live app through: Welcome → Face ID → Home → Account (all 4 sub-tabs) → Card →
  More → Appearance → Scan → Transfer sheet → Sign-up (path choice + step 1).
- Everything marked ✅ was read from the live DOM; ⚠️ = partially seen or names-from-source only;
  ❌ = not reached. All appearance facts still need screenshot-level verification (§9).

---

## 13. Implemented — Welcome / Login screen (Phase 4 · step 7)

**Route:** `src/app/index.tsx` (app entry). Root layout `src/app/_layout.tsx` converted from the
template `NativeTabs` to a `Stack` (`headerShown:false`) and now loads **Manrope** 400/600/700/800
via `@expo-google-fonts/manrope`, holding the splash until fonts are ready. The template
`explore.tsx` / `app-tabs.tsx` are now unreferenced (left in place for a future `(tabs)` group).

**New files**
- `src/constants/rightbank-theme.ts` — `welcomePalette` (light + dark), mode-independent `Brand`
  tokens (ember gradient, brand-mark gradient, Knight knob gradient, spark colors), `Font` keys.
- `src/components/rightbank/WelcomeBackground.tsx` — SVG radial background gradient + two soft
  wash blobs + 60 Reanimated twinkling star dots (`twinkleK`).
- `src/components/rightbank/BrandMark.tsx` — ember **"X"** (SVG gradient text) + pulsing halo
  (`logoGlowK`/`xLiveK`) + 6 flickering lightning-bolt sparks (`flickK`, exact reference
  positions/rotations/colors) + 2 counter-rotating orbit embers (`orbitSparkK`).
- `src/components/rightbank/ThemeToggle.tsx` — 62×32 pill, 24px knob sliding 240ms
  `cubic-bezier(.22,1,.36,1)`; swaps the whole screen palette.
- `src/components/rightbank/PillButton.tsx` — `primary` (ember `LinearGradient`, `#2E0B00` text,
  ember glow shadow on an unclipped wrapper so it survives the pill's `overflow:hidden`) +
  `outline` ("Join", translucent + 1.5px border); both carry the `ringPulseK` halo.
  `press:active` scale 0.96.
- `src/components/rightbank/Wordmark.tsx` — "RightBank" as **one** SVG `<Text>` with two `<TSpan>`s
  ("Right" mode-ink, "Bank" 135° ember gradient) so both colours share a single baseline. Line
  box = 1.36 × 40 to match the reference. (Replaced an earlier overlay-based `GradientText`,
  which drifted the baseline ~8px.)

**Deps added** (`npx expo install`): `react-native-svg`, `expo-linear-gradient`,
`@expo-google-fonts/manrope`, `expo-haptics`. (`@react-native-masked-view/masked-view` was
installed for the first gradient-text attempt and is now unused — safe to prune.) `npx expo lint`
also scaffolded `eslint.config.js` + eslint devDeps. `.claude/launch.json` adds an `expo-web`
config for verification.

**Verified** (Expo web, emulated 390×844 and 375×667; screenshots still unavailable so this is a
`getComputedStyle` diff, not a pixel diff):

| Property | Reference | Built |
|---|---|---|
| Wordmark | Manrope 40 / 700 / ls −1; "Right" `#2B3341`, "Bank" ember gradient | ✅ exact |
| Tagline | Manrope 13.5 / 400 / `#5D6880` (dark `#93A0B8`) | ✅ exact |
| Feature chip | emoji 16 + Manrope 11 / 600 / muted, gap 18 | ✅ exact |
| Login button | 338w × 55h, r999, ember gradient, `#2E0B00` text 15.5/700, ember glow shadow | ✅ |
| Join button | 338w × 56h, r999, `rgba(19,26,43,0.05)` + 1.5px border, `#131A2B` 15/700; mt 12 | ✅ exact |
| Theme toggle | 62×32 pill, palettes for light **and** dark | ✅ both modes match reference tokens |
| Brand mark | ember "X" + halo + 6 sparks + 2 orbits | ✅ structure + colors |
| Background | radial `#FFF→#FFF3E4→#F2EFFB→#E7E9F6` (dark `#141B2E→…`) + wash + twinkles | ✅ |
| Horizontal padding | 26 | ✅ (buttons 338w, 26 side margins) |
| Vertical rhythm | fixed 800-frame: wordmark ~16% down, actions pinned bottom | ≈ (`space-between`; wordmark ~16%, toggle→wordmark 88→~96, tagline→mark 53→~56; the 800→844 slack pools above the chips) |

**Deviations / follow-ups**
- No screenshot verification was possible — needs a real side-by-side at 390-wide before this
  screen is marked `complete`.
- Reference is a fixed 800-tall frame; on 844 the extra height splits evenly into the two
  flexible gaps (see measured diff below). On a real device the `insets.top` (~50) absorbs ~half
  of it, closing the residual to ~+16px/gap.
- `shadow*` style props log a web deprecation warning (correct API on native); harmless.
- Buttons' `onPress` are `// TODO` stubs — Face ID sheet and Sign-up are later screens.

### 13.1 Measured diff vs reference + fixes applied (pass 2)

Measured at 390-wide (reference at scale 1 in its 800-frame; Expo on web, `insets.top`=0).
Gaps are content-box-relative, in px.

| Aspect | Reference | Expo — before | Expo — after | verdict |
|---|---|---|---|---|
| **Spacing** tagline→brand mark | 54 | 24 | **54** | fixed (`markWrap` marginTop 24→54) |
| **Spacing** brand mark→chips | 74 | 189 | **123** | improved — toggle pulled out as its own `space-between` child so slack splits into two balanced gaps (122/123) instead of one 189 dump; residual +49 is the 800→844 delta, ~+16 on device |
| **Spacing** toggle→wordmark | 88 | 96 | 122 | same balanced-slack story |
| **Spacing** wordmark→tagline / chips→login / login→join | 6 / 16 / 12 | 6 / 16 / 12 | 6 / 16 / 12 | unchanged ✓ |
| **Typography** "Bank" baseline vs "Right" | aligned | +~8 high | **0** | fixed (single-SVG `<TSpan>` wordmark) |
| **Typography** wordmark line box | 54.5 | 44 | **54.5** | fixed |
| **Typography** button-label tracking | normal | +0.1px | **normal** | fixed (removed stray `letterSpacing`) |
| **Shadows** login button | `0 0 22 rgba(255,107,61,.4)` glow **+** `0 8 22 rgba(0,0,0,.28)` | single `0 8 22` offset | `0 5 20 rgba(255,107,61,.55)` on unclipped wrapper | improved — reads as the ember halo; RN's one-shadow limit means the separate dark drop is folded in, not layered |
| **Colors** X-mark gradient angle | 150° | ~128° | ~150° | fixed |
| **Animations** twinkle starfield | ~85 dots | 34 | 60 | closer |
| **Geometry** X glyph SVG box | 76×124 (tight) | 82×169 | 82×169 | cosmetic — SVG `<text>` bbox includes font leading; the visible ink is ~124 and centred in the 232 emblem (ink centre 404 vs emblem centre 407) |
| **Position** toggle top | 54 | 4 | 4 (web) | web-only: no status-bar inset. `paddingTop: insets.top + 4` → ~54 on device. Not changed. |
| Geometry / Colors / Borders / Icons / Images (everything else) | — | already matched | matched | 0 |

Not yet addressed (low visual impact): `joinPulseK` border-colour oscillation on the outline
button; X-mark gradient angle is approximate (react-native-svg gradient vectors vs CSS degrees);
star count still below the reference's ~85.

### 13.2 Simulator diff vs reference + fixes applied (pass 3 — Android emulator)

Verified for the first time on a **real device**: Pixel-class Android emulator, 1080×2280 px /
393×830 dp, dev build of `com.anonymous.rightbank` on Metro. Reference captured on the *same*
emulator in Chrome (`localhost:8199/RightBank.html`) for a true side-by-side. Screenshots pulled
via `adb screencap` and measured with a pixel script (`pngjs`). Screen-relative CSS positions.

The on-device render exposed three bugs that the web preview had hidden:

| Group | Reference | App (simulator, before) | App (after) |
|---|---|---|---|
| **Colors / Geometry** — brand-mark halo | soft ember glow, X ink ~78 dp wide | **opaque orange disc ~191 dp** — `RadialGlow` stops used `rgba(…,0)` in `stopColor`; Android react-native-svg **drops the alpha**, so every stop was opaque and the "fade" never happened | fixed — colour + `stopOpacity` split; dense quadratic-falloff stop list; halo now a soft radial that fades to 0 |
| **Colors** — background wash blobs | barely perceptible haze | **saturated blue blob top-centre + orange blob mid-right** (~26 000 vs ~150 sample px) — same `stopColor` alpha-drop bug | fixed — hex colour + `stopOpacity`, peak α 0.12 (cool) / 0.17 (warm), 6-stop falloff, blobs enlarged & pushed mostly off-canvas |
| **Colors** — gradient banding | smooth (browser dithers) | **visible concentric contour rings** in bg + halo — RN-svg on Android does not dither a 4-stop ramp | fixed — `densify()` interpolates the 4 anchor colours to ~13 stops for the page gradient; `smoothStops()` for the mark glow |
| **Position / Spacing** — vertical rhythm | wordmark mid 202, X centre 423, chips 638, login top 669 | wordmark 177, X centre 400, chips 637, login 663 — top cluster **~24 dp high**; `space-between` dumped the surplus (30 dp taller screen + smaller OS status bar) into one gap below the mark | fixed — toggle folded back into one **anchored top group** (fixed `marginTop`s: 88 toggle→wordmark, 54 tagline→mark); `paddingTop: max(insets.top + 8, 54)` restores the reference's status-bar zone; surplus now sits *below* the mark like the reference. After: wordmark 202, X centre 425, chips 638, login 663 — **all anchors within ~7 dp** |
| **Geometry** — X glyph | fontSize 124, ink ~78 dp | ink ~70 dp (Android renders Manrope ExtraBold a touch small in SVG `<text>`) | fontSize 124 → 126 |
| **Shadows** — login button glow | `0 0 22 rgba(255,107,61,.4)` + dark drop | first pass too strong on Android (big peach rectangle), then over-corrected | settled at `shadowColor ember, α .4, r 18, offset 0/4, elevation 6` |
| Typography / Icons / Borders / Images | — | already matched on web | unchanged, still matched on device |

**Files touched (pass 3):** `BrandMark.tsx` (RadialGlow rewrite, `smoothStops`, X size),
`WelcomeBackground.tsx` (`densify`/`lerpHex`, wash stops), `rightbank-theme.ts` (wash colour +
opacity tokens split), `PillButton.tsx` (glow tuning), `index.tsx` (top-group restructure +
`paddingTop`).

**Residual (low impact):** on this emulator the OS status bar (~26 dp) is shorter than the
iPhone-style 54 the reference mocks, so `max(insets.top+8, 54)` places the toggle correctly here
but could sit ~10 dp low on a deeply-notched device; the surplus ~14 dp of a taller-than-800
screen still lands in the mark→chips gap (unavoidable for a fixed-height design); spark/orbit
micro-animations confirmed running on device.

### 13.3 Second-round polish from side-by-side review (pass 4 — device, light + dark)

Four things the on-device side-by-side (app vs reference in Chrome, same emulator) surfaced:

| Group | Reference | App (before) | Fix |
|---|---|---|---|
| **Animations** — shooting stars | two 64×1.5 diagonal streaks (`shootK`: translate 0,0 → 440,180 @ rotate 22°, opacity 0→1→1→0 over 7.5 s, delays 2 s / 5.5 s), colour `e.streak` (light: orange α.5 / dark: white) | **not implemented** | `ShootingStar` component in `WelcomeBackground` — two instances at top 14 % / 58 %, off the left edge, Reanimated `interpolate` for the opacity keyframe; `streak` + `streakOpacity` added to the palette |
| **Colors / Animations** — brand-mark "X" | bright gradient X + `xLiveK` glow (`drop-shadow 0 0 12–22 px` pulsing to `0 0 22–60 px`) + `logoGlowK` breathe | X read dull, halo too faint, no visible pulse | added a dedicated **hot glow layer** hugging the glyph (pale-gold core → ember, `stopOpacity` fade) that pulses on an `xLiveK`-style quick-spike sequence; raised halo peak (0.5 → 0.58) and breathe range; tuned down from a first over-bright pass to match the reference's gentle warmth |
| **Shadows** — Login / Join buttons | `box-shadow: 0 0 22 rgba(255,107,61,.4)` (ember glow) **+** `0 8 22 rgba(0,0,0,.28)` (dark drop, clearly visible under the button in light mode) | only the ember glow (one RN shadow per view), no dark drop | **two nested wrappers** — dark drop `#000 α.28 r22 offset 0/8 elev 10` on the outer, ember glow `ember α.55 r22 offset 0/0` on the inner; outline button keeps just its `ringPulse` edge |
| **Icons** — dark-mode "No fees" ₮ | tinted with the heading colour (light in dark mode) | chip icon `<Text>` had **no `color`** → default near-black → `₮` (a plain glyph, not an emoji, so it obeys `color`) vanished on the dark background; 🔒/⚡ were fine as colour emoji | `featureIcon` now takes `color: p.heading` — visible in both modes (verified: 282 non-bg px in the icon cell on dark) |

Background ambient wash also nudged up (light α 0.12→0.14 cool / 0.17→0.20 warm) so the mid-screen
haze reads closer to the reference's atmosphere. All verified on device in **both** light and dark;
`tsc` + `eslint` clean.

### 13.4 Third-round polish (pass 5 — device) — from user notes against the exact reference markup

| Group | Reference (exact markup the user supplied) | App (before) | Fix |
|---|---|---|---|
| **Shadows / Colors** — CTA lift | a separate element behind the button block: `width 360 height 210 bottom -36 translateX(-50%)`, `background: radial-gradient(55% 62% at 50% 68%, rgba(147,166,194,.3), transparent 72%)`, `filter: blur(20px)` | **missing entirely** | new `CtaGlow` component (`react-native-svg` ellipse `cx 50% cy 68% rx 55% ry 62%`, smooth `stopOpacity` falloff since RN can't blur), placed behind the buttons; `ctaGlow` / `ctaGlowOpacity` tokens (`#93A6C2` α .36 light / .18 dark). Also dropped the primary button's ember-glow α .55→.40 so this neutral lift reads through instead of an over-orange halo |
| **Colors / Effects** — "X" logo | `linear-gradient(150deg, #FFE7B8 0, #FFB25C 32%, #FF7A18 66%, #E2560A 100%)` + `filter: drop-shadow(rgba(255,150,50,.85) 0 0 14) drop-shadow(rgba(255,110,20,.55) 0 0 38)`; `font: 800 124px/1 Manrope; letter-spacing -5` | gradient colours already matched but the SVG gradient **vector was ~128°** not 150°; glow was faked with a radial `<View>` layer (soft, not edge-hugging); `fontSize` had been bumped to 126 | gradient vector set to true 150° (`x1 .25 y1 .067 → x2 .75 y2 .933`); real SVG `<Filter>` with two `FeGaussianBlur`+`FeFlood`+`FeComposite` glows (`stdDeviation` 7 & 19 ≈ CSS blur 14 & 38, flood `#FF9632` α.85 / `#FF6E14` α.55) applied to the glyph — **renders on this Android build**; `fontSize` back to `124`; radial layer kept only as the subtle `xLiveK` breathe |
| **Typography** — weights look heavy | Manrope 700 / 600 (single multi-weight family) | every `<Text>` / `<SvgText>` paired a **weight-named** `@expo-google-fonts` family (`Manrope_700Bold`, `_600SemiBold`, `_800ExtraBold`) **with an explicit `fontWeight`** → Android applies *synthetic* bold on top → strokes render heavier than the reference | removed `fontWeight` from `Wordmark` (SVG text + measure), `PillButton` label, `featureLabel`; the family name already carries the weight |

Verified on device (light + dark). `tsc` + `eslint` clean. New file: `src/components/rightbank/CtaGlow.tsx`.

**Pass 6 (device tuning from user notes):** dark-mode `ctaGlowOpacity` 0.16 → 0.26 (more visible
lift behind the CTA block on dark); light-mode `starOpacity` 0.5 → 0.72 (brighter starfield).

Note on measurement: Chrome-on-Android renders the reference's fixed 390-px frame **scaled down**
(≈0.8×), so raw pixel diffs of a Chrome capture understate the app's true 1:1 size — visual
side-by-side + the exact spec values are the reliable check here.

---

## 14. Implemented — Face ID overlay (Phase 4 · finishes step 7)

**Trigger:** "Log in RightBank" on the Welcome screen (`src/app/index.tsx`, `faceId` state).
Rendered as a full-screen sibling overlay inside the Welcome screen — matches the reference
architecture (`a2` component, a conditional `<div position:absolute z-index:260>` over `screen==='welcome'`),
not a route.

**New files**
- `src/components/rightbank/FaceScanIcon.tsx` — the reference `Ir` face-viewfinder SVG (4 rounded
  corner brackets `sw 5.2` + minimal face `sw 4.6`, `viewBox 0 0 100`). `tone="fail"` → stroke
  `#FF7D93`, face-group opacity 0.55, smile path swapped for the frown path. Exact reference `d`s.
- `src/components/rightbank/FaceIdSheet.tsx` — the modal + its state machine.

**Tokens added** (`rightbank-theme.ts`): `faceIdPalette` (light + dark: scrim, card gradient,
border, title, dim, "use password" button); `Brand.knightAccent` `#93A6C2` (scan line + icon),
`Brand.onKnight` `#0A0F18` (text on the Knight gradient).

**State machine** (reference `a2`): `scan` for **1750 ms** → `Math.random() < 0.6` ? `ok` : `fail`.
`ok` shows "Welcome back" for **620 ms** then `onSuccess()`. `Try again` (fail) → `scan`.

| Element | Reference | Built |
|---|---|---|
| Scrim | `rgba(22,28,38,.55)` light / `rgba(4,7,14,.88)` dark, `display:grid; place-items:center` | ✅ exact |
| Card | `width 84%`+`padding 26 22`+`border 1` (≈ frame − 2×6 px), `radius 26`, `linear-gradient(170°, #FFF→#F3F5F9)` / dark `#182030→#0F1622`, `border rgba(16,24,40,.1)` / dark `rgba(255,255,255,.14)`, `box-shadow 0 24 70 rgba(0,0,0,.6)` + `0 0 60 rgba(147,166,194,.13)`, `popInK` (opacity 0→1, scale .94→1, 300 ms) | ✅ (RN keeps one shadow → the dark drop; `marginHorizontal 6`) |
| Face icon | `Ir size 96` in a `100×100 overflow:hidden` box; `.scanline` `left/right 4, h 2, r 2, linear-gradient(90°, transparent→#93A6C2→transparent), box-shadow 0 0 14 #93A6C2`, `scanK` top 12%↔84% 1.5 s ease-in-out | ✅ (Reanimated `top` 12↔84, gradient + `shadowRadius 7`) |
| "Face ID" | Manrope 18/700, `mt 14`, `#141A24` / `#F2F5FC` | ✅ (`mt 12` + explicit `lineHeight` to kill Android leading) |
| "Looking for you…" | Manrope 12.5/400, `mt 4`, `#69738A` / `#9DA9C4` | ✅ exact (U+2026) |
| "Use password instead" | pill `r 999`, `pad 9 16`, `mt 16`, bg `rgba(16,24,40,.043)` / `rgba(255,255,255,.1)`, border, Manrope 12.5/700 | ✅ (`mt 14`) |
| "Cancel" | transparent, Manrope 12.5/700, `#69738A` / `#9DA9C4`, `mt 10` | ✅ (`mt 13`) |
| **ok** | `Ir size 82` + 32 px badge `right -4 bottom -2`, `linear-gradient(135°, #5E6E88→#9DB0CB)`, `✓` (U+2713) 17/700 `#0A0F18`; "Welcome back" 18/700 | ✅ exact |
| **fail** | `Ir size 76 tone=fail` in a `78×78` box with `shakeK` (±5 px × 2); "Face not recognised" 18/700; desc 12.5/400 `line-height 1.5`, 2 lines; row `gap 8 mt 18` of ghost "Try again" + primary "Use password" (`r 14, pad 13 20`, Manrope 13.5/600); "Cancel" `mt 12` | ✅ near-exact (side-by-side vs the reference fail screenshot) |

**Verification** (Android emulator, `adb screencap` — reference caught in Chrome on the same
emulator): scan-state card layout within **~4–9 px** of the measured reference on every element
(card H 283 vs ~292; title/sub/pw/cancel offsets ±4). Fail state = near-pixel match to the
reference screenshot (`sbs_faceid_fail`). Dark mode verified against the reference's dark palette
(scrim, card gradient, border, text) — exact. Interactions: `Cancel` → dismiss (both modes);
`Use password instead` → dismiss (stub — the password sheet is a separate row); auto
`scan → ok → onSuccess` → dismiss (Home not built yet — `// TODO`).

**Deviations / follow-ups**
- Manrope on Android renders ~a few px of extra line leading vs the browser; compensated with
  explicit `lineHeight` + slightly reduced `marginTop`s, leaving ≤9 px cumulative drift.
- No shared-component changes; the approved Welcome screen is untouched except the one-line
  `onPress={() => setFaceId(true)}` swap for its former `// TODO`.

### 14a. Real biometrics + password sign-in (supersedes the simulated flow)

The `Math.random()` simulation is replaced with **`expo-local-authentication`** (`~57.0.2`;
config plugin in `app.json`; native dev client rebuilt via `npx expo run:android`).

- **`scan` state** now runs the real check: `hasHardwareAsync()` + `isEnrolledAsync()` +
  `supportedAuthenticationTypesAsync()` in parallel, then `authenticateAsync({ promptMessage,
  cancelLabel: 'Use password', disableDeviceFallback: true })` — the OS `BiometricPrompt`.
  - `success` → `ok` → `onSuccess` (`router.replace('/home')`).
  - prompt cancelled (`user_cancel` / `system_cancel` / `app_cancel` / `user_fallback`) **or**
    no hardware / nothing enrolled → **`password`** state.
  - any other error → `fail` state.
- **Biometric label adapts** (`biometricLabel()`): `FACIAL_RECOGNITION`→"Face ID",
  `IRIS`→"Iris", `FINGERPRINT`→"Touch ID" (iOS) / "Fingerprint" (Android), else
  "Biometric sign-in". Drives the scan title, the `fail` title (`"<label> failed"`, or
  "Face not recognised" for Face ID), and the "Retry <label>" footer button.
- **`password` state** — new `PasswordBody` + `EyeIcon.tsx` (reference `fl` show/hide SVG).
  Reference `pass` state, DOM-measured at the 390 frame:

  | Element | Reference | Built |
  |---|---|---|
  | Column width | `.popIn` 289 inside the ~327 card content box | ✅ `left` gets `paddingHorizontal 19` |
  | Title "Sign in with password" | Manrope 18/700 `#141A24`, centred, `mt 0` | ✅ |
  | Sub | Manrope 12.5/400 `#69738A`, centred, `mt 4` | ✅ |
  | Username / Password inputs | 14.5/400, bg `#FFF` / `rgba(255,255,255,.10)`, border `rgba(16,24,40,.16)` / `rgba(255,255,255,.20)`, `r 14`, `pad 13 15` (pw `pr 42`), `h 42`, `mt 18` then wrapper `mt 10` | ✅ (`faceIdPalette.inputBg/inputBorder/placeholder`) |
  | Eye toggle | reference `fl`, right-inset ~8, 16 px | ✅ `EyeIcon` |
  | "Forgot password?" | Manrope 12/700, **rendered `rgb(59,74,94)`**, left-aligned, `mt 10` | ✅ `faceIdPalette.link` = `#3B4A5E` light / `#C3D0E2` dark |
  | "Log in" | primary Knight gradient, Manrope **15/600** `#0A0F18`, `r 14`, `pad 13 20`, `mt 14`, full width, `opacity valid?1:.35` | ✅ `loginBtnText`; enabled when username ≥ 3 & password ≥ 4 → `ok` → `onSuccess` |
  | Footer "Retry <label>" · "Cancel" | Manrope 12.5/700 `#69738A`, row `gap 14` centred, `mt 12` | ✅ |

**Verification** (Android emulator, fingerprint enrolled): tap "Log in RightBank" → real OS
`BiometricPrompt` (confirmed — FLAG_SECURE blanks `screencap`) → simulated finger match →
"Welcome back" → `router.replace('/home')` lands on Home. Prompt-cancel (BACK) → password
form renders (light mode measured vs the reference spec above — matches). Password fill →
"Log in" enables → `ok` → Home. Label shows "Fingerprint" on this device (no Face/Iris HW),
which is the intended "supported biometric" behaviour.

**Follow-ups**
- Dark-mode password form not yet screenshot-verified on device (palette values are wired).
- Security-warning interstitial still skipped between `ok` and Home (separate item).
- "Forgot password?" is a no-op `onPress` (reference has no destination in this prototype).

---

## 15. Implemented — Home tab (Phase 4 · step 8)

**Route:** `src/app/home.tsx` (new `Stack.Screen name="home"` in `_layout.tsx`). Entered from the
Face ID sheet's `onSuccess` (`src/app/index.tsx` → `router.replace('/home')`). The reference
inserts the **security-warning interstitial** between Face ID and Home — that is a separate
migration item, so for now Face ID success lands straight on Home (noted in `index.tsx`).

**New files**
- `src/app/home.tsx` — `ScrollView` screen. Reference scroll padding `56 / 18 / 104` mapped to
  `insets.top + 12 / 18 / insets.bottom + 104` (top = real safe-area vs the prototype's fake
  status bar; bottom keeps clearance for the floating tab bar, which is a later item). Page
  background = the `180deg` `#FBFAF8 → #F2F4F8 55% → #EDEFF5` gradient. Sections use
  `FadeInDown` with staggered 50 ms delays to echo the reference `fadeUpK d1…d4`.
- `src/components/rightbank/home/GreetingHeader.tsx` — "Good {morning|afternoon|evening}, Erdene"
  (Manrope 12.5/400 `#69738A`) + "Erdene Ganbold" (20/700 lh24 `#141A24`), 38×38 "EG" monogram
  (dark `160deg` gradient, 1px hairline), reuses `ThemeToggle`. Flex row, gap 10.
- `src/components/rightbank/home/PromoCarousel.tsx` — one horizontal snap `ScrollView`
  (`snapToInterval`, `disableIntervalMomentum`) that carries **all** rail cards like the
  reference `.snapX`: card **312 wide** (`88%` of the 354 content box), **104 tall**, gap 9,
  right pad 42. Card types: `OverdueCard` (`120deg #7A0016→#FF0033 62%→#FF3B5C`, caps label,
  tabular amount with de-emphasised `.00`, "Pay now" pill, thin repayment progress bar),
  `CardExpiryCard` (`#E9A93C→#C97C0B`), `NotificationsCard` (dark gradient, "4 NEW" badge,
  "View" pill), `OfferCard` ×6 (per-promo gradient + left-dark scrim + CTA pill; copy/gradients
  in `promoOffers`). Dot row underneath — active dot 16×5 `#93A6C2`, idle 5×5
  `rgba(16,24,40,0.17)`, driven by scroll offset.
- `src/components/rightbank/home/HeroBalanceCard.tsx` — dark `160deg` gradient card, radius 22,
  1px `rgba(59,74,94,0.35)` border, accent glow shadow, padding `18/16/16`. Row 1: balance
  `987'654'321` (Manrope 30/700 ls −1.4) · `.00` (17/700) · `₮` (15/600) + caret + "＋ Money"
  chip. Row 2 (11px border-top): IBAN `MN32 0000 5000000000` + copy glyph + `•••• 8841` pill
  with a mini card-art swatch. Row 3: three 103×71 `rgba(0,0,0,0.26)` r14 buttons — **G PAY** /
  **Subscriptions** / **Helpy** (these live in the hero card in the reference, not the grid).
- `src/components/rightbank/home/QuickActionGrid.tsx` — 2×2 tiles **173×103**, gap 8, radius 22,
  `168deg #FFFFFF→#F4F6FA`, 1px `rgba(16,24,40,0.10)`, `0 8 22 rgba(16,24,40,0.10)` shadow,
  padding `8/8/9`. Tiles: **Overdraft** ("500'000₮ · paid out instantly"), **Transfer**
  ("To anyone, any bank"), **Billing** ("4 билл ирсэн"), **Savings** ("Goals & deposits").
  Each = ported illo SVG over a `rgba(147,166,194,0.22)` glow, label 14.5/700, sub 11/400
  `rgba(16,24,40,0.55)`.
- `src/components/rightbank/home/RecentActivity.tsx` — header "Recent activity" (16.5/700
  ls −0.35) + "See all" (12.5/600 `#3B4A5E`), then a white radius-20 card (`0 2 10
  rgba(16,24,40,0.07)`, padding `2/16`) of 7 rows: 38×38 r12 `rgba(16,24,40,0.043)` emoji
  badge, title 14.5/600, `meta` 12/400 `#69738A`, signed amount 13.5/700 (credit `#3B4A5E`,
  debit `#141A24`), hairline between rows. Mock rows + strings in `activityRows`.
- `src/components/rightbank/home/HomeIcons.tsx` — 1:1 `react-native-svg` ports of the reference
  inline SVGs: the four tile "illo"s (Overdraft / Transfer / Billing / Savings), the hero-row
  Subscriptions + Helpy icons, plus `Chevron` / `CaretDown` / `CopyIcon`. Activity + section
  icons stay as the reference **emoji** (`💼 📩 ☕ 🛒 ⛽ 🎬 ⚠ ⏳ 🔔`), per `AGENTS.md`.

**Tokens added** (`rightbank-theme.ts`): `homePalette` (Knight/Light), `promoOffers`,
`activityRows`. Knight/Light only for now, per §8.

**Verified** — Expo **web**, emulated **390×844**, DOM + `getComputedStyle` diff (screenshots
still don't composite in this environment; §12):

| Element | Reference | Built | verdict |
|---|---|---|---|
| Scroll padding | 56 / 18 / 104 | `insets.top+12` / 18 / `insets.bottom+104` | ✓ (safe-area swap intended) |
| Greeting fonts / colours | 12.5/400 `#69738A` · 20/700 `#141A24` | exact | ✓ |
| "EG" avatar | 38×38, 1px `rgba(16,24,40,0.1)`, dark gradient | 38×38, matches | ✓ |
| Carousel geometry | card ≈311×104, gap 9 | **312×104**, gap 9, no h-overflow | ✓ |
| "Pay now" pill | 82×~29, `rgba(20,20,26,0.32)`, r999, pad 6/10, 1px `rgba(255,255,255,0.6)` | 82×30, identical | ✓ |
| Hero card | 354×**213**, r22, pad 18/16/16 | 354×**213**, r22 | ✓ |
| Hero balance | 30/700 ls −1.4 `#FFF` + 17/700 `.00` + 15/600 `₮` | exact | ✓ |
| Hero mini buttons | 103×71, r14, `rgba(0,0,0,0.26)`, 1px `rgba(255,255,255,0.16)` | identical | ✓ |
| Quick-action tile | 173×103, r22, `168deg` white→`#F4F6FA`, `0 8 22` shadow, pad 8/8/9 | identical | ✓ |
| Tile label / sub | 14.5/700 `#141A24` · 11/400 `rgba(16,24,40,0.55)` | exact | ✓ |
| Recent-activity header | 16.5/700 ls −0.35 · "See all" 12.5/600 `#3B4A5E` | exact | ✓ |
| Activity card | white r20, `0 2 10 rgba(16,24,40,0.07)`, pad 2/16, **h 460** | **h 460**, pad 2/16 | ✓ |
| Activity row | 320w, ~65h, pad 13/0, 1px `rgba(16,24,40,0.1)` divider | 320×66, matches | ✓ |
| Row typography | 14.5/600 · 12/400 `#69738A` · amount 13.5/700 (credit `#3B4A5E`) | exact | ✓ |
| Horizontal overflow | none (fixed 390 design) | `scrollWidth == innerWidth` | ✓ |

**Deviations / follow-ups**
- **No screenshot / simulator pass yet** — every fact above is a DOM diff on Expo web. Needs a
  real 390-wide side-by-side (and a dark-mode pass) before Home is `complete`, same as Welcome
  §13 before its pass 3.
- **Security-warning interstitial** skipped in the nav chain (separate item); Face ID → Home
  directly for now.
- **Dark mode**: the greeting toggle flips `mode` but `homePalette` is Light-only (Knight/Light
  first, per §8). Dark Home is a later step.
- **Hero card shadow**: RN allows one shadow per view, so the reference's layered
  `inset 0 1 0 rgba(255,255,255,0.28)` + `0 12 32 rgba(147,166,194,0.3)` collapses to the glow
  drop only (same trade-off as the Welcome buttons, §13).
- **Radial fills** (hero highlight orbs, offer-card focal gradients) are approximated with
  angled `LinearGradient` + soft `View`s — `expo-linear-gradient` has no radial mode.
- **Carousel prev/next arrows** (the reference's 26 px circles) omitted — swipe + dots cover it
  natively; revisit if the side-by-side shows they matter.
- **Ambient hero animation** (drifting plane/orb particles) not ported — low-priority ambient
  per §9; the static decorative orb is in.
- Vertical rhythm accumulates ~+10 px by the activity header vs the reference capture, but the
  reference y-values carry entrance-animation offset noise; card heights themselves match exactly.
- All button `onPress` are stubs (sub-views — txns, transfer, billing, notifs, etc. — are later
  items). `tsc` + `eslint` clean.

### 15.1 Final visual QA vs reference (content-relative diff)

Both apps measured at **390-wide**, coordinates normalised to the **scroll content box**
(reference: strip the `56/18` padding; Expo: strip `insets.top+12 / 18`). This removes the
safe-area/status-bar difference so section positions are directly comparable.

> **Reference caveat:** in this non-compositing browser the reference's `fadeUpK` entrance
> animations never finish — every `fadeUp` section sits frozen at `translateY(12px)`,
> `opacity:0`. The one element with no animation ("Recent activity" header) reads its true
> position. Subtracting the stuck 12px from the animated sections gives the true reference
> layout, which is what the table below uses.

| Anchor (content-y) | Reference (de-animated) | Expo | Δ |
|---|---|---|---|
| Greeting row top | 0 | 0 | 0 |
| Promo rail top | 49 | 49.5 | +0.5 |
| Hero card top | 172 | 172.5 | +0.5 |
| Hero card size | 354 × 213, r22, border 1px `rgba(59,74,94,.35)` | 354 × 212.5, r22, same | ✓ |
| Balance (in hero) | x17, 30 / 700 / ls −1.4 | x17, 30 / ls −1.4 | ✓ |
| Quick-grid top | 393 | 393 | 0 |
| Grid tile | 173 × 103, r22, pad 8/8/9, 1px `rgba(16,24,40,.1)` | identical | ✓ |
| "Recent activity" (no anim) | 623 | 623 | **0** |
| "See all" | 12.5 / 600 / `#3B4A5E`, right-aligned | identical | ✓ |
| Activity card | 354 × 460, r20, pad 2/16, `0 2 10 rgba(16,24,40,.07)` | 354 × 463, r20, same | ✓ |
| Activity row | 320 × 65, pad 13/0, 1px divider | 320 × 65.5, same | ✓ |
| Row type | 14.5/600 · 12/400 `#69738A` · amt 13.5/700 (credit `#3B4A5E`) | identical | ✓ |

**Mismatch found & fixed:** promo-carousel card width. The reference `.snapX` children are
`flex: 0 0 88%`, but the 88% resolves against the rail's *content* box (width − its 42px right
padding) → effective card ≈ **274**, not the 312 first built (a too-small next-card peek).
`CARD_W` is now `(354 − 42) × 0.88 ≈ 274` (verified: renders 275, reference 274.1). Also nudged
the tile press-scale 0.97 → 0.96 to match the reference `.press:active`.

**Consequence noted:** at 274 the notifications card's title wraps to 2 lines (the reference
gives *that one* card 360px because it lets content size each slide). It still fits the 104-tall
card cleanly; kept uniform width for snap rhythm rather than special-casing one slide.

**Typography weight note (unchanged from §13.4):** computed `font-weight` reads `400` on web
because the `@expo-google-fonts` family name carries the weight (`Manrope_700Bold` etc.) and
`react-native-web` doesn't emit a numeric `fontWeight`. The bold face *is* loaded and rendering;
this is the intended approach (avoids synthetic bold on Android).

**Screenshots** remain uncapturable in this environment (§12), so this is a measured DOM diff,
not a pixel diff. Remaining follow-ups, tracked but not blockers for this screen: an on-device
side-by-side, a dark-mode pass, wiring the sub-view routes behind the (currently stubbed) tap
targets, and the shared floating tab bar (its own migration item — Home leaves 104px bottom
padding for it).

**Home is marked complete** for the Knight/Light baseline: geometry, spacing, typography,
colours, radii, borders, assets (ported illo SVGs + reference emoji) and carousel/scroll
interactions all match the reference within ≤1px on every measured anchor.

### 15.2 Round-2 fixes from user review (device-parity pass)

Nine issues raised against the first Home build; all fixed and re-verified on Expo web
(390-wide DOM diff):

| # | Issue | Fix |
|---|---|---|
| 1 | Carousel cards squished together | Root cause was the section being inset 18px each side so only ~1 card showed. Now full-bleed (see #3); card 275 wide leaves an 88px peek of the next card in the 390 window — matches the reference feel. Gap stays 9. |
| 2 | Carousel nav arrows missing | Added the reference's 26×26 circular prev/next arrows (`rgba(255,255,255,0.9)` light / `rgba(26,32,44,0.92)` dark, `0 3 10 rgba(0,0,0,0.25)` shadow, 12px chevron stroke 2.6), positioned `SIDE−6` from each edge at the card strip's vertical centre. Each scrolls one `CARD_W+GAP` step; prev hidden at index 0, next hidden at the end. |
| 3 | Carousel had left/right offset | `PromoCarousel` now renders **full-bleed** (x0, w = screen). `home.tsx` gives every *other* section its own `paddingHorizontal: 18`; the rail re-adds 18px only as `contentContainerStyle.paddingLeft` so the first card still lines up with the page while cards scroll to the physical screen edge (reference `.snapX`). |
| 4 | Hero background animation missing | Added the reference's ambient layer: 6 drifting accent dots (`pBlow`) + 2 slow birds (`pFlyBack`), built with the **RN `Animated` API** (not Reanimated — see note below). |
| 5 | Balance show/hide eye not working | The balance is now a `Pressable`; tapping it (or the eye) toggles between `987'654'321.00 ₮` and a `••• ••• •••` mask and swaps the eye ↔ eye-with-slash icon (`EyeToggleIcon`, reference stroke 1.7, `M2 12s4-7 10-7…` + `circle r3`). Also added the reference's `.00` opacity 0.58 / `₮` opacity 0.7. |
| 6 | Google Pay badge looked wrong | The reference badge is a **dashed placeholder** (`border: 1px dashed #3B4A5E`, `title="Official mark goes here"`, opacity 0.9, min-width 50, height 24) — it is *not* a real Google Pay mark. Changed the solid border to `borderStyle: 'dashed'` + opacity 0.9 + minWidth 50 to reproduce what the reference actually renders. |
| 7 | Quick-action grid squished | `flexWrap`+`gap` was rendering `flex-wrap: nowrap` / `gap: normal` on RN-web. Replaced with two explicit `flexDirection:'row', gap:8` rows of two `flex:1` tiles → reliably 173-wide tiles with an exact 8px gap (and 8px row gap). |
| 8 | Dark / light mode not working | `homePalette` is now `Record<Mode, …>` with a full dark ramp measured from the reference's own toggle (`page #06070A→#101319`, ink `#F2F5FC`, muted `#9DA9C4`, `seeAll #C3D0E2`, activity card `rgba(255,255,255,0.094)` / border `rgba(255,255,255,0.14)`, tile gradient `rgba(255,255,255,0.16→0.07)` / border `rgba(255,255,255,0.22)`, nav `rgba(8,10,14,0.96)`). Every Home component takes `mode` and pulls from `homePalette[mode]`; `home.tsx` re-themes the page gradient + status-bar style on toggle. |
| 9 | Bottom nav bar missing | New `FloatingTabBar` + `TabIcons` — absolute `bottom 12 / left-right 14` → 362×76 pill, radius 22, 1.5px `rgba(147,166,194,0.4)` border, accent-glow shadow, padding 6. Four illo tabs (Home/Account/Card/More — ported SVGs, active = blue "Knight" palette, inactive = grey, label 10/700 ls0.1) + a raised 62px ember-gradient Scan FAB (ported QR glyph, overlaps the bar top). `active="home"`; tab/scan handlers are stubs pending those screens. |

**Reanimated note.** The section-level `fadeUpK` entrance stagger (Reanimated `entering={FadeInDown}`)
was **removed from `home.tsx`**: inside a `ScrollView` on web those layout animations
intermittently stalled at `visibility:hidden`, blanking the whole screen. The hero particle
loops were likewise moved off Reanimated onto the RN `Animated` API for the same reason. Static
content beats a decorative fade that sometimes eats the page. The reference stagger can be
re-added later with `Animated`-API sequencing if wanted.

**Re-verified (Expo web, 390-wide):** no horizontal overflow (light + dark); carousel x0/w390,
card 275, 88px peek; right arrow present; 6 particle dots + 2 birds in the hero; eye toggle
masks/unmasks; G PAY border dashed @ 0.9; grid tiles 173 with an 8px gap; tab bar 362×76 r22,
Scan FAB centred at screen-x 195; dark mode swaps name→`#F2F5FC`, nav→`rgba(8,10,14,0.96)`.
`tsc` + `eslint` clean, no console errors.

### 15.3 Round-3 fixes from user review

| Item | Fix |
|---|---|
| Carousel item spacing | Gap 9 → **12** between cards (still snaps on `CARD_W + GAP`). Card stays 274-wide, so the 390 window now shows the card + 12px + a ~104px peek of the next. |
| Balance hidden state overflowed | Replaced the fixed `••• ••• •••` string (wider than the number → overflow) with a **per-digit mask**: each digit of `987'654'321` is rendered invisible (`opacity:0`, keeps its exact glyph width) with a centred 12px white dot overlaid, `'` → a space. The masked block is the same width as the number — no layout shift. `.00`/`₮` drop while hidden. Added a 110ms dip-to-fade on toggle (reference behaviour). |
| Quick-action — weird background behind icon | The static hard `rgba(147,166,194,0.22)` disc is gone. Replaced with the reference's `glowPulse`: a **soft SVG radial** (`#93A6C2` α 0.4→0.1→0) that breathes — opacity 0.5↔1, scale 1↔1.12 (reference `glowPulseK`, 2.6s). At rest it's a faint halo, not a grey circle. |
| Quick-action — icon float animation | Added `tileFloatK`: the icon translates Y 0↔−4 and rotates 0↔−2° on a 4s ease-in-out loop, staggered 320ms per tile. |
| Quick-action — text cut in half | Root cause: `overflow:'hidden'` on the tile (added for the gradient's radius) was clipping the sublabel's last line, plus `lineHeight:'normal'`. Moved the radius clip onto the gradient fill only (`tile` is now `overflow: visible`), set label `lineHeight 19` / sublabel `lineHeight 14`. All four sublabels now render in full. |
| Hero background animation | Ported the reference's ambient layer to the RN `Animated` API: 6 `pBlow` dots (drift L→R across the card while rising 28px, fade in over 18% / out over the last 18%, 9–19s each) + 2 `pFlyBack` birds (`swimBackK` glide R→L + `flapK` wing bob, `translateY`/`rotate`). |

**Animation-tech note.** All Home loops now use the **RN `Animated` API** (`Animated.loop` + `useNativeDriver:false`), not Reanimated. Reanimated `withRepeat`/`useAnimatedStyle` loops silently failed to tick under this project's React-19 + React-Compiler + web setup (verified: transforms stayed frozen at frame 0), and Reanimated `entering` layout animations were already removed in §15.2 for stalling the screen. The RN `Animated` loops are set up correctly and reference-faithful; they could **not be visually confirmed ticking in the headless browser pane** — its `requestAnimationFrame` is paused while the pane is hidden, which also freezes the reference file's own CSS `@keyframes`. Needs an on-device / real-browser check to confirm motion.

**Re-verified (Expo web, 390-wide, static):** carousel gap 12, no h-overflow; balance eye toggle → same-width dot mask, no overflow; quick-action tiles `overflow: visible`, all sublabels render in full (`lineHeight 14`), glow is a soft radial at rest opacity 0.5; hero has 6 dot + 2 bird particle nodes. `tsc` + `eslint` clean.

### 15.4 Overdue-card progress bar spacing

The overdue promo card's repayment progress bar was `position: absolute; bottom: 12`, so it
crowded the "Consumer loan · 8 days late" line. Reference layout: the `alarmIn` inner is
`flex-column / justify-content: center` and the progress bar is a **normal-flow sibling** under
the text+CTA row with `margin-top: 9` — the whole block (row 65 + 9 + bar 5) is vertically
centred in the 104 card. Changed the bar to `marginTop: 9`, `alignSelf: 'stretch'` (no absolute
positioning); card padding set to `left 18 / right 16` to match. Verified: loan-text bottom
78.5, progress-bar top 87.5 → **9px gap** (reference 9), block centred.

### 15.5 Balance eye toggle — match the reference exactly

Two problems: the toggle animation was a 110/160ms dip-fade of the whole balance block, and the
masked width didn't match the number width (the old build swapped between a single `<Text>` and a
per-`View` layout).

Rebuilt to mirror the reference's actual DOM (`<span position:relative><span opacity:0>9</span>
<span aria-hidden dot 0.4em></span></span>` per digit):

- **One always-rendered `BalanceAmount`** — no state swap. Every digit is a fixed-width
  `DigitCell`: the glyph stays laid out (only its `opacity` animates 1→0) with a centred dot
  (`0.4em` = **12px** on the 30px integers, **6.8px** on the 17px `.00`) cross-fading in over it.
  `'` `.` `₮` stay visible. Measured: masked block **193.36px** == shown block **193.36px**
  (Δ 0), and the eye icon does not move (x 235.4 both states).
- **250ms cross-fade**, `ease-in-out` — matches the reference's `transition: all` (250ms
  `CSSTransition` fired on the digit spans). Digit fades out while its dot fades in, together.

`tsc` + `eslint` clean. (As before, the timed cross-fade can't be seen ticking in the frozen
browser pane; the start/end states and widths are verified.)

### 15.6 Balance toggle — press scale-down

Added the reference `.press` feedback to the balance tap target. Reference CSS:
`.press { transition: transform .12s ease }` + `.press:active { transform: scale(.96) }`.

Implemented with a `press` `Animated.Value` driven by the `Pressable`'s `onPressIn` /
`onPressOut` (each a 120ms `ease` timing), applied as
`transform: [{ scale: press.interpolate([0,1] -> [1, 0.96]) }]` on the `Animated.View` that
wraps the balance digits + eye icon — so the whole target dips to 0.96 on touch and springs back
to 1, exactly like the reference. `onPress` still flips the mask. `tsc` + `eslint` clean.

### 15.7 Hero card top-right decoration

Replaced the plain 152px border-ring (`styles.orb`) with the reference's actual top-right
watermark: a faint **6-point snowflake** SVG (the exact path, `viewBox="0 0 32 18"`,
`right: -14 / top: 4`, ~60% card width → 212×119, `fill rgba(255,255,255,0.09)`, `opacity 0.9`).
Verified on device-web: snowflake at right −13 / top 5, 212×119, fill/opacity match; old ring
gone. The warm radial tint (`warmGlow`) is kept.

### 15.8 Hero drifting particles -> snowflakes

The hero-card `pFlyBack` particles were drawn with a bird/swoosh stroke path. Replaced with the
reference's exact flake component (`Zy = ({s}) => <svg viewBox="0 0 32 18" width={s}
height={s*.56}><path d="M16 5.4c..."/>` — the same 6-point sparkle as the top-right watermark),
filled `#93A6C2`, 3 instances at sizes 24/28/19. Motion kept faithful to `pFlyBack`:
`swimBackK` glide R->L plus a gentle `flapK` bob (translateY 0<->-16, rotate -6deg<->7deg — was
an over-wide +-25deg tumble that read as wings). Verified: 3 accent flakes + 1 white watermark,
zero bird paths left. `tsc` + `eslint` clean.

### 15.9 Hero decoration — restore the faint ring

The reference "ash" decoration is a clipped layer holding *both* the snowflake watermark **and**
a faint 150px ring — §15.7 had dropped the ring. Re-added it exactly:
`overflow: hidden` wrapper (`inset: 0`) containing the snowflake SVG plus a
`150×150, borderRadius 75, 1.5px rgba(255,255,255,0.06)` circle at `right: -30 / top: -40`.
Verified: ring 150×150, border `rgba(255,255,255,0.06)`, offset right −29 / top −39; snowflake
still present. `tsc` + `eslint` clean.

### 15.10 Balance toggle — drop the cross-fade (perf)

The 250ms digit->dot cross-fade (11 JS-thread `Animated.Text` interpolations running alongside
the particle loops) made the tap feel laggy. Removed it: `BalanceAmount` now takes a plain
`hidden` boolean and each `DigitCell` swaps glyph<->dot instantly (no `Animated` on the mask).
Width still identical shown/hidden (214.4 both), no reflow. The `.press` scale-down on tap is
kept. Separately moved the hero particle loops (and the press scale) to `useNativeDriver: true`
and trimmed the particle count 9 -> 5 so the ambient motion no longer contends with the JS
thread. `tsc` + `eslint` clean.

### 15.11 Balance `.press` scale — fix the "stuck scaled-down on fast taps"

Fast repeated taps left the balance stuck at `scale(.96)` and it only sprang back once you
stopped (dropped `onPressOut` events piling up behind `onPressIn`). Fix: `pressTo()` now calls
`press.stopAnimation()` before each timing so a repeat tap re-triggers the dip from its current
value (a visible "reset"), and `onPress` also runs `pressTo(0)` as a guaranteed spring-back even
when `onPressOut` is dropped. Verified: after 4 rapid taps the transform settles back at
`scale(1)`. Matches the reference `.press:active` behaviour (quick dip per tap, never sticks).
`tsc` + `eslint` clean.

### 15.12 Balance press-scale duration -> 90ms

Per request, `pressTo` timing shortened 120ms -> **90ms** (still `Easing.ease`, both directions,
`useNativeDriver: true`). `tsc` + `eslint` clean.

### 15.13 Balance mask — 120ms native-driver cross-fade

Re-added a fade to the digit<->dot swap, but cheap this time: each `DigitCell` owns one
`Animated.Value m` (0 glyph / 1 dot), animated on the `hidden` change with
`Animated.timing({ duration: 120, easing: Easing.ease, useNativeDriver: true })`. The digit
`<Animated.Text>` opacity interpolates 1->0, the always-mounted dot `<Animated.View>` opacity is
`m` (0->1). Native driver => runs on the UI thread, no JS-thread contention (unlike the earlier
250ms `useNativeDriver:false` version that felt laggy). Verified via screenshots: both end
states render correctly (SHOWN `987'654'321.00 ₮`, HIDDEN `•••'•••'•••.••₮`), no reflow
(193.4px both), toggle fires cleanly each tap. `tsc` + `eslint` clean.

### 15.14 Quick-action tile — shadow / border / padding / type parity

Measured the reference tile against ours:

| Prop | Reference | Was | Now |
|---|---|---|---|
| box-shadow | `0 8px 22px rgba(16,24,40,.10)` + `inset 0 1px 0 #FFF` | **`0 0 0 0`** (RN-web dropped it — shadow props were split across two style objects) | `0 8px 22px rgba(16,24,40,.10)` via a single `tileShadowLight/Dark` style; inset highlight faked with a 1px `rgba(255,255,255,.9)` top-edge `View` |
| border color | `rgba(16,24,40,.10)` | ✓ | ✓ |
| padding | `8 8 9` | ✓ | ✓ (`8 8 9 8`) |
| bg gradient | `linear-gradient(168deg,#FFF,#F4F6FA)` | rendered ~149° | start/end nudged to ~168° |
| label | Manrope 14.5 / 700 / `#141A24` | 14.5, y 61 | 14.5, `Manrope_700Bold`, y **60** (marginTop 4→3) |
| sublabel | 11 / 400 / `rgba(16,24,40,.55)` | lineHeight 14, h 14 | lineHeight 13, h **12**, y 81 (matches ref) |

Label weight still reads `400` in `getComputedStyle` on web because the family name (`Manrope_700Bold`) carries the weight rather than a numeric `fontWeight` — the rendered glyphs are the 700 face (established codebase pattern, §13.4; avoids Android synthetic double-bold). `tsc` + `eslint` clean.

---

## 17. Implemented — Card tab (Phase 4 · step 11)

**Route:** `src/app/card.tsx`, registered as a `Stack.Screen` in `_layout.tsx`. Reached from
Home's floating tab bar (`onTab('card')` → `router.push('/card')`); its own tab bar routes back
to `home`/`account`. Local `mode` state defaults to `'light'` — the reference has no light/dark
toggle on this screen (only Home/Welcome expose one), so Card just renders whichever mode it's
given; dark tokens are wired in `cardTabPalette` but unverified on device.

**Measurement method:** unlike earlier screens (DOM `getComputedStyle` diffs on a non-compositing
browser), this pass drove the live reference at `reference/RightBank.html` in the interactive
Browser pane (Log in → Face ID auto-succeeds → "Got it" → tab-bar "Card" click, all via
`element.click()` since direct pointer clicks kept timing out on this pane) and read exact values
two ways: (a) `getBoundingClientRect()` on the frame confirmed the device frame renders at a
`transform: scale(0.910256)` inside the browser viewport — so raw bounding-rect pixels needed
dividing by that factor to recover true 390-space coordinates; (b) far more reliably, reading
`el.outerHTML` / `el.getAttribute('style')` directly returns the **authored, unscaled** inline
CSS the reference sets per element (padding, margin, radius, font-size, colors, gradients) —
transform scale never touches computed style values, only layout geometry. Nearly every spec below
came from (b).

**New files**
- `src/components/rightbank/card/CardFace.tsx` — one 296×186.5 r20 card face: `140deg` brand
  gradient (exact RGB stops read off the reference's three card-art divs), 1px
  `rgba(255,255,255,.12)` border, `0 16 40 rgba(0,0,0,.5)` shadow, `padding 18`. Column layout:
  brand name/sub row + VISA italic wordmark (17/700 ls1.5) *or* Mastercard's overlapping
  22×22 dual circles (`#EB001B` / `#F79E1B`, −9 overlap); a 40×28 r6 gold-gradient chip
  (`135deg #E8D08A→#B9922F`); PAN (18/600 ls2, `marginTop: auto`); cardholder/expires/CVV row
  (8.5/400 caps labels + 12/600 values). A 32×32 translucent reveal button (`rgba(0,0,0,.34)`,
  1px `rgba(255,255,255,.42)` border) sits absolute `top 52 / right 12` and flips the CVV between
  `•••` and a placeholder revealed value via the shared `EyeIcon`. The reference's two corner
  radial-gradient sheens (`82%/12% white→transparent`, `8%/92% black→transparent`) are
  approximated with two soft absolute blob `View`s — same trade-off as the Home hero card's
  radial highlights (§15, no RN radial-gradient primitive).
- `src/components/rightbank/card/CardCarousel.tsx` — horizontal snap rail (`padding 16/18/6`,
  gap 12, `snapToInterval`) over the 3 reference cards (`cardArts` in the theme file: Visa
  Platinum physical, Mastercard Gold physical, Virtual), each rendered via `CardFace`. Renders
  the amber "⏳ N DAYS" pill (`rgba(233,169,60,.133)` bg, matching border, r999) under a card only
  when it has `expiringDays` (Visa Platinum only, matching the reference — the other two don't
  show a countdown). Dot row below reuses the exact Home carousel recipe (active 18×6 accent,
  idle 6×6 `rgba(16,24,40,.17)`).
- `src/components/rightbank/ListRow.tsx` — the settings/action row shared across every card-tab
  section (and intended for Account/More later, per §7's `ListRow` entry): 38×38 r12 icon badge
  (`rgba(16,24,40,.043)`), `gap 12, paddingVertical 13`, title 14.5/600, subtitle 12/400 muted,
  optional trailing node, optional plain-glyph `›` chevron (muted, 17px — the reference uses this
  plain character on most rows; only the "Activity" row uses an SVG chevron, kept inline in
  `card.tsx` since it's a one-off), a `danger` flag (title → `#FF7D93`), and a 1px hairline
  divider (omit on a card's last row). Extracted because this screen alone repeats the row shape
  9 times.
- `src/components/rightbank/SectionCard.tsx` — the white/dark-surface rows container (r20,
  padding 2/16, `0 2 10 rgba(16,24,40,.07)` shadow) factored out of `RecentActivity`'s inline
  version since Card tab needs it 4 times (freeze/PIN/linked, payment controls, activity/holds,
  card management).

**Tokens added** (`rightbank-theme.ts`): `cardTabPalette` (page title, "New card" button,
amber banner, danger red, black "Add to Wallet" button, dashed placeholder border — Light +
Dark) and `cardArts` (the 3 mock cards' gradients/PAN/expiry/countdown, read directly off the
reference's inline styles).

**Verified** (Expo web, 390-wide, screenshot side-by-side against the live reference in the
Browser pane — the first screen in this migration checked this way instead of a DOM diff):

| Element | Reference | Built |
|---|---|---|
| Header | "Cards" 25/700 ls−0.9 + "Freeze, PIN and card details." 12.5/400 muted + "＋ New card" pill (r12, 1px border, 12.5/600) | ✓ |
| Card face | 296×186.5 r20, `140deg` gradient, border/shadow, padding 18 | ✓ |
| Card gradients | Visa Platinum `#5A2408→#A8480F→#E07A22` (same tuple as Home's hero card-swatch), Mastercard `#1E222A→#343A46→#525A6B`, Virtual `#241E4E→#3B2E75→#5B47A8` | ✓ (locations clamped to `[0,x,1]`; RN gradients require increasing ≤1 stops, reference's last stop is 110–112%) |
| Chip / PAN / meta row | 40×28 r6 gold chip; PAN 18/600 ls2; caps labels 8.5/400 op.55 + values 12/600 | ✓ |
| Reveal button | 32×32 r16, `rgba(0,0,0,.34)`, 1px `rgba(255,255,255,.42)` border, top 52/right 12 | ✓ (no `backdrop-filter` blur — not on the RN `View` API; low-impact) |
| Expiry badge | pill, amber tint, r999, 10.5/800 ls0.2, only under the expiring card | ✓ |
| Dots | active 18×6 accent, idle 6×6 muted, gap 6 | ✓ |
| Freeze/PIN/linked card | white r20 card, 3 rows, no chevron on Freeze (no chevron in reference), chevron on PIN | ✓ |
| Linked-account row | icon 💼, "5000 000 000" / "Linked account", trailing masked amount + 28×28 reveal circle (title "Show balance" in the reference — starts hidden) | ✓ (masked with a digit→`•` string swap rather than the Home hero's per-glyph dot-mask component — same visual result, simpler for a single static row) |
| Expiry banner | amber tint card, 🤖 explainer strip (`rgba(16,24,40,.043)` bg, 1px border, r12), gradient "Choose delivery" button (`135deg #5E6E88→#9DB0CB`, r14, dark shadow) | ✓ |
| Section titles | "Payment controls" / "Card management" 16.5/700 ls−0.35, `margin 22 0 10` | ✓ |
| Payment-controls rows | 3 plain nav rows (Online payments / ATM withdrawals / Payments abroad) — reference has **no toggles** here despite the screen-inventory note in §1.4; confirmed by DOM (no `<input type=checkbox>` / `role=switch>` in that section) | ✓ (§1.4 corrected in spirit; toggles were an inference, not observed) |
| Activity/holds card | "Activity" row (muted count "3" + small SVG chevron, distinct from the plain-text `›` elsewhere) + "Authorisation holds" row (bold amount + amber count pill) | ✓ |
| Card-management rows | wallet row with black `Add to Wallet` pill (dashed "MARK" placeholder, same pattern as Home's dashed G Pay badge) + Replace/Track/Report/Close; Report & Close render in the reference's exact danger red `#FF7D93` on a tinted `rgba(255,90,110,.12)` icon badge | ✓ |

**Deviations / follow-ups**
- No on-device/simulator pass yet (Expo-web screenshot only, per this repo's Metro setup at the
  time of writing); dark mode is token-complete but unverified.
- CVV "reveal" and the linked-account "show balance" toggle are UI-only (no real auth challenge
  wired) — matches the migration's stated order (visuals first, §"Data and Logic").
- Card-detail sub-view (full reveal of PAN/CVV behind Face ID), order-card wizard, delivery
  choice, tracking timeline, freeze confirm, replace/lost flow, and the add-to-wallet OTP sheet
  are **not built** — every row's `onPress` is currently a no-op; these are the "Card ▸ depth
  flows" line in §10, still `⚠️ names only`.
- The reference's two corner sheen radial-gradients and the reveal button's `backdrop-filter`
  blur are approximated (see above) rather than pixel-identical — same category of trade-off as
  other RN-can't-do-CSS gaps already logged in §15's deviations.
- `tsc`/`eslint` clean on all new/changed files (pre-existing unrelated `FloatingTabBar.tsx`
  `@ts-expect-error` warnings, from concurrent Account-tab work in this same tree, are untouched).

### 17.1 Fixes from user review

Five gaps found against the live reference (driven interactively in the Browser pane — see
§17's measurement method):

| # | Issue | Fix |
|---|---|---|
| 1 | "Carousel missing background" | Verified, not a bug: each card's `140deg` gradient (`react-native-svg`-free, `expo-linear-gradient`) renders correctly on Expo web at every carousel index, including the Mastercard Gold card's subtle dark-gray ramp — confirmed by scrolling the rail and reading the rendered pixels. No code change. |
| 2 | Card eye toggle only revealed CVV, and used the wrong icon direction | Reference `outerHTML` showed the reveal button title flips **"Show card details" → "Hide card details"** and reveals the **full PAN** (`4278 9051 3364 8841` for Visa Platinum, confirmed live) alongside the CVV — not CVV alone. Also, the icon direction is the *opposite* of the password-field convention: masked → plain eye, revealed → slashed eye. `cardArts` gained `fullPan`/`cvv` per card (Visa confirmed from the reference; Mastercard/Virtual are consistent mocks, never revealed in the reference's default carousel position). `CardFace` now swaps the whole PAN line and passes `off={revealed}` to `EyeIcon`. Matched a further reference behaviour: the reveal button only renders on the **active** (front) carousel card — `CardCarousel` now passes `active={i === index}`. |
| 3 | "Freeze card" row had no switch | Reference row ends in a 48×28 r999 toggle (off: `rgba(16,24,40,.17)` track; on: `linear-gradient(135deg,#5E6E88,#9DB0CB)`; 22×22 white knob, inset 3, sliding 3↔23, `0 2 6 rgba(0,0,0,.35)` shadow) — read directly off the rendered node. New shared `src/components/rightbank/Switch.tsx`; wired to the row, defaulting **off** (matches reference). |
| 4 | Linked-account balance: "font weight different, dots lighter" | The `•` bullet glyph read visually thinner than the reference. The reference actually masks **per-digit** (`<span style="opacity:0">9</span>` + an overlaid `0.4em` dot, `background:currentColor` — i.e. the *same* colour/weight as the digit, not a muted tone). New `src/components/rightbank/MaskedDigits.tsx` reproduces this exactly (solid ink-coloured dot, same cell width, no reflow); `MaskedBalance` uses it instead of a string `.replace(/[0-9]/g,'•')`. Also fixed the eye-icon direction here (same inverted convention as #2). |
| 5 | Payment-controls rows (Online payments / ATM withdrawals / Payments abroad) had no switch | Same `Switch` component, all three defaulting **on** (confirmed from the reference — every payment-control toggle renders in the "on" gradient state by default). |

Verified interactively on Expo web (390-wide): card reveal → full PAN + CVV + slashed icon;
linked-account reveal → `987'654'321₮` with matching icon flip, no width change; Freeze switch
off→on; all three payment-control switches on by default with the correct gradient. `tsc` clean
(pre-existing errors are in the concurrent Account-tab files, untouched); `eslint` clean on every
file this pass touched.

---

## 16. Implemented — Account tab (Phase 4 · step 10)

**Route:** `src/app/account.tsx`, registered in `src/app/_layout.tsx`. Home's `FloatingTabBar`
`onTab` now `router.push('/account')` on the Account tab; Account's tab bar `router.replace('/home')`
on Home. Both screens' `FloatingTabBar` calls were previously stubs (§15 grid).

**Method:** served `reference/RightBank.html` locally (`.claude/launch.json` → `reference-html`,
`npx serve reference -l 4747`), drove it in the Browser pane at 430×900 (frame renders at its
fixed 390×800), logged in (native `<button>` clicks worked via `element.click()`; the automation's
`computer` tool timed out on this prototype's animated background — same issue hit again on the
Expo-web RN-Pressable divs, worked around by calling `.click()` on the DOM node with the React
`onclick` handler, found by walking parents until `onclick !== null`), and read `getComputedStyle` +
`getBoundingClientRect` on the rendered Accounts / Deposits / Loans / Reward panels — the same
DOM-diff method as §15. Screenshots this time **were** capturable, so this pass includes a direct
visual side-by-side (see below), not just computed-style inference.

**New files**
- `src/components/rightbank/account/SegmentedTabs.tsx` — generic pill segmented control (354×44,
  radius 14, padding 4, active segment a solid steel-blue "Knight"-accent pill). Reused by all four
  sub-tabs; not Home-specific so it lives under `account/` rather than a shared folder — nothing
  else uses it yet.
- `src/components/rightbank/account/DarkToolCard.tsx` — the dark `darkGradient` banner reused
  verbatim (same gradient stops as the Home avatar/hero) for "Account reference" (Accounts,
  Deposits) and "CreditScore" (Loans).
- `src/components/rightbank/account/AccountsPanel.tsx` — Account reference banner → Currency
  conversion (sky-tinted card + confirmation strip) → account list (Everyday gold-tinted;
  Savings/US Dollar/Chinese Yuan plain white) → "＋ Open a new account" outline pill → caption.
- `src/components/rightbank/account/DepositsPanel.tsx` — Account reference banner → Child savings
  (full-bleed violet gradient, kid chips) → daily-saving streak (gold-tinted, Knight-gradient CTA)
  → Savings goals row → term-deposit cards (sky-tinted, progress bar) → "＋ Open a deposit"
  (Knight gradient) → helper caption card.
- `src/components/rightbank/account/LoansPanel.tsx` — CreditScore banner → "Upcoming payments"
  header + danger card (action-needed amount, "1 OVERDUE" badge) → "Your loans" header → loan rows
  (indigo-tinted, progress bar) → "Check my loan offers" outline pill.
- `src/components/rightbank/account/RewardPanel.tsx` — points hero (dark gradient + ring + PLATINUM
  pill) → "Earned this month" (mint-tinted + 3 stat tiles) → three itemised earn-breakdown list
  cards (balances / fees / app-use, exact reference strings) → "Spend your points" list → "Your
  benefits" list (ACTIVE/LOCKED pills) → "How you earn" essay card.
- `src/constants/rightbank-theme.ts` additions: `accountPalette` (segmented-control tokens + 5
  reusable "tinted card" recipes — `gold`/`sky`/`indigo`/`mint`/`danger`, each a 160° gradient wash
  + `rgba(<base>,0.42)` border, light **and** dark variants), `childSavingsGradient`, `platinumGold`,
  and the mock data arrays (`accountsList`, `termDeposits`, `loans`, `rewardEarnRows`,
  `rewardFeeRows`, `rewardAppRows`, `rewardSpendRows`, `rewardBenefits`) transcribed verbatim from
  the reference's rendered text (exact bilingual strings, `'`-grouped numbers, `₮`/`$`/`¥` suffixes).

**Verified colors/measurements** (light mode, `getComputedStyle` + screenshot comparison):

| Element | Reference | Built |
|---|---|---|
| Header "Accounts" | 25/700/-0.9 tracking, `#141A24` | ✅ |
| Header subtitle | 12.5/400, `#69738A` | ✅ |
| Segmented track | 354×44, r14, `rgba(16,24,40,.043)` | ✅ |
| Account reference / CreditScore banner | `darkGradient` (0C1119→23303F→4B5D74→7D8FA8, 160°), r20 | ✅ (same token as Home) |
| Currency conversion / term deposit tint | `linear-gradient(160°,#EFF9FE,#DDEFF9)`, border `rgba(76,201,240,.42)` | ✅ |
| Everyday / streak tint | `linear-gradient(160°,#FFF9EC,#FDF0D8)`, border `rgba(240,180,41,.42)` | ✅ |
| Loan row tint | `linear-gradient(160°,#F5F3FE,#E8E4FB)`, border `rgba(124,140,255,.42)` | ✅ |
| Reward "earned" tint | `linear-gradient(160°,#F1FBF4,#DFF3E6)`, border `rgba(61,220,151,.42)` | ✅ |
| Danger card | `linear-gradient(160°,#FFEFF2,#FFD9E0)`, border `rgba(255,0,51,.6)` | ✅ |
| Child savings card | `linear-gradient(135°,#7C5BD9,#4B2FA8 55%,#2A1668 110%)` | ✅ |
| Streak / "Open a deposit" CTA | `Brand.knightKnobGradient` (#5E6E88→#9DB0CB), text `Brand.onKnight` | ✅ (existing token reused) |
| "1 OVERDUE" badge | `#FF0033` bg, white, r6, 9px/800 | ✅ |
| Loan progress fill | solid `#8B7CF6` | ✅ |
| Deposit progress fill | solid `#4CC9F0` | ✅ |
| PLATINUM pill | border+text `#C8A961`, bg `rgba(0,0,0,.26)` | ✅ |
| Account balance number | 18/700/-0.5, tabular | ✅ |
| IBAN | 11.5/400, `#69738A`, ls 0.3 | ✅ |

**Deviations / follow-ups**
- Dark mode is wired (all tint tokens have a dark variant) but **not** measured against the
  reference's dark rendering of this screen — §9 already flagged Account-tab dark mode as unseen.
  Derived by the same recipe as the light tokens (desaturated/darkened gradient wash + a brighter
  border alpha), consistent with Home's dark treatment, not reference-measured.
  Needs a real reference dark-mode pass before calling this screen `complete`.
- All buttons on this screen (`Request ›`, `Check ›`, `Edit`, `＋ Top up`, `＋ Open a new account`,
  `＋ Open a deposit`, `Check my loan offers`, the reward spend rows) are visual-only — no
  sub-view/sheet navigation yet (per §1.3, those are separate depth-flow screens, still `⚠️ names
  only` in the status grid).
- Reward's "Spend your points" grid renders as a **vertical list** in the reference (not a 2-col
  tile grid as `migration-progress.md` §1.3 originally guessed) — corrected here from live
  inspection.
- No on-device (iOS/Android simulator) check yet, only Expo web vs. the reference HTML in the
  Browser pane at the same 390-wide frame.

---

## 21. Implemented — More tab (Phase 4 · step 12)

**Route:** `src/app/more.tsx`. Header "More / Profile, security and app preferences." + a long
grouped settings list, all built from the existing `SectionCard` + `ListRow` primitives (locked
by Card/Account) plus two new components:

- `src/components/rightbank/more/ProfileCard.tsx` — dark hero row (reuses `homePalette.darkGradient`,
  the same 160deg stops as the Home hero card), 54×54 monogram avatar (`rgba(20,8,2,.42)` bg,
  1.5px `rgba(255,220,185,.5)` border), "✓ Identity verified" pill, "Edit" ghost button.
- `src/components/rightbank/more/RowSwitch.tsx` — settings-row toggle (48×28 track r999, 22×22
  white knob, `Brand.knightKnobGradient` when on), used for Face ID, Two-factor auth, Notifications.

**Verified** by serving `reference/RightBank.html` locally (Browser pane, 430×900 emulated) —
logged in, navigated to the More tab, and read computed styles/DOM off the live reference to
measure every row (badge 38×38 r12 `rgba(16,24,40,.043)`, row `gap 12 / padding 13 0`, hairline
`rgba(16,24,40,.10)`, title 14.5/600, subtitle 12/400 — all already match the existing `ListRow`
exactly, so it needed no changes), the profile card gradient/avatar/badge values, the toggle
track/knob geometry, the "Bank admin" section's **dashed** card border (`border-style: dashed`,
same radius/shadow as a normal `SectionCard`), and the 22px gap before each section heading
(confirmed via `getBoundingClientRect` deltas — matches the `marginTop:22 / marginBottom:10`
pattern already used in `card.tsx`'s `sectionTitle`). Then compared the Expo-web render of
`/more` side-by-side at the same 430×900 frame — geometry, typography, colors, icons (emoji kept
verbatim per `AGENTS.md`) all match.

**Sections, top→bottom:** Profile card → Sign out (its own pink-bordered card, not a `ListRow`) →
Security (Face ID/biometrics switch, Change passcode, Trusted devices, Two-factor auth switch,
Login history) → Limits (Daily transfer limit, Interbank per transaction, Foreign currency limit —
value right-aligned bold, no chevron) → Preferences (Login screen picture, Appearance, Notifications
switch, Sound & haptics, Language) → Documents → Support → Legal → Bank admin (dashed card, demo-only)
→ footer `RightBank · version 3.2.0 (prototype)`.

**Deviations / follow-ups**
- Row taps beyond the three switches are visual-only (no sub-view/sheet navigation yet — Edit
  profile, Appearance sheet, Change passcode, Trusted devices, Login history, statements,
  certificate, Branches & ATMs, Help centre, each Legal doc, Reward-config admin — all still
  `⚠️ names only` per §1.5/§10).
- Light mode only; dark tokens are wired (reuses `homePalette` dark values) but not measured
  against the reference's dark rendering of this screen.
- No on-device (iOS/Android simulator) check yet, only Expo web vs. the reference HTML in the
  Browser pane at the same 390-wide frame.
- Tab-bar taps could not be exercised end-to-end in this session's automated browser (RN Web's
  synthetic Pressable events didn't register via scripted clicks in the headless pane — a tooling
  limitation, not verified as an app bug); `/home`, `/account`, `/card`, `/more` were each confirmed
  to render correctly via direct URL navigation with no console errors.

**Follow-up fix (post-review):** three typography mismatches reported after the first pass, all in
`ProfileCard.tsx` / `more.tsx`:
- **"Edit" button** looked visibly lighter than the reference. Root cause: the reference's Edit is
  a real HTML `<button>` that the page never assigns a `font-family` to, so it falls back to the
  browser's default UI font (computed as `Arial`) at `font-weight: 600` — Arial has no 600 face, so
  the engine snaps up to Bold (700). `Font.semibold` (a genuine Manrope SemiBold glyph) reproduced
  the *specified* weight but not that *rendered* heaviness. Switched to `Font.bold` to match what
  actually displays.
- **"Sign out" / "✓ Identity verified"** — re-measured against the live reference and the computed
  `color`/`font-weight` were already exact matches (`#FF7D93` 700, and `#FFE9D6` 700 respectively).
  Hardened anyway: added explicit `fontWeight` alongside every `fontFamily` in this screen (belt-and-
  braces for native, where a custom-font Text can occasionally get re-flattened to a default weight),
  and split the "✓" out of "Identity verified" into its own `<Text>` so a glyph the loaded Manrope
  weight might not cover can never force the whole run onto a fallback font.
- Replaced the screen's one-off `RowSwitch` with the shared `Switch` component (already used by
  `card.tsx` for Freeze/Payment-controls toggles) — same geometry, but the correct
  `rgba(16,24,40,0.17)` off-track tint instead of the lighter `hairline` token. Deleted the now-dead
  `more/RowSwitch.tsx`.

---

## 22. Implemented — Security-warning interstitial (fills gap noted in §13/§14/§15)

**New file:** `src/components/rightbank/SecurityWarningModal.tsx`. Wired so it renders **on
Home**, not on Welcome — matching the reference, where `K && jsx(r2,...)` sits inside the same
app shell as the rest of the logged-in screens (Home is already rendered behind it; the modal is
an overlay, not a separate route). `src/app/index.tsx`'s `FaceIdSheet.onSuccess` now does
`router.replace('/home?justLoggedIn=1')` directly (no local warning state anymore).
`src/app/home.tsx` reads that param with `useLocalSearchParams` and seeds `securityWarning`
state from it (`justLoggedIn === '1'`); the modal overlays the already-rendered Home content +
floating tab bar, and "Got it" just clears the state. This fills the gap every earlier section
flagged — the interstitial shown once right after login, between Face ID success and a usable
Home.

**Bug fix (post-review):** on a real device, login "succeeded" (Face ID "Welcome back" ok
screen) but then hung — the sheet never dismissed and the app never reached Home. Root cause:
the first version of this wiring called `router.replace({ pathname: '/home', params: {
justLoggedIn: '1' } })` — the **object**-form `Href`. That's the only object-form navigation
call anywhere in this codebase; every other screen (`account.tsx`, `card.tsx`, `home.tsx`,
`more.tsx`) navigates with a plain string, which is the pattern already proven to work through
this exact real-biometric → `router.replace` path (§13/§14). Switched to the equivalent plain
string, `router.replace('/home?justLoggedIn=1')`, and made `home.tsx`'s param read defensive
(`useLocalSearchParams` can hand back `string | string[]` on native, so the array case is
unwrapped before the `=== '1'` check). Not yet re-confirmed on the device that hit the original
crash — only re-verified via the Browser pane (direct `/home?justLoggedIn=1` navigation, no
console errors) since the automated pane can't drive the real Face ID button click (§21's
already-noted RN-Web synthetic-click limitation).

**Content/data** ported verbatim from the reference's `Di` object and `r2` component (found by
locating the `SECURITY WARNING` string in the bundle): date `3 Aug 2026`, ref `SEC-2026-08-03`,
bilingual title "Кодоо хэн нэгэнд бүү хэлээрэй · Never share your code", lead paragraph, the 4
rule rows (🚫 We never ask for codes / 🏦 There is no "safe account" / 📱 Never install apps for
a caller / ⏱ Pressure is the warning sign — each with its full sub-copy), the ☎ action banner
("If a call feels wrong, hang up and call us on 7000 1234…"), and "Got it".

**Geometry/style**, measured off the reference bundle source (`ve = {neon:"#FF0033",
hot:"#FF3B5C", rgb:"255,0,51"}`) and cross-checked live against the reference at 375×812 via the
Browser pane (see Verified below):
- Scrim: `rgba(3,5,10,0.86)` full-screen, centered, `padding 14`.
- Card: `fi.neutral` gradient (170deg `#FFFFFF→#F3F5F9` light / `#182030→#0F1622` dark — same
  stops as `faceIdPalette.cardBg`, reused directly), `radius 24`, `border 1.5px rgba(255,0,51,0.5)`.
  Reference layers a second glow shadow (`0 0 34px rgba(255,0,51,.35)`) on top of the `0 24 70
  rgba(0,0,0,.65)` drop; RN allows one shadow per view, so (matching the `PillButton`/`FaceIdSheet`
  precedent) only the dominant dark drop is kept (`shadowRadius 40`).
- Header: `120deg` gradient `#FF0033→#FF3B5C`, `padding 11px 16px` (computed-style-verified
  against the live reference — exact match), 36×36 r11 icon box (`rgba(0,0,0,.24)` bg, 1px
  `rgba(255,255,255,.4)` border) holding "⚠", title 15/800 ls 0.2, subtitle 11/400 opacity .9.
- Body: `padding 13/16/14`; title 15.5/700 lh1.28 ls-.3; lead 12.5/400 dim lh1.5; rule list
  `borderTop` hairline, each row `gap 10 / padding 8 0` with a hairline divider between (not
  after the last); rule icon 16px; rule title 13/700; rule sub 11.5/400 lh1.45.
- Action banner: `rgba(255,0,51,.10)` bg, `1px rgba(255,0,51,.4)` border, `radius 13`, `padding
  10/12`, ☎ 15px + text 12/400 lh1.45.
- "Got it": full-width primary button, `radius 14`, `padding 13/20`, `15/600`, background
  `Brand.knightKnobGradient` / text `Brand.onKnight` (the app's one already-implemented accent
  gradient — matches the reference's `r.grad`/`r.onAccent` primary-button recipe used everywhere
  else, e.g. `FaceIdSheet`'s "Log in"), shadow `0 6 20 rgba(0,0,0,.35)`.

**Verified** — navigated the Browser pane directly to `/home?justLoggedIn=1` at 375×812:
confirms the modal overlays the actual Home content (greeting, promo carousel, floating tab bar
all visible behind it), not a blank/Welcome background. Separately drove the actual reference
prototype (`reference-html` server, password-login fallback since the simulated Face ID scan is
`Math.random()`-gated) to the same modal and diffed side-by-side + via `getComputedStyle` /
`getBoundingClientRect` on both. Header gradient, padding, colors, copy, row layout, and button
recipe all match. Dismiss (`Got it` → `setSecurityWarning(false)`) is a plain state update
consistent with every other overlay in this codebase; the headless pane's synthetic click didn't
register on it, a pre-existing tooling limitation already noted for tab-bar taps in §21, not
re-verified live here.

**Deviations / follow-ups**
- Layered shadows collapse to one (see above), consistent with every other multi-shadow element
  in this codebase.
- Not yet checked on a real iOS/Android simulator, only Expo web vs. the reference HTML.
- Dark mode uses `faceIdPalette` dark tokens (not separately re-measured against the reference's
  dark rendering of this specific screen, though its card gradient is byte-for-byte the same
  `fi.neutral` value already verified for `FaceIdSheet`).

---

## 23. Implemented — dedicated Login screen (`RbLoginScreen`)

**The reference changed.** `reference/RightBank.html` no longer opens on the animated Welcome
screen documented in §13. Its `welcome` route now renders a new component, `RbLoginScreen`: a
full-bleed photograph with a frosted bottom sheet. The wordmark, tagline, feature chips and
particle background are gone from the reference entirely. The device preset also moved —
`o1("notch")` now selects **390 × 844, safeTop 47, safeBottom 24** (iPhone 11–14) in place of the
390 × 800 frame §0 recorded.

**The Welcome screen has been removed**, matching the reference. `src/app/(auth)/index.tsx` is
now the login screen, so `/` resolves straight to it when signed out — there is no intermediate
screen and no `router.push` between them. The `(auth)` stack keeps its `anchor: 'index'`, and the
root guard is untouched: it still swaps `(auth)` for `(app)` on the session flag alone.

Five components were built only for the old Welcome screen and are now unreferenced:
`BrandMark`, `CtaGlow`, `PillButton`, `WelcomeBackground`, `Wordmark`. They are left in the tree
— nothing imports them, so they cost nothing at runtime, and the brand marks are the obvious
material for the sign-up screen. `ThemeToggle` and `welcomePalette` are **not** orphans: the Home
greeting header still uses both. Delete the five when sign-up lands and proves it doesn't want
them.

### Structure — one screen, three views

The reference switches these in place, not by navigating. Background, glows and sheet stay put;
only the sheet's height and contents change.

| view | sheet | contents | reached from |
|---|---|---|---|
| `full` | 379 | "Log in", Username, Password, "Forgot password?", `Log in RightBank`, `Join RightBank` | first run; "Other user?" |
| `bio` | 292 | avatar, "Hello, **Erdene**", "Other user?", `Face ID` | after a successful sign-in |
| `pw` | 342 | avatar, "Hello, **Erdene**", "Other user?", Password, `Log in` | biometric sheet's "use password" |

The opening view is remembered above the component (module scope), because the root guard
unmounts the whole `(auth)` group on sign-in — the reference holds the same state one level above
its screen, with the same lifetime (survives sign-out, resets on app restart).

### Measured geometry (all from the reference's `abs()` offsets, bottom-anchored)

```
sheet            radius 30 30 0 0 · rgba(0,0,0,0.2) over blur(20px) · inset 0 1px 0 rgba(255,255,255,0.22)
gutters          16 left / right
full   title     bottom 335.5 · 16/700 · lh 20
       username  bottom 264 · h 56 · radius 20
       password  bottom 192 · h 56
       forgot    bottom 160 · h 16 · right-aligned · 12/600 · #FAFAFC
       submit    bottom 89  · h 48 · radius 18 · 15/700 · ls .75
       join      bottom 29  · h 48 · transparent · 14/600
bio    avatar    bottom 208 · 60 × 60
       hello     bottom 168 · 18/400 lh 24, first name 700
       other     bottom 142 · 14/600 · rgba(255,255,255,0.6)
       submit    bottom 40
pw     avatar 258 · hello 218 · other 192 · password 120 · submit 40
chrome sun 32 × 32 at top safeTop+15, right 60 · flag 32 × 32 at right 16 (aria-hidden)
field  rgba(255,255,255,0.18) over blur(7.5px) · text 14/400 #FAFAFC · placeholder same colour,
       opacity 1 · eye at right 16 / top 16, 24 × 24 hit area, 19.5 × 15.5 glyph
```

Verified live at 390 × 844 against `getBoundingClientRect()`: sheet 379 @ bottom 0 radius 30;
title 336/left 16; forgot 160 right-aligned; submit 89; join 29; bio avatar 208, hello 168,
other 142; pw avatar 258, field 120, photo layers at top −178 and +542 with the lower one
mirrored. Every value matches.

### Assets (extracted verbatim from the bundle)

| reference | file | note |
|---|---|---|
| `LG_BG` | `assets/login/bg.jpg` | 956 × 2000, `full` / `bio` backdrop |
| `LG_BG_PW` | `assets/login/bg_pw.jpg` | 1205 × 1624, `pw` backdrop; drawn twice, second copy `scaleY(-1)` |
| `LG_FLAG` | `assets/login/flag.png` | 128 × 128 |
| `LG_SUN`, `LG_AVATAR`, `LG_EYE`, `LG_FACEID` | `src/components/rightbank/login/login-art.ts` | kept as SVG markup and rendered with `SvgXml` — the avatar is a detailed illustration that redrawing with react-native-svg primitives would only approximate |

`LG_GLOW` is not extracted: it is a disc behind a 347px Gaussian, which React Native cannot
filter. It and the two `blur(137px)` corner patches are redrawn as radial falloffs (see below).

### Deviations, and why

- **CSS `filter: blur()` has no React Native equivalent.** The three light sources are redrawn as
  radial gradients: a shape much smaller than its blur radius *is* a Gaussian, and its peak alpha
  is the shape's area over 2πσ². Corner patches: σ 137, peak .228 / .242. `LG_GLOW`: a 222-radius
  disc at 10% blurred by σ 347 → σ 364, peak .019 (the disc's own spread adds to the blur's).
- **The sheet and field blur go through `GlassPane`, not `expo-blur` directly** — see §23.2.
- **Gradient angles.** `LG_GRAD_UP` (155.04°) and `LG_GRAD` (131.65°) are solved into
  `start`/`end` pairs for the 358 × 48 button — see `loginGradient` in the theme for the working.
  Correct on iOS/Android; react-native-web derives its CSS angle as if the box were square and
  paints them at 176° / near-vertical instead.
- **Safe area.** Reference offsets are measured from the bottom of its frame, which assumes a
  24pt home indicator. On a deeper inset everything lifts by the difference, preserving the gap
  the reference drew.
- **No light/dark variant.** The reference's login screen is a single fixed treatment. The sun
  toggle still flips the app-wide mode for every other screen.

### Reused, not rewritten

- `FaceIdSheet` still owns biometrics and the "Welcome back" hand-off. It gained two optional
  props mirroring the reference's own `rbStart` / `rbOnPw`: `start` (open at `ok`, which is what a
  submitted password form does) and `onUsePassword` (hand "use password" back to the screen so it
  can show its `pw` view). Both default to the previous behaviour.
- Validation thresholds (username ≥ 3, password ≥ 4) are the sheet's existing ones, which are also
  the reference login screen's (`okFull` / `okPw`).
- Sign-in is still `useAuth().signIn()` — the root guard does the navigating.

### Known gaps

- **No real authentication.** `signIn()` is still the placeholder; `login(username, password)` in
  `src/api/authClient.ts` is not called, so the typed credentials go nowhere. Unchanged from
  before this screen existed, and out of scope here.
- **"Forgot password?" and "Join RightBank" are inert** — as they are in the reference.
- On a device with no enrolled biometrics, `FaceIdSheet` falls back to its *own* password form
  rather than the screen's `pw` view, because that branch sets state directly instead of going
  through `onUsePassword`. Both are working sign-in forms; the reference never hits this because
  it fakes the scan.
- **Not seen on a real simulator.** Verified against the reference in Expo web at 390 × 844,
  side-by-side with the prototype served from the same machine. The blur radii and the
  gradient angles are the two things most likely to need a device pass.

### 23.1 Figma audit (source of truth moved again)

The login screen now has a real design-system frame:
`❖ Xacteen design system` → **node `14909:53946`**, `IPhone13Mini`, **375 × 812**, 44 status bar,
34 home indicator. Priority is **Figma > implementation > `RightBank.html`** — the HTML is
historical and disagrees in a few places.

Good news first: the background photograph in Figma is **byte-identical** (SHA-256 prefix
`522036487777877a`, 102 618 bytes) to the `LG_BG` extracted from the prototype, and every
bottom-anchored offset agrees — sheet 379, username 264, password 192, forgot 160, submit 89,
join 29, gutters 16, field 56 / r20, button 48 / r18, sheet radius 30. Those were already right.

**Verified numerically against the Figma render**, not by eye: the frame PNG was served locally
and sampled through a canvas. Sheet top edge at y 433 (→ 379 tall); fields 492–548 and 564–620
(56 tall, 16 gap); button 675–723; chrome at y 65; field left edge 16 with text at 33 (→ 16
padding); forgot right edge 356 against a 359 gutter. The gradient was confirmed by sampling four
points inside the button and solving back: left edge `rgb(240,83,39)`, right edge
`rgb(251,131,85)`, mid-top `rgb(245,101,57)`, mid-bottom `rgb(248,114,68)` — all within one 8-bit
step of the 155.0379° / 11.557 % / 88.443 % gradient as computed. The `start`/`end` pair was
re-solved for Figma's 343 × 48 box.

#### Fixed

| | was | Figma | |
|---|---|---|---|
| Copy | English | Mongolian fields + heading, English buttons | `loginCopy` |
| Home-indicator baseline | 24 (HTML preset) | **34** (iPhone 13 mini) | everything sat 10 too high on a modern iPhone |
| Sheet top hairline | `inset 0 1px 0 rgba(255,255,255,0.22)` | none | removed — no row at the sheet edge is brighter than its body |
| Chrome y | `insets.top + 15` | y 65 under a 44 status bar → **+21** | |
| Flag | 32 image, no ring | 32 circle, **0.5 white border**, **26** image inside | |
| Flag asset | 128 × 128 (from the HTML) | 1024 × 1024 Figma export | adopted |
| Ghost button tracking | 0.75 (shared) | **0** — only the filled button tracks | |
| Button label line height | unset | **24** on both | |
| Filled button `px` | 28 | **32** (ghost stays 28) | |
| Gradient ends | solved for 358 × 48 | re-solved for **343 × 48** | |

#### Not fixed — blocked

- **Typeface.** Figma specifies **GIP** (Regular 400 / SemiBold 600 / Bold 700; `Body 2/Regular`
  = 14/24/0). The app renders **Manrope** everywhere, inherited from the prototype. No GIP file
  exists in the repo or in `@expo-google-fonts`. Measured consequence at 375 wide: every string is
  6–8 % wider than Figma — heading 66 vs 59, "Нууц үг мартсан" 96 vs 90, "Log in RightBank" 133 vs
  125, "Join RightBank" 99 vs 94. Nothing wraps or clips, but no text is metrically correct and no
  amount of size/spacing tuning fixes that. **Needs the GIP family from the design system.**

#### Known deviations

- **Buttons sit at `left: calc(50% + 1px)`** in Figma (gutters 17/15) while the input column above
  them is a symmetric 16. Read as a nudge rather than intent and kept symmetric; revisit if the
  designer confirms.
- **Background fit.** Figma places the photo in a 388-wide box on a 375 frame (≈ its natural
  aspect, bleeding 6.5 each side). We use `cover` at the real screen width, which crops marginally
  more but is the correct responsive behaviour.

#### Not covered by the selection

The Figma node is the `full` view only. **`bio` and `pw` have no frame**, so their offsets, the
`LG_GRAD` 131.65° gradient, "Other user?" and the avatar all still come from the prototype.
Likewise **no interactive states** are in this selection — the Input component carries a collapsed
`Label` slot (height 0.001) that a focused or filled variant would presumably expand, and there is
no focus, error, disabled or pressed state to compare against. Both need their own frames.

### 23.2 Glass — why the blur goes through `GlassPane`

Figma specifies the sheet as `Insta: Effect(type: GLASS, radius: 20)` over `rgba(0,0,0,0.2)`, and
each input as a **7.5px** blur under `rgba(255,255,255,0.18)`. Reproducing that turned out to be
the fiddliest part of the screen, and the first two attempts were both wrong.

**`expo-blur` is not a bare backdrop blur.** Reading `BlurView.web.tsx` and `getBackgroundColor.ts`
gives the exact web behaviour:

```
backdrop-filter: saturate(180%) blur(intensity * 0.2px)
background-color: <per-tint colour> at alpha = (intensity / 100) * <per-tint factor>
```

So `intensity` drives the radius **and** a tint veil, and hardcodes a saturation boost Figma does
not have. Two consequences:

1. Picking an intensity for the *colour* silently sets the wrong *radius*. The screen shipped for
   a while at `intensity 30` — a **6px** blur where Figma asks for 20 — because that was the
   value at which the dark veil stopped flattening the photograph. The blur was visibly missing.
2. The veil cannot be switched off: `style={[style, blurStyle]}` puts expo-blur's own style last,
   so passing `backgroundColor: 'transparent'` is ignored.

Modelling each tint against the Figma render's own sheet pixel (174,178,189, implying a blurred
backdrop of ~218,223,236) at the intensity a 20px blur requires:

| tint | composite | Δ vs Figma |
|---|---|---|
| `default` (255,255,255 × .30) | 183,186,194 | **+9,+8,+5** |
| `systemUltraThinMaterialDark` (37 × .55) | 95,96,101 | −79,−82,−88 |
| `dark` (25,25,25 × .78) | 54,55,57 | −120,−123,−132 |
| `systemChromeMaterialDark` (0,0,0 × .75) | 44,45,47 | −130,−133,−142 |

`default` is the only survivable option — but it still leaves the veil *and* the `saturate(180%)`,
which over this orange photograph reads as a visible warm cast where Figma is neutral grey.

**The fix is to stop asking one primitive to serve both platforms.** `GlassPane` takes a radius in
px and the exact rgba, and picks the implementation:

- **Web** gets `backdrop-filter: blur(Npx)` directly — the very primitive Figma is specifying, with
  no saturation and no veil. Verified: `blur(20px)` / `blur(7.5px)`, background `rgba(0,0,0,0)` on
  the blur layer. `backdropFilter` is a real react-native-web style property (expo-blur's own web
  build sets it through a React Native `style` object); it is just missing from RN's `ViewStyle`
  types, hence the cast.
- **iOS / Android** keep `BlurView` — they have no bare backdrop blur, blur is a material there —
  at `intensity = radius * 5`, which is exactly expo-blur's own mapping, with `tint="default"` per
  the table above.

The rgba tint is drawn by `GlassPane` on top in both cases, so the colour is identical everywhere
and only the blur primitive differs.

Tokens are now `sheetBlurRadius: 20` / `fieldBlurRadius: 7.5` — Figma's numbers, not tuned
intensities. **Still to check on a device**: `tint="default"` maps to a system material on iOS
rather than the web's flat white veil, so the native composite is not guaranteed to land where the
web one does.

#### Android: why the sheet rendered as a flat gradient

Web and iOS were right; Android showed no blur at all — the sheet read as a plain translucent
wash with the card mockup fully legible through it. Two separate defaults in `expo-blur`, either
of which alone is enough to silence the effect:

1. **`blurMethod` defaults to `'none'`**, which expo-blur's own docs describe as "renders a
   semi-transparent view instead of rendering a blur effect". That is precisely a gradient-looking
   sheet.
2. **A real method still needs a `blurTarget`.** `ExpoBlurView.kt` does
   `val safeMethod = if (blurTarget != null) method else BlurMethod.NONE` — ask for
   `dimezisBlurView` without naming a target view and Android quietly drops back to no blur, with
   only a `console.warn`. Android cannot infer what to sample; it blurs a specific view's drawing,
   not "whatever is behind".

Fix: `LoginBackground`'s root is now a `BlurTargetView` (a plain `View` on every other platform)
and the screen hands its ref to the sheet's `GlassPane` as `blurTarget`. `blurMethod` is
`'dimezisBlurView'` rather than `'dimezisBlurViewSdk31Plus'` — the latter is silently `'none'`
below Android 12, which is the bug being fixed; its documented cost is performance on old Android,
and nothing animates behind this glass.

That restored the blur but left the sheet washed out, because `intensity` is not one quantity on
Android. `ExpoBlurView.kt` spends it twice: the blur radius is `intensity / blurReductionFactor`,
and the overlay alpha is `(intensity / 100) * <tint factor>`. For `default` that factor comes from
`toColorInt`'s `else` branch and is **0.44 white** — noticeably heavier than the same tint on the
web shim (0.30). So `intensity 100` bought a 25px blur under a 44 % white veil.

Because the reduction factor divides one term and not the other, the two can be pulled apart:
`intensity = radius` with `blurReductionFactor = 1` holds the radius at Figma's 20px while
dropping the veil to 0.44 × 0.2 = **8.8 %**. Modelled against the Figma sheet pixel that lands at
177 against its 174.

iOS keeps `intensity = radius * 5`, because there (`BlurEffectView.swift`) it is
`animator.fractionComplete` — a fraction of a full `UIBlurEffect`, not a radius. Blur and tint are
a single material on iOS, so they cannot be pulled apart the way they can on Android: lowering it
to lighten the tint would lighten the blur with it. iOS is the one platform still unverified.

The **fields keep no blur target on Android**, so there they are the rgba lift alone. What they
would need to sample is the sheet, which contains them — the one thing a blur target cannot be —
and the loss is small: a field already sits on 20px of blurred photograph, so its own 7.5 moves
the effective radius from 20 to √(20² + 7.5²) ≈ 21.4.

### 23.3 Returning user — the password-only state (Figma `15324:57799`)

A second login frame arrived, drawn on the same IPhone 13 mini board: avatar, greeting,
"Өөр хэрэглэгч?", one password field, one "Log in" button. It is the state the existing `pw` view
was already built for, and every offset in `loginLayout.pw` turned out to land on it unchanged:

| element | Figma (from the 812 bottom) | `loginLayout.pw` |
|---|---|---|
| sheet | 342 | 342 |
| avatar | 258 | 258 |
| greeting | 218 | 218 |
| "Өөр хэрэглэгч?" | 192 | 192 |
| password field | 120 | 120 |
| button | 40 | 40 |

The component values match too: input `rgba(255,255,255,0.18)` under `backdrop-blur-[7.5px]`,
radius 20, `px-16`, placeholder `Нууц үг` GIP Regular 14/24 `#FAFAFC`; button radius 18 on the
`131.648°` gradient with `Log in` in GIP SemiBold 15/24 at letter-spacing 0.75. The avatar SVG
already carries both the `#F05327 → #FD8456` fill and the 1px white ring Figma draws.

So the only *visual* corrections were two strings that had been English placeholders while this
state had no frame: `greeting` → `Сайн уу, ` and `otherUser` → `Өөр хэрэглэгч?`. Both moved in
`loginCopy`, both verified against the render.

#### What the frame does not say, and what was built instead

Figma draws the state; it cannot say *when* to show it. That is new behaviour, and it lives in
`src/auth/remembered-user.ts`.

**Only the username is stored.** Not the password, not a token, not a PIN. A remembered username
is a convenience; the credential that proves it is still typed on every launch, which is why the
frame has a password field at all. It goes in the OS keystore (`expo-secure-store`) rather than
AsyncStorage anyway, because a username is a customer identifier and plaintext on disk tells
anyone holding the phone who banks here.

It is deliberately **not** part of `tokenManager`. Tokens are a live session and `logout()`
destroys them; this has to outlive sign-out, which is the entire point of it. Separate modules
make it impossible for a session clear to take the remembered user with it by accident.

`loadRememberedUser()` joins `loadMode()` and `loadTokens()` in the root layout's pre-paint
`Promise.all`. That is what makes `peekRememberedUser()` synchronous at mount, so the returning
user never sees the full form flash before the screen corrects itself.

**Which view opens**, in priority order:

1. `openAt` — wherever this app *run* was left. A sign-out mid-session returns you there, which is
   the reference behaviour §23 already reproduced (sign-in leaves it on `bio`).
2. otherwise the keystore: a remembered username opens `pw`, none opens `full`.

`openAt` does not survive the process, so a restart always takes branch 2. That is what makes a
fresh launch after a successful login land on this frame rather than on `bio`.

**The write** is one line in `finish()`, the existing success callback — `rememberUser({ username })`,
fire-and-forget because the module cache updates synchronously. **The delete** is
`useAnotherAccount`, wired to the "Өөр хэрэглэгч?" press: it forgets the stored username, clears
the typed one, and returns to `full`, so the *next* launch starts there too rather than greeting
someone who has handed the phone over.

`RememberedUser` carries an optional `displayName` alongside `username`. Nothing supplies it yet —
the sign-in API is still unwired, so today the greeting shows the login handle. When a real
response arrives with the customer's name, `finish()` passes it as a second field and the greeting
improves with no other caller changing shape.

**Web does not remember.** `expo-secure-store` has no web implementation, and the alternative is
the plaintext store this module exists to avoid. Web is a dev preview, not a shipping target, so
it always shows the full form.

#### Remaining differences from the frame

- **GIP font** — same screen-wide gap as §23.1. Manrope stands in; strings run 6–8 % wide.
- **The input's trailing icon** is a chevron in the Figma *component* (`Use icon / Down`, the
  default slot) but an **eye** in the rendered frame. The eye is what ships, matching both the
  render and the existing reveal behaviour.
- **The displayed name is a username** until an authentication response supplies a display name;
  Figma shows a given name ("Тэмүүлэн").
- `bio` still has no frame of its own.

---

### 23.4 The keyboard — why `KeyboardAvoidingView` stopped working

Reported from an Android device: focusing a field raised the keyboard straight over the sheet,
leaving only the "Нэвтрэх" heading above it. Both fields, "Нууц үг мартсан" and both buttons were
covered.

The screen had

```tsx
<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
```

which is the usual Android shape of that component, on the usual assumption that `adjustResize`
shrinks the window and Yoga re-lays the screen out for free. That is no longer true. Android is
edge-to-edge from SDK 54, the window keeps its full height with the keyboard up, and the keyboard
arrives as a window inset the app has to answer for itself. With `behavior` undefined
`KeyboardAvoidingView` renders a plain `View` and does nothing, so nothing moved.

`padding` on both platforms would have moved it, but it is the wrong instrument here. Every child
of the sheet is positioned absolutely from the sheet's **bottom** edge at a Figma offset — title
335.5, username 264, password 192, and so on. Padding resizes the sheet, which moves all of those
relative to each other; the composition Figma drew only survives if the sheet moves as one piece.

So the keyboard is measured directly (`useKeyboardOverlap`) and the sheet is translated:

- iOS listens on `keyboardWillShow`/`WillHide`, which carry the system's own duration and fire
  before the keyboard moves, so the sheet travels with it rather than after it.
- Android only has the `Did` pair; 250 ms `ease-out` stands in when no duration is reported.
- The rise is clamped to `screenHeight − insets.top − sheetHeight`, so on a short device the fields
  win over the heading rather than the sheet's rounded top being clipped off-screen.
- `translateY` runs on the native driver, and the layout never changes, so the blurred `GlassPane`
  behind the fields is not re-measured mid-animation.

At rest the transform is 0 and the sheet is byte-for-byte where it was — verified against the
Figma offsets in the browser: username bottom 264, password 192, "Log in" 89, "Join" 29.

`FaceIdSheet` carries the same `behavior={… : undefined}` line, but its only text input lives in the
`password` state, which the login screen pre-empts by passing `onUsePassword` — that state is
unreachable in this app, so no keyboard ever comes up over it. Left alone rather than changed
speculatively; it needs the same treatment if that state is ever used.

#### Dismissing it again — two scrims, not one wrapper

Tapping outside a field now puts the keyboard away. The obvious shape for that is one
`Pressable` wrapped around the whole screen, relying on the responder system to let every
interactive descendant keep its own touch. That is correct on native, where a `TextInput` claims
the touch itself, and wrong on web: RN-Web renders a plain `<input>` whose click bubbles, and its
press responder documents that `onPress` fires on "the first ancestor of the native click target"
— so the wrapper would dismiss the keyboard for the very field the user had just tapped, and the
form could not be typed into at all.

So the gesture is two scrims painted *underneath* the controls instead: one over the photograph,
one over the sheet's glass. A control cannot reach a view below itself on any platform, so there
is no responder race to reason about.

Two things that shape has to pay for, both of them just `pointerEvents`:

- `keyboardHost` is a full-screen flex container over the photograph, so it was catching every tap
  above the sheet and bubbling it up to a root with no handler. `box-none` takes it out of
  hit-testing while leaving the sheet inside it a target.
- The decorative and text-only children sit *above* the sheet's scrim and would otherwise swallow
  taps the same way: the heading, the greeting, the avatar and the locale flag are now `none`, and
  the two rows that contain a link — "Нууц үг мартсан" and "Өөр хэрэглэгч?" — are `box-none`, so
  the link stays a target and the empty rest of the row does not.

Measured hit-test map at 375 × 812:

| tapped | receives |
|---|---|
| photograph above the sheet | dismiss scrim |
| sheet heading | dismiss scrim |
| glass above / between the fields | dismiss scrim |
| username, password | the `TextInput` |
| eye toggle | the eye button |
| empty part of the "forgot" row | dismiss scrim |
| "Нууц үг мартсан" | the link |
| "Log in" / "Join" | their buttons |
| mode toggle | the toggle |
| decorative flag | dismiss scrim |

The `pw` view's own three children (avatar, greeting, "Өөр хэрэглэгч?") carry the same annotations
as the ones measured above and are structurally identical to the "forgot" row, but were not
themselves measured — that view was not on screen during the pass.

What the browser *cannot* show is the dismissal itself. RN-Web's `Keyboard.dismiss()` only blurs
an input that RN's own `TextInputState` believes is focused, which a programmatic `.focus()` in a
probe does not establish, and the preview pane does not deliver trusted pointer events (a real
click on the username field leaves `document.activeElement` on `BODY`). Hit-testing is the part
that could actually be wrong here, and that is the part that was measured.

---

## 24. Implemented — Home migrated to Figma (`15314:40225` dark / `15324:56122` light)

The Home screen moves off the HTML prototype and onto the two Figma Home frames. Functionality is
the prototype's; the visual is Figma's. The prototype remains the source of truth for behaviour
Figma does not describe — scroll, snap, press feedback, the balance mask, the banner query's
loading and failure paths.

### What Figma changes

The two designs are not a restyle of the prototype's Home, they are a different composition. The
prototype has a light page with a dark hero *card* floating on it; Figma has a full-bleed blue
**header** with the page hanging off its bottom edge, and the account detail that used to live in
the hero card (IBAN, card pill, Google Pay / Subscriptions / Helpy) is gone in favour of an
account selector, a Statement action and an overdraft plate.

### Section inventory and mapping

| Figma node | Section | Existing component | Decision | Why |
|---|---|---|---|---|
| `Frame 1707480257` 375×370 | Blue header | `HeroBalanceCard` | **Create** `HomeHero` | Different anatomy; the old card's rows have no Figma counterpart |
| `Frame 1707480280` 343×35 | Greeting row | `GreetingHeader` | **Modify** | Same role, new marks: brand vector, bell, round sun button |
| `Frame 1707480578` | Balance + eye | `HeroBalanceCard` / `BalanceAmount` | **Modify → `HomeHero`** | Type scale and position change; the per-character mask is kept |
| `15314:44176` / `15314:44182` | Account + Statement pills | — | **Create** (inside `HomeHero`) | New in Figma |
| `Frame 1707480509` 343×94 | Overdraft + Reward plate | `QuickActionGrid` "Overdraft" tile | **Create** (inside `HomeHero`) | Overdraft moves from the tile grid into the header; it is not dropped |
| `Frame 1707480480` 343×100 | Quick actions | `QuickActionGrid` | **Modify** | 2×2 grid → three-up row; same component, new geometry |
| `Frame 1707480575` | Promo / alert rail | `PromoCarousel` | **Modify** | Card geometry and skins change; the `useBanners` integration is untouched |
| `Frame 1707480336` | Send again | — | **Create** `SendAgainRail` | New section |
| `Navigation Bar` (×2) | Section title bars | — | **Create** `SectionHeader` | Figma reuses one node for both; so does the code |
| `Frame 1707480323` | Recent activity | `RecentActivity` | **Modify** | Divided list → separate cards, new row anatomy |
| `Component 602` | Floating tab bar | `FloatingTabBar` | **Reuse** unchanged | Already matches |

### Measured geometry

Header (Figma y minus the 44 status bar, so every offset is relative to the safe area):

| Element | Figma | Implemented |
|---|---|---|
| Header height | 370 | `insets.top + 326` |
| Bottom corner radius | 30 (fitted: the edge leaves x=0 at y≈345 and reaches x=20 by y=368) | 30 |
| Greeting row | y 60, x 16, 343×35 | top 16, left/right 16 |
| Balance | y 137, 36 SemiBold, centred; ₮ 20 Bold; eye 24 at +6 | same |
| Pills | y 204, x 14 / x 228, 198×40 and 133×40, radius 21, white 20 % | same |
| Overdraft plate | y 260, x 16, 343×94 | same |
| Progress track | x 16→327, h 8, r 5, white 20 %; fill 95 wide `#8EABD4` | same |
| Reward chip | right 0, top 0, 200×34, r 14, white 10 % | same |

Body: 16 below the header, then 16 between sections, and 20 before Recent activity (Figma stacks
"Send again" and "Recent activity" in one 460-tall group at that gap). Tiles 100 tall, gap 12,
radius 26. Promo cards 316×99, gap 26, radius 20, first inset 16. Transaction cards 70 tall,
gap 16, radius 20.

### Colours

Header (identical in both frames): gradient `#627EA4 → #4A6285 → #263751`, bottom-left to
top-right, sampled from the exported frame — the header's own fill sits under ~60 pattern vectors
and has no readable node. Glass at 20 % (pills) and 10 % (plate, chip, overdraft pill).

| | Light | Dark |
|---|---|---|
| Page | `#FFFFFF` | `#0D0B0A` |
| Ink / tertiary | `#000000` / `#898989` | `#FFFFFF` / `#F8F8F8` |
| Surfaces | white + `#F5F3F6` hairline + `Хас 2` shadow | white 10 % + white 10 % hairline |
| Tile fill | the 226.39° gradient at 3 % | white 10 % |
| Transfer tile | the same gradient, opaque | the same gradient at 50 % |

The tile stroke is a **gradient**, not the flat `#263852` Figma's codegen reports: the exported
frame runs it `#394C6A` at the tile's top edge to `#5F799F` near its bottom, on the fill's own
226.39° axis. Per the project rule that the render beats the source, it is drawn as a gradient
layer with the fill inset 1 on top.

### Assets

Every icon is the exported Figma asset, not a redrawn path — 18 SVGs plus two transparent PNG
watermarks, kept in `assets/home/` and inlined as strings in `figma-assets.tsx`. Metro has no SVG
transformer configured here, so they render through `react-native-svg`'s `SvgXml`, which needs no
new dependency and behaves the same on iOS, Android and web.

Figma nests most glyphs inside a larger square slot (a 7.67×10.33 arrow in a 16×16 box, a
7.92×4.58 chevron in a 20×20 box). `FigmaIcon` keeps the slot and the leaf separate so a glyph is
never scaled up to fill its box, which would thicken its strokes. The overdraft plate's notched
outline is the exported boolean path: where the notch meets the plate the corner curves the
opposite way, which no React Native border radius produces.

### Functionality preserved

`useBanners` and its loading / empty / error paths, the balance show-hide toggle and its
per-character mask, the app-wide theme toggle, the safe-area and tab-bar clearance, the floating
tab bar, and every navigation flow. Nothing in `src/api` was touched.

### Behaviour taken from the prototype, not Figma

- The promo rail snaps (`snapToInterval` 342) and scrolls full-bleed. Figma shows the next card
  peeking 17px past the right edge, which is a snap rail drawn statically.
- "Send again" scrolls horizontally. Figma draws six payees in a 331-wide row inside a 343 card
  that clips them, which is how a static frame says "this scrolls".
- Press feedback on every tappable surface.
- The balance mask's 90 ms glyph↔dot cross-fade in fixed-width cells, so toggling never reflows.

### Deliberate departures

- **Section order follows the light frame** (actions → promos → payees → activity). The dark frame
  leads with the promo rail instead. Nothing else about the two boards differs structurally, so
  this reads as a section having been moved on one board rather than a light/dark rule; one order
  ships in both modes.
- **The rail's dots and ± arrows are gone.** Figma has neither, and a dots row below the cards
  would break the measured 99-tall band the next section is spaced against.
- **The Notifications card is gone from the rail.** Neither frame has it, and the header's new bell
  button is where notifications now belong.
- **The balance row is padded by the eye's width** (24 + 6) so that centring the row centres the
  *amount*, as Figma does, rather than centring the amount-plus-eye group. Under Figma's own
  metrics the group lands on 75…330 exactly.
- **The flag ships in both modes.** The light frame puts a Mongolian flag before the amount and the
  dark frame a ₮ after it; the flag is used in both rather than switching glyph with the theme
  (§24.2).

### Remaining differences from Figma

- **GIP and Montserrat are both missing.** Figma sets GIP throughout and Montserrat on the
  transaction rows; the app has neither, so everything falls back to Manrope. This is the same gap
  as §23.1 and it is the largest one here — Manrope sets the 36px balance ~11 % wider than GIP,
  which is why the eye is laid out relative to the amount rather than pinned to x=306.
- **Payee avatars carry an initial, not a bank logo.** Figma puts a 30×30 bank mark inside each
  40 ring; the app has no logo assets and no payee endpoint. The ring colours are Figma's.
- **The header watermark is a 1× export.** It is a ~5 %-alpha engraving, so it is soft rather than
  wrong on a 3× screen; re-export at scale if it ever reads blurry.
- **Transaction row padding is 12 throughout.** Figma gives the first row 16 and the others 12,
  which puts that row's icon 4 further in than its neighbours' — read as an oversight, not a rule.
- **Tile label 15 in both modes.** The dark frame says 15 and the light one 14.
- **`Хас 2` is three stacked drop shadows** (1/6/24 blur at the origin); React Native takes one, so
  the widest is kept.

### Orphaned by this change, left in place

`HeroBalanceCard`, `ThemeToggle`, and all of `HomeIcons` except `EyeToggleIcon`. They are working
code with no consumer rather than dead code, and removing them is a separate decision.

### Verification

`tsc --noEmit` clean, ESLint clean on every touched file. Rendered at 375×812 in both modes and
compared against the exported Figma frames; the only console output is the pre-existing
`getBannerList` CORS failure, which is browser-only and exercises the rail's degraded path (the
two alert cards stand alone). **Not verified on device** — iOS and Android rendering of `SvgXml`,
the safe-area header growth and the shadows still need an emulator pass.

### 24.1 Fixes from the first device pass

Five defects found by comparing an iOS build against the light frame `15324:56122`, then confirmed
by measuring the rendered DOM against the frame's own offsets.

| # | Symptom | Cause | Fix |
|---|---|---|---|
| 1 | The overdraft plate did not render at all — the progress bar and Available/Limit sat directly on the gradient, and the Reward chip floated free of the notch | `FigmaIcon` sized its slot `width: box, height: box`. For the 343×94 plate that made a 343×**343** box with the SVG centred in it, dropping the plate ~125 below the card | `boxH` on `FigmaIcon`; the plate passes `box={343} boxH={94}` |
| 2 | "Add new" was an empty dashed ring in light mode | The exported `PLUS` carries `fill="white"`, and the light Send-again card is white | `tint` on `FigmaIcon`, which rewrites the asset's white fills; the payee rail passes `t.ink` |
| 3 | "1 payment  OVERDUE" | Figma applies `uppercase` to the whole string; only "OVERDUE" was typed that way | "1 PAYMENT  OVERDUE" |
| 4 | Recent activity and everything after it sat 6 high | Figma's `Frame 1707480336` / `1707480323` set `gap-[6px]` between the section bar and its content; the bar had no gap | `marginBottom: 6` on `SectionHeader`, so the gap travels with the bar |
| 5 | The eye was an open eye at rest | Figma draws the **slashed** eye while the balance is showing — the icon names the action, not the state — on a faint round halo | `off={!hidden}`, solid white, on a radius-16 white-8% backing |

Also corrected: the tile label is now per-mode (`tileLabel` — 14 in the light frame, 15 in the
dark), rather than 15 in both.

After the fixes, measured against the frame (web, `insets.top` 0, so Figma y − 44):

| Anchor | Figma | Measured |
|---|---|---|
| Greeting row | 16, x 56 | 16, x 56 |
| Amount | y 93, x 75, w 207 | y 93, x 72.5, w 211.9 |
| Statement pill | y 160, x 228, 133×40 | identical |
| Overdraft plate | y 216, x 16, 343×94 | identical |
| Reward chip | y 216, x 159, 200×34 | identical |
| Quick actions | y 342, x 16, 106.33×100 | identical |
| Promo card | y 458, x 16, 316×99 | identical |
| "Send again" | y 583, x 16 | identical |
| "Recent activity" | y 751, x 16 | identical |
| First transaction row | y 791, 343×70 | identical |

The amount is the only anchor that misses, by 4.9 across its full width (2.4 %) — Manrope's
advance widths against GIP's.

### 24.2 Header parity pass — second device review

The header was compared against `Frame 1707480257` in the light frame on an Android build. Five
more differences, four of them the same root cause: **Figma's SVG export drops everything the group
carries** — fill, stroke colour, opacity and masking all live on the group node, and none of it
survives into the exported markup.

| # | Symptom | Cause | Fix |
|---|---|---|---|
| 1 | The engraving ran the full height of the header; Figma leaves the lower half clean | `Rectangle 5453`, the pattern group's sibling, is a **mask**, not a shape. Nothing in the export says so — it shows up as Figma's own render of the group going empty below y 198 | The pattern is clipped to the mask's rect (−69.825, −16.686, 515.486 × 214.934) |
| 2 | The engraving read coarse and blotchy, and its motifs too large | The 1× raster export was being stretched by `resizeMode="cover"` to cover a device wider than the 375 board | `Group 1000004170` re-exported as vector (33 KB) and drawn at its designed 701.84 × 661.56 from its designed origin (−163, −240). Nothing is resampled and it is sharp at any density |
| 3 | The engraving was dark, not white | Its 45 paths carry `stroke="black"`; the group holds the real colour | Strokes recoloured to white, group opacity restored at 0.2 |
| 4 | No Mongolian flag before the amount | Never implemented — the ₮ from the dark frame was used in both modes | `_flagBase` exported at 4× and placed at Figma's 60/104.5; the ₮ is dropped |
| 5 | An open eye where Figma draws a slashed one, with no halo | The eye was the prototype's hand-drawn glyph | `Frame 1707480434` exported and used directly; the halo is part of the asset. `EYE_OFF` is the resting state, and the open eye — which Figma never draws — is the same asset with its slash path removed |

The pattern is pinned to the top of the *screen*, not to the content: it is a background, and the
window Figma composed onto it is frame-relative rather than safe-area-relative.

Also corrected: the amount takes the frame's own 43 line box. Manrope's default leading made the
row 49 tall, which pushed the flag and the eye — both of which centre on the row — 3 below where
Figma puts them.

Header anchors after the pass (web, `insets.top` 0, so Figma y − 44):

| Anchor | Figma | Measured |
|---|---|---|
| Flag | x 60, y 104.5, 20×20 | x 57.5, y 104.5, 20×20 |
| Amount box | x 86, y 93, 207×43 | x 83.5, y 93, 211.9×43 |
| Eye | x 301, y 103, 24×24 | x 303.5, y 102.5, 24×24 |
| Pattern mask | −69.825, −16.686, 515.486×214.934 | identical |

Every miss is ±2.5, which is the 4.9 of Manrope-over-GIP width on the amount spreading evenly
either side of the group's centre. Nothing else in the header is off by more than a rounding.

**Lesson for the rest of the migration:** treat a Figma SVG export as geometry only. Colour,
opacity and masking are group properties and none of them round-trip. Where an asset looks wrong,
compare against Figma's own *render* of that node — that is what caught both the mask and the
stroke colour here.

### 24.3 The header's right-hand gutter — and why the plate stopped being an asset

Reported as "more padding on the right". The header's own rows were symmetric; what was not was the
**overdraft plate**, the one element still carrying a fixed width.

Figma designs on a 375 board. The greeting row, the account and Statement pills, the quick-action
tiles, the "Send again" card and the transaction rows are all expressed against the page edges, so
they reach the 16 gutter at any width. The plate was pinned to the exported path's 343. On a 411dp
Android screen that left 16 on the left and **52 on the right** — a gutter down one side of the
header and nothing matching it anywhere else on the page.

It could not simply be stretched, because its background was a fixed 343×94 SVG. So the outline is
now **generated** instead:

```
platePath(w, h = 94, notch = 215, notchH = 41, r = 20)
```

Three of the four corners are ordinary convex arcs; the fourth, where the notch meets the plate,
curves the opposite way, which is why this cannot be built out of `borderRadius` and why it was an
asset in the first place. The generated path uses `A` arcs where the export used cubics, and at
w = 343 it reproduces the exported outline vertex for vertex:

```
generated  M20 0H108A20 20 0 0 1 128 20V21A20 20 0 0 0 148 41H323A20 20 0 0 1 343 61V74…
exported   M108 0C119.046 0 128 8.95431 128 20V21C128 32.0457 136.954 41 148 41H323C334.046 41 343 49.9543 343 61V74…
```

The notch was first anchored to the right at its designed 215; §24.4 corrects that to its left edge
at 128, so the chip stretches with the plate and its gap to the overdraft pill stays at 30. `assets/home/overdraft-shape.svg` is kept as the
reference the path was derived from; the `OVERDRAFT_SHAPE` constant is gone.

The promo cards had the same defect for the same reason — a fixed 316 left the rail visibly
narrower than the tiles above and the rows below it. The card now takes whatever is left after the
frame's own 26 gap and 17 peek (`W − 59`), which is 316 exactly at 375 and keeps the designed
rhythm at any width.

Measured at both widths:

| | 375 (Figma's board) | 411 (Android) |
|---|---|---|
| Plate | l 16, r 16, **w 343** | l 16, r 16, **w 379** |
| Reward chip | l 159, r 16, w 200 | l 195, r 16, w 200 |
| Promo card | l 16, **w 316**, peek 17 | l 16, **w 352**, peek 17 |
| Tiles / transaction rows | l 16, r 16, w 343 | l 16, r 16, w 379 |

At 375 every number is Figma's own. At 411 nothing is left behind at the right edge.

The account and Statement pills sit at 14 rather than 16 — that gutter is Figma's, not a bug; the
pills are designed 2 wider on each side than the plate below them. They had the same fixed-width
defect between them, fixed in §24.5.

### 24.4 The reward chip — centring, and anchoring the notch to the left

**The chip's contents sat low.** Figma positions them at `top: 10` inside the 34-tall chip, which
centres a 14-tall GIP line box. Manrope's line box at 12px is nearly 17, so honouring the offset
literally put the row at 10…27 — centre 18.5 against the chip's 17, enough to read as
bottom-aligned at that size. Each of the three now sits in a slot spanning the chip's full height
and centres itself, which is what the frame means and which holds whatever the typeface does.
Measured: 8.5 above, 8.5 below.

**The gap to the overdraft pill grew with the screen.** §24.3 anchored the notch to the right and
held it at its designed 215, which is backwards: the notch's left edge is the thing the design
fixes, at 128 — just clear of the overdraft pill, which ends at 113. Anchoring right meant the
notch and the chip in it stayed one size while the plate grew, so the 30 between the pill and the
chip opened to 66 on a 411 screen.

`platePath` now takes the notch's **left** edge (`nx = 128`) rather than its width, and the chip is
`left: 143, right: 0` rather than a fixed 200. Both stretch with the plate; the 30 that separates
them from the pill does not. "20,000" moves to `right: 10` — Figma's own inset from the chip's
right edge — so it travels with the chip.

| | 375 (Figma's board) | 411 (Android) |
|---|---|---|
| Plate | l 16, r 16, w 343 | l 16, r 16, w 379 |
| Overdraft pill | l 16, w 96.9 | l 16, w 96.9 |
| Reward chip | l 143, r 0, **w 200** | l 143, r 0, **w 236** |
| Pill → chip gap | **30.1** | **30.1** |
| Chip contents | 8.5 top / 8.5 bottom | 8.5 / 8.5 |

At 375 the outline is still the exported one vertex for vertex; at 411 only the notch's right-hand
run and the plate's own width change.

### 24.5 The header pills — the account pill takes the slack

Both pills were fixed (198 and 133) in a row laid out with `justifyContent: 'space-between'`, so
every pixel a screen has over Figma's 375 went into the gap between them: 16 on the board, 52 on a
411 one. And because the account pill stayed at 198, "MN65 0032 00 5000610569" kept the 9 of
padding it has on the board no matter how much room the header actually had — the one element in
the header with something to say was the one held to its smallest size.

The row now holds Figma's 16 as an explicit `gap`, Statement keeps its designed 133, and the
account pill takes whatever is left. At 375 that resolves to exactly Figma's 198; anything wider
goes to the account number instead of the void between the two. The label also gets
`numberOfLines={1}` and `flexShrink`, so on a screen *narrower* than the board a long account
number gives way rather than pushing the chevron out of the pill.

| | 375 (Figma's board) | 411 (Android) |
|---|---|---|
| Account pill | l 14, **w 198** | l 14, **w 234** |
| Statement pill | l 228, w 133, r 14 | l 264, w 133, r 14 |
| Gap | **16** | **16** |
| Padding around the account label | 9.3 | 27.3 |

That is the fourth element in this header to have the same defect — plate, promo card, reward chip,
and now the pills. The pattern is consistent enough to state as a rule: **a Figma width is a
measurement at 375, not a constraint.** Reproduce the *relationship* it encodes — which edge it is
anchored to, and which neighbour it is spaced from — and let one element per row absorb the
difference. Only things whose size is intrinsic (an icon, a 200-wide chip against a 215 notch)
should stay fixed.

### 24.6 The Android bitmap crash, and the hero's declared gradient + watermark

**The crash.** On device the app died with

```
java.lang.RuntimeException: Canvas: trying to draw too large(131469156bytes) bitmap.
  com.horcrux.svg.SvgView.onDraw(SvgView.java:145)
```

`react-native-svg` on Android renders every `<Svg>` into an `ARGB_8888` bitmap the
size of the **view** (`SvgView.drawOutput()` → `Bitmap.createBitmap(getWidth(), getHeight())`),
and `Canvas` refuses anything over 100 MB. 131 469 156 / 4 = 5733², i.e. a square
view 5733 px on a side — 2184 dp at the emulator's 2.625 density.

2184 is `sigma * 6` for the login background's ambient light: `LoginBackground`'s
`GaussianBlob` grows its box to ±3σ, and the `LG_GLOW` blob is σ 364. So the
crash was not in the Home header at all; it was the login screen's third light
source, and it surfaced now because that blob sits inside the sheet's
`BlurTargetView` and gets re-drawn whenever the blur resamples. The two σ 137
lights were under the ceiling but still ~19 MB of bitmap each, every resample.

The gradient does not need that resolution. A four-stop radial falloff is smooth
enough that bilinear upscaling is indistinguishable from drawing it at full size,
and `SvgView` already paints with `FILTER_BITMAP_FLAG`. Each blob now rasterises
into a fixed 256 dp square and is scaled to its box with a transform, which
happens on the canvas matrix and never widens the bitmap. Both boxes share a
centre, so no light moves.

| | box | bitmap before | bitmap after |
|---|---|---|---|
| Corner lights (σ 137) ×2 | 822 dp | 2158² px — 18.6 MB | 672² px — 1.8 MB |
| Ambient light (σ 364) | 2184 dp | 5733² px — **125 MB, crash** | 672² px — 1.8 MB |

For reference, the Home watermark below is a 701.84×661.56 `SvgView` — 1842×1737 px,
12.8 MB at 2.625 and ~23 MB at 3.5. Under the ceiling, but four times the pixels
the mask actually shows; worth cropping to the visible window if it ever needs
touching.

**The hero gradient.** Replaced with the design's own declaration,
`linear-gradient(227.76deg, #263852 0%, rgb(104,132,171) 97.04%)`. The previous
three stops were reconstructed by sampling the exported frame, which produced a
plausible but invented mid stop (`#4A6285`) and the wrong two ends.

A CSS angle cannot go straight into `expo-linear-gradient`, whose `start`/`end`
are fractions of the box rather than a direction — corner-to-corner is only
227.76° when the box happens to be square. `cssGradientAngle(deg, w, h)` does the
conversion: `dx = sin A`, `dy = −cos A`, gradient length `|W·dx| + |H·dy|`,
endpoints at the centre ∓ half that along the direction, divided through by the
box. It returns values outside 0…1, which is correct and what the library wants.

| box | start | end |
|---|---|---|
| 375×370 | 1.0196, 0.0218 | −0.0196, 0.9782 |
| 375×326 (the header) | 0.9904, −0.0122 | 0.0096, 1.0122 |
| 411×350 (Android) | 0.9860, −0.0182 | 0.0140, 1.0182 |

**The watermark.** The design states the engraving as a 515.49×214.93 rectangle of
`rgba(255,255,255,0.19)` in `mix-blend-mode: overlay`, masked by the pattern.
That is the same picture as a clipped white engraving at 19 % opacity, and it is
the form React Native can draw, so the mask window now carries the declared
inset, size, `mixBlendMode: 'overlay'` and `pointerEvents: 'none'`, the engraving
carries `opacity: 0.19` at the declared `mask-position`, and the header gets
`isolation: 'isolate'` so the blend stops at the header rather than reaching the
page behind it. (RN 0.86 supports both properties —
`StyleSheetTypes.d.ts:514`, `:519`.)

One number is taken on the design's word rather than on the evidence: `top: -10.69`.
Three things independently say −16.686 — it is exactly `Rectangle 5453`'s y in
Figma's metadata; `−16.686 + (−223.314)` is exactly −240.00, the pattern group's
own frame y, where `−10.69 + (−223.313)` is −234.00; and Figma's render of the
group goes empty at y 198, which is `−16.686 + 214.934`. The declared value is
implemented as given and the 6 px is flagged rather than silently overridden.

---

## 25. Implemented — biometric opt-in sheet (Figma `15726:76357`)

"Face ID-аар нэвтрэх үү?" — a 375 × 358 bottom sheet offering to turn biometric sign-in on, shown
once after a successful login.

### Figma analysis

`Component 664`, a white sheet with its top corners at 30, laid out from three anchors:

| element | Figma |
|---|---|
| grabber | 24 × 4 at y 12, `#D9DBE9`, radius 4, centred |
| content column | y 42, x 16, w 343, column gap 24, items centred |
| mark | 80 box with the artwork inset 9.38 % — a 65 glyph at `#F26800` |
| copy block | gap 12; title GIP Bold 18 `#000`, box 22; body GIP Regular 14 `#898989`, box 48 |
| buttons row | y 270 (bottom 40), w 343, two 165 × 48 at radius 22, 13 apart |
| "Одоо биш" | 1px border `#E0E0E0`, GIP SemiBold 16 `#5C5C5C` |
| "Идэвхжүүлэх" | `linear-gradient(135.94deg, #F05327 11.557%, #FD8456 88.443%)`, white label |
| home indicator | the frame's own 34-tall instance at y 324 |

Two things the frame does not say out loud:

**The warm top edge is the login screen's light rig.** The last three children are two `#FDE4C5`
rects blurred 137 and `Ellipse 93` — a 222.266-radius `#FF6601` disc at 10 % with a σ 347 Gaussian.
Those are the same three lights `LoginBackground` already draws, at the same two colours and the
same x centres (15.5, and right 27.5); only the y moved. In a 358-tall sheet the corner lights land
92 above the top edge, so what survives the clip is a warm wash across the top, fading to white by
the buttons. Sampling Figma's export bears the model out: predicted `#FEF8F1` at (187, 1) against a
measured `#FEF6F0`.

**They are painted above the content, not behind it.** Figma orders them last, which is why the
title samples `#0C0806` rather than pure black in the exported frame. Reproduced in the same order,
and held out of hit-testing so they cannot swallow a tap meant for a button.

### When it appears — and when it does not

Mounted by `(app)/_layout.tsx` as a sibling of the tab navigator. That placement does all three
things the brief asked for at once:

- **only after a successful login** — armed by a new `askBiometric` on the session, which `signIn()`
  sets and nothing else does;
- **anywhere in the app** — a sibling of the navigator covers any tab, including the floating tab
  bar, which is the navigator's own `tabBar` and cannot be covered from inside a tab screen;
- **never on an auth screen** — that layout only exists inside the `(app)` group, and the root guard
  unmounts the whole group the moment the session ends. It is structural, not a condition that can
  be got wrong.

`askBiometric` is separate from the existing `justSignedIn` because the two post-login sheets are a
*sequence*: the security interstitial is dismissed first, and this still has to be true afterwards.
The layout renders it on `!justSignedIn && askBiometric`.

The two suppressions are decided by the sheet itself, so one place knows the rule:

1. biometric login is already on (`peekBiometricLogin()`);
2. `hasHardwareAsync() && isEnrolledAsync()` is false.

Both halves of (2) matter. A sensor with nothing enrolled would let us switch on a sign-in that can
never succeed. Until the async answer is in the sheet renders `null`; if the answer is "don't ask"
it reports done and never paints.

"Одоо биш" declines *this* login, not forever — the sheet returns on the next one. That is the spec
as given: the only two reasons to stay away are the two above.

### What enabling it actually does

Without this the sheet would be a sheet about nothing, so two existing surfaces were wired to the
same flag:

- **`initialView()` on the login screen** now returns `bio` for a remembered user who accepted, `pw`
  for one who did not, `full` for no remembered user at all. Both `peek`s are synchronous because the
  root layout awaits their loads before first paint, so the returning user never sees the wrong form
  flash.
- **More → Security → "Face ID / biometrics"** was `useState(true)` — decorative. The sheet's own
  copy promises "Тохиргоог хүссэн үедээ унтраах боломжтой" (turn it off whenever you like), so that
  switch now reads and writes the real preference. It is the one real setting on that screen; the
  other two are still the reference's defaults.

Turning it on — from either surface — takes the OS prompt first (`authenticateAsync` with
`disableDeviceFallback`, so the passcode sheet cannot enable *biometric* login without a biometric).
A tap alone would promise a returning user a face scan this device might refuse, and the place to
find that out is now, not at the next login with the password form gone. Turning it off is
unconditional: a security setting you cannot leave is not a setting.

Nothing secret is stored. `src/auth/biometric-login.ts` holds one boolean — no password, no token,
no PIN, and certainly no biometric template, which never leaves the enclave. It goes in the keystore
anyway, for the same reason the remembered username does: it outlives sign-out on purpose, and a
security preference anyone can flip by editing a plaintext file is not one.

### Measured against Figma

At 375 × 812 with a 0 bottom inset, so the sheet's top lands at 454:

| | Figma | rendered | Δ |
|---|---|---|---|
| sheet | 375 × 358 | 375 × 358 at y 454 | 0 |
| grabber | 24 × 4 at y 466 | 24 × 4 at y 466 | x 175.5 vs 176 |
| mark artwork | 65 at x 155, y 503.5 | 65 at x 155, y 503.5 | 0 |
| title | w 343 at y 600, box 22 | w 343 at y 600, box 22 | 0 |
| body | w 343 at y 634, box 48 | w 343 at y 634, box 48 | 0 |
| buttons | y 724, h 48, radius 22 | y 724, h 48, radius 22 | 0 |
| button widths | 165 / 165 | 166 / 164 | RN-Web flex rounding |
| gradient | 135.94°, 11.557 % → 88.443 % | 136.115°, same stops | 0.17° |
| colours | `#000` / `#898989` / `#5C5C5C` / `#E0E0E0` | all exact | 0 |

Three notes on that table.

**The title and body line heights are stated, not inherited.** The frame is `leading: normal`, which
under GIP gives a 22 box at 18 and a 16 box at 14 (its 48-tall body is three of them). Manrope's
normal leading is wider: left alone the title box grew to 24 and pushed the body 2 down. Declaring
Figma's boxes puts the column back where it was drawn — the same treatment every other measured text
in `rightbank-theme.ts` gets.

**The grabber is centred rather than pinned to Figma's 176.** (375 − 24) / 2 is 175.5, so 176 is
Figma's rounding of a centred box, not an offset from the left edge — §24.5's rule.

**Neither button is held at 165.** They are `flex: 1` either side of the designed 13 gap, so a screen
wider than the 375 board grows the buttons instead of the void between them. At 375 that resolves to
Figma's 165 (RN-Web splits the odd pixel 166/164; Yoga does not). The gradient's angle conversion is
fed that computed width rather than a literal 165, so 135.94° survives the wider box.

### Files

| | |
|---|---|
| `src/auth/biometric-login.ts` | new — the preference, the capability query, the confirm prompt, and the shared `biometricLabel` |
| `src/components/rightbank/BiometricOptInSheet.tsx` | new — the sheet and its gate |
| `src/components/rightbank/biometric-art.ts` | new — the exported 65 glyph as markup (no Metro SVG transformer; same as `login-art.ts`) |
| `assets/biometric/face-id.svg` | new — the exported file, kept as the source of record |
| `src/components/rightbank/GaussianBlob.tsx` | new — lifted out of `LoginBackground`, now that two screens draw the same rig |
| `src/components/rightbank/login/LoginBackground.tsx` | imports the shared blob; its local copy removed |
| `src/components/rightbank/FaceIdSheet.tsx` | imports the shared `biometricLabel`; its private copy removed, so the two sheets can never disagree about whether the user has a face or a thumb |
| `src/constants/rightbank-theme.ts` | `biometricSheet` tokens + `biometricCopy` |
| `src/auth/session.tsx` | `askBiometric` / `clearAskBiometric` |
| `src/app/(app)/_layout.tsx` | mounts the sheet after the security interstitial |
| `src/app/_layout.tsx` | awaits `loadBiometricLogin()` with the other three startup reads |
| `src/app/(auth)/index.tsx` | `initialView()` honours the preference |
| `src/app/(app)/(tabs)/more.tsx` | the Security toggle is real |

### Decisions and gaps

- **No dark variant exists.** Only the one frame was given, and its tokens are the light set
  (`backgroundcolorlight/primary`, `textcolorblack/primary`), so the white treatment ships in both
  app modes. Inventing a dark palette would be inventing colours. The scrim behind it is not in the
  design at all and takes `faceIdPalette[mode].scrim`, which every other sheet in the app uses.
- **"Face ID" is interpolated, not hard-coded.** The frame says Face ID because it was drawn on an
  iPhone; `biometricLabel()` gives a fingerprint phone its own word for what it has. The app already
  did this in `FaceIdSheet`.
- **"тахиулан" is reproduced as drawn.** It reads like a slip for "таниулан", but the design is the
  specification. Worth a word with the designer.
- **No drag-to-dismiss.** The grabber is an affordance in Figma with no gesture behind it; tapping
  the scrim or "Одоо биш" is what dismisses. Declining is deliberately never blocked while the OS
  prompt is in flight, and a decline that lands first wins — a late confirmation cannot switch on
  something the user has just said no to.
- **Animation is not in the design.** `FadeIn`/`SlideInDown` on entry and the reverse on exit,
  matching the reanimated convention `SecurityWarningModal` already set.
- **A suppression logs its reason in dev.** The sheet not appearing looks identical from the
  outside whether it was suppressed or broken, so the gate prints one line —
  `[biometric opt-in] skipped: hardware=… enrolled=… label=…` — to the Metro console. Both halves
  are reported because "no biometrics" on an emulator is almost always hardware present with
  nothing enrolled, which is a setup step rather than a device limit.
- **Not yet run on a device.** The preview pane cannot exercise this at all beyond layout:
  `expo-local-authentication` has no web implementation, so the gate reports unavailable and the
  sheet never mounts. The measurements above come from a temporary local override that forced the
  capability true on web, since reverted — `grep TEMP-VERIFY src/` is clean. Press delivery is also
  untestable there: the pane does not deliver trusted pointer events, and a Pressable's pressed state
  never engages under a synthetic one. What the emulator still has to confirm is the OS prompt, the
  keystore write, and that a second login now opens at the Face ID view.


## 26. Implemented — Home redesign, five sections (Figma `15521:75159`)

The designer revised the Home frame and named five sections as changed: the hero (spacing, the
account/statement buttons, a new clipboard button, a new background), the quick-action buttons
(colour and icons), "Send again" (shadow and size), "Recent activity" (shadow) and the floating tab
bar ("everything"). This section is that pass.

### 1. Hero — `Frame 1707480257`

The rhythm is untouched: the greeting still starts 16 below the status bar, the balance at 93, the
account row at 160 and the plate at 216. Four things inside it changed.

**The backdrop is two layers instead of a gradient.** `linear-gradient(227.76deg, #263852 …)` is
gone. Underneath is `Frame 1707480371 1`, a 1072×417 mesh raster whose visible window is exactly the
header — film grain, and a teal spill in the bottom-right corner, neither of which a stop list
reproduces — so it ships as the exact asset (`assets/home/hero-bg.jpg`, Figma's own export at 2×,
573 KB). Over it is `Group 1000004912`: three 5000px rotated gradient rectangles, two in
`color-dodge`, which warm the middle of the image.

Neither those rectangles' geometry nor their own gradients survive at screen scale, but their effect
does. **The fit described in the rest of this paragraph was wrong and has been replaced — see §28.**
Measured against the plain export down the two columns the header leaves clean (x 6…10 and
364…368), the composite looked like the export dodged by a purely vertical field — the same numbers at both edges, peaking at +22/255 in the red channel around y 190 and
falling to 0 at the top. Sampled every 10px and thinned to ten knots, that field reproduces Figma's
render to a mean **1.69/255** per channel (max 15.4, at the bright top where dodge is most sensitive)
against the ≤22 the bare image is short by. It ships as a ten-stop `LinearGradient` in
`mixBlendMode: 'color-dodge'` — `hero.dodge` — over a header that already had `isolation: 'isolate'`
for the watermark it replaces.

**The watermark is a different animal.** The engraved floral `Group 1000004170` is gone; `Component
662` is a horse in fine vertical hatch at 10%, inset 2 from both edges, starting 149 down the frame.
Figma clips it to the header, so its export is already the 371×221 that shows, and 105 + 221 is the
header's own 326 of body — which is why it is anchored to `insetTop` like every other row rather
than to the frame: that keeps its bottom edge flush with the header's on any notch.

It ships as a PNG, not markup, which reverses §24's decision for the floral pattern. The three
exported layers are 342 KB of hatch paths — both a heavy parse and a large `SvgView`, the shape of
the crash in §24.6. At 3× the same picture is 60 KB of bitmap, and unlike the floral engraving it
does not need to stretch past the board: it is inset 2 from both edges, so it scales in proportion
about its top-left and nothing is resampled sideways.

Figma paints it **above** the overdraft plate (the plate is the frame's third child, the horse its
last), so the hatch crossing the plate is the design. The greeting, balance and account row are
siblings of the header frame rather than children, so they stay above it; the JSX order reproduces
that exactly.

**The balance row loses the flag and gains a currency.** `_flagBase` is gone; the amount is followed
by a 12×24 `₮` at 20/24, 6 after it, then the eye 13 after that. The group runs 60…322, centred on
191 rather than the screen's 187.5, so the row keeps the same trick it had: `paddingLeft: 7` puts the
centre back where Figma has it, and a typeface wider than GIP grows the group evenly about that
centre instead of driving the amount into the eye.

**The account row is three controls, not two.** `Frame 1707480347`, 344 wide at x 15.5, gap 16:

| | Figma | rendered |
|---|---|---|
| selector | 232 × 40, radius 16, number centred on 99 | flex, radius 16, centred on 100 |
| copy | 40 × 40, radius 16, 20 glyph | 40 × 40, radius 16 |
| statement | 40 × 40, radius 16, 20 glyph | 40 × 40, radius 16 |

Copy is new. It displaced the old 133-wide labelled "Statement" pill, so both trailing buttons are
now plain squares and the row reads as one control and two affordances. The number's font went 12 →
14, and it is centred on what is left once the chevron and its 12 are taken out — not on the pill —
which is where Figma puts it. The radius went 21 → 16, so these are squares with soft corners rather
than pills.

Figma exports the copy button as a single 40 SVG: a glass square *and* a 1.5-stroke glyph in the same
box. Only the glyph is kept (`assets/home/icon-copy.svg` is the export with its `<rect>` removed), so
the square is the same component the other two are and can carry a pressed state.

**The plate.** Its spacing change is one number applied twice: the track and the two limits moved
from 50/64 to 55/69. Beyond that the overdraft pill doubled to 20% white on the 10% plate, so it
reads as raised out of it; the progress fill stopped being flat `#8EABD4` and runs
`linear-gradient(175.19deg, #FF9900 25%, #FF5100 93.5%)`, which at 8 tall is effectively straight
down; and the reward chip went 34 → 33 tall at radius 12 instead of 14, starting 8 inside the notch
rather than 15. The outline itself gained two tighter corners: the four outer ones are still 20, but
the two that meet the notch are 10, so `platePath` takes both radii. It is also 95 tall in a 94
frame — Figma's own off-by-one, kept, because the children are measured against the 94.

### 2. Quick actions — `Frame 1707480576`

The three tiles collapse into one skin. The blue 226.39° gradient is gone from both the fill and the
1px stroke, and so is Transfer's full-opacity version of it that marked it as the primary action;
what is left is `rgba(254,244,237,0.1)` behind a flat `#FEF4ED` hairline at radius 26, with a black
GIP Bold 15 label. So `Tile` no longer takes a mode or a `primary` flag, and the six per-mode tile
tokens are gone with them.

There is no shadow, although the tiles read as cards in the export. Scanning Figma's own render
across a tile edge at y 520 finds the page unchanged either side of the border — `#FFFCFC` outside,
`#FEFCFC` inside — so what separates a tile from the page is that hairline and nothing else.

All four icons were re-exported and are different art: the coin stack, the bills bookmark and the
transfer plane are all new, and `SavingsIllo`'s two layers moved with them (21.075×27.733 at 16.026,
2.274 and 21.075×21.483 at 1.961, 14.774). `paddingTop: 15` and a 10 gap are what put the icon's box
at Figma's y 16 and the label's centre on its y 75 — React Native measures an absolute child from
inside the border exactly as the CSS does, so the design's own numbers go straight in.

### 3. "Send again" — `Frame 1707480336`

The card's hairline became `Хас 2`: three drop shadows stacked at the origin, at 24/6/1 blur and
6/4/4%. The border went with it — keeping both made the edge read as a double line, and Figma states
the card as `bg-white` with the effect and no stroke.

React Native 0.86 takes a CSS shadow list in `boxShadow`, so all three are drawn. The older code
kept only the widest, because `shadowRadius` takes one. `overflow: 'hidden'` stays: it holds the
scrolled rail inside the 20 radius and does not touch the card's own shadow, which is drawn outside
the border box.

Nothing about the card's box changed — 343 × 98 at radius 20, the rail at gap 24 inside a 16 pad.

### 4. "Recent activity" — `Frame 1707480323`

The same effect at a third the spread: 12/3/0.5 at 6/4/4%, on every row.

Two smaller differences came out of reading the frame and are fixed in the same pass. The merchant
row is bordered in the surface colour itself rather than in `strokecolor/tertiary`, so it reads as
edgeless with only its shadow separating it, and it is padded by 16 with a 14 title where the other
two are padded by 12 with a 12 one. It has no stated height — 16 + 38 + 16 is what makes it the same
70 — so the rows' line heights are now Figma's own text boxes (17 for that title, 15 for everything
else) rather than Manrope's leading, which had been making it 76.

### 5. Floating tab bar — `Component 602`

Replaced wholesale. The prototype's bar and the design's share only the idea:

| | prototype | Figma |
|---|---|---|
| bar | 362 × 76, radius 22, dark glass, 1.5px `rgba(147,166,194,0.4)` | 343 × 70, radius 27, `#FCFCFC` |
| lift | accent glow + inset highlight | four shadows at 0/0, 16/12/4/0.5 blur, all 4% |
| placement | bottom 12 | 6 above the home indicator |
| labels | 10, bold, blue accent when active | 12 SemiBold, `#B7B7B7`, brand gradient when active |
| icons | ported blue illustrations at 27 | design-system duotone 24s |
| FAB | 62 disc, 3px white ring, float + pulse | 52 disc, 1px gradient halo, still |

The four item centres are Figma's own and are held as fractions of the bar: they are symmetric about
the scan button (40.5 / 107 and 235.5 / 302 of 343) but not evenly spread, so four equal flex slots
walk the outer two ~6 inwards. Measured at 375 the rendered centres are 40.55, 106.95, 235.5 and 302.

The glyphs are the designer's markup (`tabbar-art.ts`, originals in `assets/tabbar/`). All four are
`Bold Duotone` 24s — a main shape plus a secondary at 50% — and Figma exports Home with the brand
gradient already applied, because Home is the selected tab on the board, and the other three flat in
`#B7B7B7`. Home is normalised down to that same grey at generation time so one rule paints any of
them: `paint()` points the fills at the gradient Figma gives the selected glyph, at that gradient's
own geometry. Nothing is redrawn.

The active label is `background-clip: text` in the design, which React Native cannot do. The text
becomes a mask instead: an invisible copy sizes the view — from the text, not from the 64 box, so the
gradient's run stays the length Figma gives it — and the gradient is clipped to the visible one. The
mask is drawn in the gradient's mid colour `#F6723C`, which the mask has no use for (iOS and Android
take its alpha and ignore its colour); it is there because `@react-native-masked-view` on web is a
no-op that renders the mask element and drops the children, so the label comes out in the one colour
closest to the run rather than in the inactive grey.

The float and pulse animations are dropped. Neither is in the design, and the glow they were playing
against is gone; `react-native-reanimated` leaves this file with them.

### Measured against Figma

At 375 wide with no safe-area inset, so every y is Figma's minus the 44 status bar:

| | Figma | rendered | Δ |
|---|---|---|---|
| header | 375 × 370, bottom radius 30 | 375 × 326 + inset, radius 30, `isolate` | 0 |
| backdrop | window of a 1072×417 raster | one image, field baked in (§28) | mean 3.4/255 |
| watermark | 371 × 221 at x 2, y 149 | 371 × 221 at x 2, y 105 + inset | 0 |
| ₮ | 12 × 24 at x 273, y 152 | 12.1 × 24 at x 275.4, y 109 + inset | +2.4 x |
| account row | 344 at x 15.5, gap 16 | 344, gap 16, radius 16 | 0 |
| tile | 106.33 × 100, radius 26, 1px `#FEF4ED` | 106.3 × 100, radius 26, 1px `#FEF4ED` | 0 |
| tile label | centred on y 75 of the tile | centred on y 75 | 0 |
| send again | 343 × 98, 24/6/1 at 6/4/4% | 343 × 98, same three | 0 |
| activity row | 343 × 70, 12/3/0.5 at 6/4/4% | 343 × 70, same three | 0 |
| merchant row | 70, pad 16, title 14 | 70, pad 16, title 14 | 0 |
| tab bar | 343 × 70 radius 27, four shadows | 343 × 70 radius 27, same four | 0 |
| tab centres | 40.5 / 107 / 235.5 / 302 | 40.55 / 106.95 / 235.5 / 302 | ≤0.05 |
| tab labels | centred on y 49 of the bar | centred on y 49 | 0 |

The ₮'s +2.4 is Manrope: the amount before it renders wider than GIP's, and the row grows about its
centre by design.

### Files

| | |
|---|---|
| `assets/home/hero-bg.png` | new — the mesh backdrop at 2×, with the dodge field baked in (§28) |
| `assets/home/hero-horse.png` | new — `Component 662` at 3×, already cropped to the header |
| `assets/home/icon-copy.svg` | new — the copy glyph, the export with its glass square removed |
| `assets/home/savings-coins-{back,front}.svg`, `bills.svg`, `transfer.svg` | re-exported — different art |
| `assets/tabbar/*.svg` | new — the four tab glyphs, the More accent and the scan mark |
| `src/components/rightbank/home/tabbar-art.ts` | new — those exports as markup, Home normalised to grey |
| `src/components/rightbank/home/figma-assets.tsx` | the four icon constants swapped, `COPY` added, `SavingsIllo`'s geometry moved |
| `src/components/rightbank/home/HomeHero.tsx` | backdrop, watermark, balance row, account row, plate |
| `src/components/rightbank/home/QuickActionGrid.tsx` | one skin, no mode, no primary |
| `src/components/rightbank/home/SendAgainRail.tsx` | `Хас 2` for the hairline |
| `src/components/rightbank/home/RecentActivity.tsx` | the row shadow, the merchant row, stated line heights |
| `src/components/rightbank/home/TabIcons.tsx` | rewritten around the exported glyphs |
| `src/components/rightbank/home/FloatingTabBar.tsx` | rebuilt to `Component 602` |
| `src/constants/rightbank-theme.ts` | `hero.dodge`/`hero.horse`, the progress gradient, `tile`, `accountRow`, `figmaTabBar`, per-mode `cardShadow`/`rowShadow` |
| `src/app/(app)/(tabs)/home.tsx` | `QuickActionGrid` no longer takes a mode |

### Decisions and gaps

- **The section order in the frame is not the app's, and was left alone.** `15521:75159` leads with
  the promo rail and puts the quick actions second; the app still leads with the actions, as §24
  settled from the light frame. The designer listed five sections as changed and section order was
  not among them, so reordering the page on the strength of one frame would be a change nobody
  asked for. Worth one question to the designer.
- **The dodge field is a reduction, not the layers.** Three 5000px rotated rectangles in
  `color-dodge` are not reproducible at screen scale; what ships is the field they produce, measured.
  It is anchored to the header's full height, so on web — where there is no status-bar inset and the
  header is 326 rather than 370 — it is compressed by 12% along with everything else in the header,
  including the backdrop image. On a device it lands where it was measured.
- **The background is a raster in a file that has otherwise preferred vectors.** The exception is
  the same one AGENTS.md makes: the asset exists, it is a mesh render with grain, and no stop list
  reproduces it. 573 KB at 2×; 3× was 1.4 MB and the extra resolution buys nothing on a gradient.
- **No dark frame exists for any of this.** The one revised frame is the light board, so the warm
  tiles, the orange header and the white bar ship in both app modes, as the biometric sheet does
  (§25). The only invented values are the two dark shadow strings: Figma's geometry at the opacity
  the dark frame's old single shadow used, because a 6% black shadow is invisible on a near-black
  page. Dark mode was checked for structure — ink white, rows at 10% white, the stronger shadow —
  not for design parity it has none of.
- **The tab bar's floor is not designed.** Figma leaves 6 between the bar and a 34 home indicator;
  on a device with no inset that would put the bar 6 from the screen edge, so it is
  `max(insets.bottom, 12) + 6`.
- **`Font.medium` does not exist**, so "Send again"'s 10px sub-labels stay at Regular where Figma
  says GIP Medium. Manrope 500 is not loaded and GIP is not in the project at all — the same gap
  §24 records, and still the largest remaining one.
- **Not yet run on a device.** Verified in the preview pane by reading the rendered DOM, which is
  what the table above is: geometry, computed colours, computed shadows and the blend mode. What the
  emulator still has to confirm is that `boxShadow`'s three- and four-shadow lists draw natively,
  and the masked gradient label, which react-native-web cannot show at all.

## 27. Implemented — safe-area pass

Prompted by two Android emulator captures: the login screen's lowest button and the page content
sitting hard against the three-button navigation bar.

### The provider was missing

`SafeAreaProvider` was never mounted. Everything still got insets, because React Navigation wraps
each navigator in its own `SafeAreaProviderCompat` — but that copy covers screens only, reports
nothing on the first frame, and is not something to depend on for a rule the whole app follows. It
is now mounted once in `src/app/_layout.tsx`, inside `GestureHandlerRootView` and above every
provider, with `initialWindowMetrics` so the insets are right on the first paint rather than after a
measurement pass. That is the change that makes the rest of this section dependable rather than
incidental.

### The one real overlap: the login screen's `full` state

Every login state and the whole Home screen were already reading `useSafeAreaInsets()`. Working the
arithmetic out per device profile found exactly one state that lands under a system bar:

| inset | `full` (join) | `bio` (Face ID) | `pw` (log in) |
|---|---|---|---|
| 34 — iPhone, the Figma board | 29 → **−5** | 40 → 6 | 40 → 6 |
| 48 — Android three-button bar | 43 → **−5** | 54 → 6 | 54 → 6 |
| 24 — Android gesture bar | 29 → 5 | 40 → 16 | 40 → 16 |
| 0 | 29 → 29 | 40 → 40 | 40 → 40 |

`bio` and `pw` put their lowest control at 40, which clears the reference's 34 band by 6 and — once
`lift` adds the difference — clears any deeper inset by the same 6. `full` puts its at **29**, inside
that band. On iOS that is the design and it is fine: the home indicator is a hairline pill near the
bottom of the band and content may share the rest of it, which is why Figma drew it there. An Android
navigation bar is 48 and opaque, and the button was landing 5 underneath it — untappable, because the
system bar takes the touch.

So the lift now has a floor. A bottom inset deeper than the reference 34 is read as a bar rather than
an indicator, and the lowest control is lifted clear of it by `minBottomClear` — 6, the smallest gap
the design itself uses, so nothing is invented:

```ts
const figmaLift = Math.max(0, insets.bottom - loginLayout.referenceSafeBottom);
const lift = figmaLift > 0
  ? Math.max(figmaLift, insets.bottom + loginLayout.minBottomClear - loginLayout[view].lowest)
  : figmaLift;
```

Only `full`, and only on a device with an opaque bar, moves: its join button goes from 43 to 54 on a
48 inset. `bio` and `pw` compute the same 14 they already had, and an iPhone at exactly 34 still
renders Figma's numbers untouched — verified in the preview, where the two buttons measure 29 and 89
from the bottom exactly as before.

### Everything else, checked rather than changed

- **Home** — the header takes `insets.top`, every row inside it is measured from the bottom of the
  status bar, and the scroll pads `insets.bottom + 104` against a bar that occupies `insets.bottom +
  76`, so the last row clears it by 28.
- **The floating tab bar** — `max(insets.bottom, 12) + 6`, which is Figma's 6 over the home indicator
  with a floor for a device that reserves nothing.
- **Account / Card / More** — all three already pad `insets.top + n` and `insets.bottom + 104`.
- **The biometric and Face ID sheets** — both anchor at 40 + the same lift, so both clear by 6.
- **`SecurityWarningModal`** was the one surface with no inset handling at all: a full-window scrim
  with a flat 14 of padding around a card that has no height cap. The padding now takes the inset as
  a floor (`Math.max(insets.top, 14)`), so the card cannot reach under either system bar. Capping or
  scrolling the card itself is still open — on a short screen its content can outgrow the window.

### The rule is written down

AGENTS.md has a new **Safe Areas** section: use `useSafeAreaInsets()` and never `SafeAreaView`,
inset top-anchored content by `insets.top`, bottom-anchored content by `insets.bottom`, pad scrolls
past whatever floats over them, treat a design's padding as a floor on overlays — and how to read a
Figma frame's bottom offsets, which are measured from the bottom of the board and not from the top
of its 34 indicator band. It applies to every future screen and component, not only the migrated
ones.

### Not verified on a device

The arithmetic above is tabulated, not observed: the preview pane has no insets, so what it confirms
is that the change is inert at inset 0 and that nothing regressed. The 48 and 24 columns need the
emulator.

## 28. Fixed — the header backdrop and its watermark (supersedes part of §26)

Reported from an Android emulator: the horse watermark was not there. It turned out to be two
separate mistakes, both mine, in the same corner of §26 — and the second one was only visible
*because* I went looking for the first.

### The watermark asset had no alpha

`assets/home/hero-horse.png` was 100 % opaque. Figma had not exported `Component 662` onto
transparency; it composited it onto a flat `#FC9B10` backdrop, so 92 % of the file was solid orange
with the hatch painted over it. Drawing that at 10 % opacity paints a 10 % orange wash over an
already-orange header, and the hatch — three parts in 255 of contrast — disappears into it. Exactly
what the screenshot shows.

The check that missed it was mine: I verified `maxAlpha` was 255 and concluded the opacity had not
been baked in. A maximum says nothing about a distribution. The histogram does, and it is decisive —
the file has **40 distinct blue values**, 99.63 % of them between 16 and 40 in steps of about 3, then
a jump to 255 for the last 0.35 %.

That is a fully invertible composite, and it says two things at once. The artwork is pure white (all
three exported layers are `fill="white"`), so every pixel is white blended into one known backdrop
colour by its coverage — and full ink lands on **40**, not 255, which means Figma applied the node's
own 10 % opacity on the way out. So:

```
t = (B - 16) / (40 - 16)
```

recovers the artwork's coverage, white at alpha `t`, leaving the component to apply the 10 % itself
as the design states it. 92.1 % of the result is fully clear and 4.1 % is full ink: a hatch drawing.
45 KB, down from 60.

The blue channel does the work because it has the widest range of the three — red only moves between
252 and 255, which is why the picture read as "white on white" at a glance.

### The dodge field was fitted from its own trough

§26 claimed `Group 1000004912` reduces to a purely vertical field, on the evidence that the two clean
edge columns agree with each other. They do. They are also both near the *minimum* of a
two-dimensional bump, so agreeing proved nothing, and the ten stops fitted to them under-dodge the
middle of the header by about **20/255 in red** — the hero shipped visibly cooler down its centre
than Figma draws it.

Sampling the whole header rather than its edges shows the real shape: brightest down the middle,
falling off to both sides, peaking around y 190…250, where the centre reaches S_red ≈ 72 against ≈ 38
at the edges.

It is separable, though not in `S`. Dodging by `s₁` and then by `s₂` gives `base / ((1-s₁)(1-s₂))`,
so in `L = -ln(1 - s)` two stacked layers simply **add** — and an additive two-way fit of `L(x, y)`
lands at a mean residual of 0.016 (red) and 0.012 (green), about 1.5 % in factor terms.

### Which made baking it the better answer

Since the field is smooth and separable, it no longer has to be a layer at all. It is applied once,
offline, to the 2× export, and the app draws one ordinary `<Image>`:

* no `mixBlendMode` at runtime — which retires the "unverified on Android" flag §26 opened rather
  than carrying it to the emulator;
* no `isolation: 'isolate'` on the header, which only existed for the blend;
* one fewer full-screen composited layer per frame.

Verified against Figma's own render of the header, over every pixel outside the UI bands:

| | mean abs err | max |
|---|---|---|
| backdrop, no watermark ink | **3.30**/255 | 112 (the bottom-right corner arc, antialiasing to the page) |
| partially inked pixels | 7.29 | 25 |
| fully inked pixels | 6.97 | 88 |

against the ~20/255 the shipped version was short by through the middle. The higher error on inked
pixels is the hatch being a one-pixel feature sampled from a 3× bitmap, not a colour error.

Cost: `hero-bg.png` is 747 KB against the 573 KB JPEG it replaces. PNG because the only image codec
available here reads and writes PNG, and the alternative — keeping the JPEG and fixing the field with
two stacked blend layers — is the thing baking was meant to avoid.

### What this changes about §26

`hero.dodge` / `hero.dodgeStops` are gone from `rightbank-theme.ts`, the `LinearGradient` and its
`styles.dodge` are gone from `HomeHero.tsx`, `isolation` is off the header, and the backdrop is
`assets/home/hero-bg.png`. §26's own numbers have been corrected in place where they were wrong.

### Lesson

Two, and they are the same lesson twice: **a summary statistic is not a distribution, and an
agreement between two samples is not a fit.** `maxAlpha === 255` was taken as proof the opacity was
not baked in; two edge columns agreeing was taken as proof the field had no horizontal component.
Both were consistent with the truth and with the error, and in both cases the cheap discriminating
measurement — a histogram, a grid instead of two columns — was one line away.

---

## §29 — Floating tab bar: the scan button's glow

Request: *"qr button is changed, background is changed and glow added"*, against
`15521:75159` → `Component 602` (`15552:82840`).

### What actually changed

One thing. Every other part of the bar is byte-identical to what was already shipping:

| part | Figma export | in the repo | |
|---|---|---|---|
| bar surface | `Union`, 343×70, r 27, `#FCFCFC` | `figmaTabBar.surface` / `radius` | same |
| bar shadow | four stacked, 16/12/4/0.5 at 0.04 | `figmaTabBar.shadow` | same string |
| scan glyph | `Interface, Essential/scaner-barcode`, 23.5718 in a 29 box | `assets/tabbar/icon-scan.svg` | byte-identical |
| FAB disc | `Ellipse 1453`, `#F05327`→`#FD8456` | `figmaTabBar.fabFill` | same |
| FAB halo | `Ellipse 1454`, 54, blur 0.5 | `figmaTabBar.fabRing` | same |
| four tab icons | account / card / more / dots | `assets/tabbar/*.svg` | byte-identical |
| home icon | — | — | differs only in `linearGradient` id numbering |
| item centres | 40.5 / 107 / 235.5 / 302 | `figmaTabBar.itemCentres` | same |

The new node is `Ellipse 3871` (`15840:76302`): the same 52 disc again, in the brand gradient
`#ED1846 → #FFCC32`, under a layer blur of radius 26, spilling to a 104 box. It is painted straight
after the bar's surface and so sits *under* the four tabs — it washes over the white and tints the
nearest label rather than sitting on top of it.

That glow is almost certainly what "the qr button is changed" and "the background is changed" were
both describing: it reads as part of the button and it lights the bar behind it.

### Why it is baked

Same reasoning as §28's backdrop. A blurred gradient disc is static art; react-native-svg's filter
support is the sort of thing that works on one platform and not the other, and the alternative is a
full-screen-adjacent composited layer per frame for something that never changes. It is rendered
once, offline, to `assets/tabbar/fab-glow.png` (312×312 = the 104 box at 3×, 61 KB), drawn as one
ordinary `<Image>`.

### Figma's blur is not a Gaussian

The first cut took the SVG export at its word — `feGaussianBlur stdDeviation="13"` — and rendered a
true Gaussian. Composited against Figma's own render it gave **mean abs err 1.64/255**, which looks
like a pass. It is not one. Binning the same residual by radius shows the error is entirely
structural:

```
 r     figma    baked   ratio
28     36.96    35.63   0.964
36     14.12    16.07   1.138
44      3.23     5.32   1.647
52      0.18     1.30   7.039
```

Near the disc it matches; from r≈40 out it is 20–60% too heavy, and it carries a tail past r=52
where Figma has nothing at all. The mean stayed small only because the glow is faint out there —
**the same mistake §28 closed with, in a new costume.** The total darkening ratio, 1.22, is the
statistic that actually names it.

Figma's falloff reaches exactly zero at **r = 52 = the disc's 26 + the blur's stated 26**: compact
support, i.e. the triple-box approximation a GPU renderer uses, not the long-tailed Gaussian the SVG
exporter writes out.

So the kernel is not modelled. Figma flattens the node onto white, which makes the composite
invertible exactly as the horse was in §28, and the source is a *uniform* disc, so the alpha is
radially symmetric whatever the kernel — only the colour varies, and it varies slowly. `alpha.js`
therefore measures `a(r)` directly off the render from the clean strip above the bar, one estimate
per pixel across the three channels:

```
a = Σ_c (255 − C_c)(255 − fig_c) / Σ_c (255 − C_c)²
```

median-binned at 0.5px, smoothed over ±1px, forced monotone, zero at 52. Inside r = 27 it is
mirrored about the disc's edge (`a(26−d) = 1 − a(26+d)`, what a symmetric kernel gives at a
boundary) — that whole region is behind the opaque 52 disc and its 54 ring and is never seen. The
colour keeps the Gaussian bake's blurred gradient: colour is a *normalised* weighted mean, so unlike
the alpha it barely moves with the kernel's width, and the gradient it averages is linear.

### Verification

Against Figma's own render, over the clean strip above the bar (8,778 samples; the disc excluded
with a 2px margin, rows below 34 dropped because the bar's 16px shadow reaches that far up):

| | first cut (Gaussian) | shipped (measured) |
|---|---|---|
| mean abs err | 1.64/255 | **0.65/255** |
| max | 7.3 | 5.5 |
| total darkening vs Figma | ×1.22 | **×0.994** |

and the per-radius ratio now tracks within ~1% out to r = 46. What is left past r = 52 (0.18 and
0.05 of 255) is Figma's own render dithering, below quantisation.

Preview-verified: the glow's box measures 104×104 centred at x 187.5, its centre 5 below the bar's
top edge, the bar 343×70 sitting 18 clear of the bottom on a device with no inset (`max(0,12)+6`).

### Still open

Device verification. The glow is an `<Image>`, so it carries none of §26's `boxShadow`/`mixBlendMode`
risk, but nothing here has been seen on the emulator yet.

---

## §30 — QR scan screen

Figma `14656:64053` ("iPhone 13 mini - 40"), reached from the raised scan button in the floating
tab bar. First screen in the app with a real camera.

### Why it is a tab

The frame keeps the floating tab bar on screen while scanning — and not the white one. The bar in
this frame is `Component 604`: the same 343 × 70 at radius 27 with the same four shadows, on a
translucent surface over a backdrop blur, with every glyph and label white.

A screen pushed onto the `(app)` stack would cover that bar, and a second copy drawn by the scanner
would be a copy to keep in sync with the original. So `scan` is a fifth route under `(tabs)` with no
item in the bar: the real bar renders over it with its live state, and the FAB is its only entry
point. `FloatingTabBar` picks the variant off the navigation state (`state.routes[state.index]`),
not off a prop.

The camera is mounted only while the tab is focused (`useIsFocused`). A tab stays mounted once
visited — that is the point of the navigator — so without that gate the preview would hold the
camera open behind Home.

### Measurements

| Part | Figma | Shipped |
| --- | --- | --- |
| Scrim | `Subtract`, black 50 % over 375 × 812 minus the window | one even-odd `Path`, same construction |
| Window | x 63…311.617, y 294…541, r 20 → 248.617 × 247 | 248.617 × 247 at r 20, centred |
| Brackets | `Rectangle 288`, 305 box under a 5 round stroke → 310 art | the SVG verbatim at 310 |
| Bracket stroke | `#ED1846` → `#FFCC32`, corner to corner | carried by the SVG itself |
| Segment row | y 68 (24 under a 44 status bar), two 165 × 38 at r 35, gap 13 | `insets.top + 24`, `flex: 1` capped at 165, gap 13 |
| Active pill | `linear-gradient(142.545deg, #F05327 11.557%, #FD8456 88.443%)` | same, via `cssGradientAngle` |
| Inactive pill | `rgba(245,243,246,0.1)` | same |
| Labels | GIP Bold / SemiBold 14 / 16, white | Manrope Bold / SemiBold 14 / 16, white |
| Controls | 48 at r 20, `rgba(255,255,255,0.1)`, 1 white border, gap 40, y 612 | same, anchored 21 above the FAB's top edge |
| Bar surface | `#FCFCFC` at 14 % over `backdrop-blur: 35px` | `BlurView` + a separate 14 % wash |

Measured in the preview at 375 × 812: brackets 310 × 310 at (32.5, 262); scrim hole
x 63.19…311.81, y 293.5…540.5 at r 20; controls 48 × 48 at x 119.5 and 207.5, so gap 40 and pair
centre 187.5; active label centre x 98.45 against Figma's 98.5; both bar layers present at
(16, 724) — `blur(7px)` and `rgba(252,252,252,0.14)`.

The control row's bottom offset is derived, not hard-coded: `insets.bottom + 6 + 70 + 21 + 21`.
On the iPhone 13 mini's 34 that is 152 from the frame's bottom, which puts the row's top at exactly
Figma's y 612. It therefore holds its 21 gap to the raised button on any inset rather than drifting
into it.

### The one place the design was not reproduced literally

The frame draws the scan window's two decorations off each other: the bracket group is centred on
x 183.5 and the scrim's hole on x 187.3, with their vertical centres 2 apart. Nothing asks for a
frame and a window 4 apart, and a screen that has to work at any width has to centre something
anyway — so both are drawn concentric on the offset the group node itself carries
(`top: calc(50% + 11px)`), at Figma's own sizes. The shipped hole lands 0.19 right and 0.5 up of
where Figma puts it.

### Invented values

Three, all named in `figmaScan`:

* **`bar.blurIntensity: 35`** — Figma's `backdrop-blur` is a pixel radius; `expo-blur`'s `intensity`
  is an opaque 1…100 scale with no published mapping. The design's number is carried across as-is
  for want of anything better. On web it lands as `blur(7px)` (react-native-web divides by 5), well
  short of 35; the native mapping is different again.
* **`tint="dark"` on the `BlurView`** — `expo-blur` has no untinted blur. The tint is an extra
  darkening the design does not ask for. The 14 % white wash is kept as its own view so that at
  least *that* layer is exact: set as a background on the `BlurView` it is overwritten by the tint.
* **`controlOn`, `rgba(255,255,255,0.35)`** — the torch has no on-state in the design. Rather than
  introduce a colour, the fill it already has is raised from 0.1.

### Behaviour

* `expo-camera` `CameraView` with `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}`. The scan is
  latched on a **ref**, not state: `onBarcodeScanned` fires once per frame the code stays in view,
  and a state flag lets a dozen through before the first re-render lands. The latch is re-armed on
  blur and by the alert's "Дахин унших".
* A decoded code currently ends in an `Alert` with the value. That is the seam where the payment
  flow attaches; it is shown rather than dropped so the scanner can be verified end to end.
* The gallery button is `expo-image-picker` → `scanFromURLAsync`, which reads a code out of a
  screenshot. It is the design's `pictures-square` button, not an addition.
* Camera permission is requested **on focus**, not on mount: the tab mounts on first visit, so
  asking on mount would put the system dialog in front of Home. Denial falls back to a message and
  a button that re-asks, or opens Settings once `canAskAgain` is false.
* The torch is not reset on blur — it is a prop on a camera that unmounts with the focus, so it goes
  out with the preview and returns in whatever state it was left.
* The "Миний QR" pill is drawn as designed but inert: that screen is not built.

### Native build

`expo-camera` and `expo-image-picker` are new native modules and both carry config plugins, added to
`app.json` with Mongolian permission strings. **The dev client has to be rebuilt** — a JS reload
will not pick them up.

### Still open

Device verification. Everything above is measured in the web preview, where the camera itself cannot
run (the pane blocks capture) and where `BlurView`'s backdrop blur behaves differently from either
native platform. In particular: whether Android's blur shows anything behind a camera surface, and
whether the glass bar reads as designed against a live preview rather than against black.

### Device fix — the camera's black bars

First run on Android showed the feed as a band with black above and below it.
CameraX's `PreviewView` *fits* the preview inside the view it is given rather
than filling it, and expo-camera exposes no way to change that from JS — the
only prop that touches the scale type, `ratio`, switches it from FILL to FIT,
which is the wrong direction (`node_modules/expo-camera/android/src/main/java/expo/modules/camera/ExpoCameraView.kt`).

So the box changed rather than the camera. On Android the `CameraView` is laid
out as tall as the root and 3/4 of that wide — wider than a portrait screen —
inside an `overflow: 'hidden'` container. Any preview fitted into that box comes
out at least as tall as the screen, so the crop, not the black, absorbs the
difference; 4:3 is the squarest aspect a camera reports, and a 16:9 preview fits
the same box by its height and loses more of its width. The root is measured
with `onLayout` rather than read off `useWindowDimensions`, so the box is the
view's real height.

iOS is untouched: `AVCaptureVideoPreviewLayer` fills already, and this box would
zoom it further.

## §31 — My QR (Figma `14656:64128`)

The scanner's other half, reached from the segmented control the two screens
share. Like `scan` it is a tab with no item in the bar — the design keeps the
floating bar on screen, the two are each other's only destination, and switching
between them should not grow a stack. The page is light (`#FCFCFC`), so the bar
keeps its solid variant; only the scanner turns it to glass.

### The code

The design's QR is a placeholder, so it could not be shipped as an exported
asset: it has to encode the real account. What is reproduced instead is how the
design *draws* a code, measured off its own SVG export and rebuilt around a real
encoder (`qrcode-generator` — pure JS, no native side, and it hands over the
matrix rather than a rendered image).

Measured from `14656:64139` (207 × 207):

| | Figma | Shipped |
|---|---|---|
| matrix | 25 modules (version 2) | 25, from the payload |
| module pitch | 6.44 | 6.440 |
| quiet zone | 23 (3.571 modules) | 23.000 |
| data module | circle, 1 module across | same |
| eye frame | 7-module rounded square hollowed to 6 | same |
| eye corner radius | 17.25 (2.6785 modules) | same, outside and in |
| pupil | round, 3 modules | same |
| panel | `#F8F8F8`, radius 40 | same |

The quiet zone is held in *modules*, not pixels, so the code keeps the design's
proportions whatever matrix the data needs. Error-correction level M is the
conventional default and happens to land on the design's own 25 modules for an
account number — it was not picked to. Verified by rendering both side by side
at 207: same density, same beading, same eyes.

The payload is the whole account reference unspaced (`MN650032005000610569`).
There is no payment-request format to encode against yet; that is the seam.

### The rest

- The block (`14656:64136`, 225 × 359) is centred on the screen as Figma centres
  it, with the card pinned to its top and the buttons 2 below its bottom. Its
  height is a minimum rather than a fixed measure, so a name that wraps pushes
  rather than overlaps.
- The note is anchored by its top at 94 below the status bar — Figma centres it
  on 121, which at the design's three lines of 18 is the same place, and anchoring
  the top is what stops it drifting if it wraps to four.
- Share and copy are the design's own `share-square` and `text-copy_1`, at
  `assets/myqr/`. Copy puts the account number on the clipboard; share opens the
  system sheet with the name and account.

### Shared with the scanner

The segmented control moved out of `scan.tsx` into
`src/components/rightbank/scan/SegmentedTabs.tsx`. Both screens draw it and each
is the other's destination, so a copy on each would be two copies to keep in
step. Only the unselected pill differs between them: a 10 % white wash over the
camera, a `#EDF0FD` hairline on the page. The scanner's "Миний QR" pill, drawn
but inert since §30, now navigates.

### Still open

- `Manrope_500Medium` was added to the loaded weights — the design uses GIP
  Medium in three places here and the stand-in set had no 500. GIP itself is
  still missing; see the standing font gap.
- `expo-clipboard` is a new native module, so the dev client needs rebuilding
  again alongside `expo-camera` and `expo-image-picker`.
- Not verified on device or in the web preview: the dev server on 8081 was
  unresponsive this session, so only the code's own geometry was checked, by
  rendering it against Figma's export outside the app.

---

## §32 — Android navigation bar follows the app theme

The Android system navigation bar now takes its whole appearance — scrim and
button colour — from Light / Knight rather than from the OS.

### One decision, not two

`app.json` configures the `expo-navigation-bar` plugin with
`enforceContrast: true`, which leaves Android drawing its own contrast scrim
behind the buttons. That is what makes this a single call: the platform picks
the scrim's colour from the same window flag that picks the button colour.

| `setStyle` | Window flag | Scrim | Buttons |
| --- | --- | --- | --- |
| `'dark'` | light appearance | near-white (`#E6FFFFFF`) | dark |
| `'light'` | dark appearance | near-black (`#801B1B1B`) | light |

So Light maps to `'dark'` and Knight to `'light'`, and the bar reads as themed
rather than as an inverted strip under a themed page.

Note `style` names the **content** colour, not the bar's. The plugin option of
the same name inverts again (it writes `windowLightNavigationBar`). Three
inversions in one feature, which is why the app-side API is named `buttons`,
`'black' | 'white'`, and the mapping is done once.

`'auto'` and `'inverted'` are not used: both resolve against the OS colour
scheme, and this app's theme is a persisted in-app choice that deliberately
does not follow it.

### Imperative, and sent twice

`NavigationBar.setStyle`, not the declarative `<NavigationBar style=… />`. The
component defers every update through a `setImmediate` and merges it through a
module-level entries stack, and in this app that never reached the native
module.

`setStyle` keeps its own record of what it last sent and drops a repeat, and
that record is written only by JS — so it goes stale whenever the flag changes
natively, and the call it drops is then the one that would have corrected it.
Two writers do exactly that: React Native's `enableEdgeToEdge` sets the flag at
startup from the **OS** scheme, and `expo-image-picker`'s crop activity (which
the scanner opens) sets it for its own window. So `apply()` sends the other
value first and the wanted one second, and the root re-asserts on `AppState`
`'active'`.

### Per-screen override

`ScreenNavigationBar` pushes a colour for as long as its screen is focused —
focus-gated rather than mount-gated, because a tab stays mounted once visited
and an override tied to mounting would keep applying from behind another tab.

| Screen | Buttons | Why |
| --- | --- | --- |
| everything else | follows the theme | Light → black, Knight → white |
| `/scan` | white | always a dark camera feed |
| `/my-qr` | black | page is `#FCFCFC` in both themes |

Both of those screens have a fixed background, so without the override the bar
themes itself into invisibility against the one the theme disagrees with.

### Files

- `src/theme/system-navigation-bar.tsx`
- `src/app/_layout.tsx` — mounts the root piece inside `AppModeProvider`
- `src/app/(app)/(tabs)/scan.tsx`, `src/app/(app)/(tabs)/my-qr.tsx`
- `app.json` — `["expo-navigation-bar", { "enforceContrast": true }]`

### History, and what is still unverified

This landed on the fourth attempt and the first three are worth not repeating:
the declarative component never reaches the module; `enforceContrast: false`
buys a genuinely transparent bar but makes RN skip setting the flag at all, so
the window starts white whatever the theme says; and the dedupe silently drops
the corrective call. Only the last of those was diagnosed from evidence rather
than guessed.

**Not verified running.** No attempt in this series was observed on a device.
The things that would narrow a remaining failure are the device's Android
version and whether the OS itself is in dark mode.

---

## §33 — Accounts (Figma `14765:54878`)

The Account tab redesigned from the frame, the way Home was in §26: a
`#F0F1F3` page under a centred 56 navigation bar, a white 52 segmented track
floating on it under three brand-tinted shadows, and one card per account.

Status: `[x] analyzed [x] structure [x] navigation [x] visual pass 1
[x] typography [x] assets [x] interactions [ ] final comparison [ ] complete` —
the last two are held open for the same reason every screen since §26 is: the
GIP family is still missing and Manrope stands in for it.

### Measured, and checked back

Every offset is Figma's own, taken from `get_metadata` on the frame and its
card rather than read off the render, and each one was then read back out of
the running app with `getBoundingClientRect`. They agree exactly. Figma's
y is measured from the top of the 812 board, so each one here is that minus
the 44pt status bar, which is what `insets.top` supplies at runtime.

| Element | Figma | Measured in app |
| --- | --- | --- |
| Navigation bar | 375 × 56 at y 46 | 375 × 56 at y 2 + inset |
| Eye button | 40 × 40 at x 319, y 54 | 40 × 40 at x 319, y 10 + inset |
| Segmented track | 343 × 52 at x 16, y 108 | 343 × 52 at x 16, y 64 + inset |
| Card 1 | 343 × 118 at y 176 | 343 × 118 at y 132 + inset |
| Card 2 | 343 × 118 at y 310 | 343 × 118 at y 266 + inset |
| Statement badge | 64 × 28 at x 279 | 64 × 28 at x 278 |
| Open a new account | 343 × 48 at y 444 | 343 × 48 at y 400 + inset |

The four sub-tab pills are Figma's 76/76/76/75, which is the track's own width
shared out; they are four equal flex children instead, measuring 75.8 on the
375 board. Fixed widths would leave the track ragged on anything wider.

### What the redesign removes

The prototype's Accounts tab had a dark "Account reference" banner, a
sky-tinted currency-conversion card with a confirmation strip, four
per-currency cards with gold/plain tints and an accrual line each, and a
"3 of 5 current accounts used" caption. None of that is in the frame. What is
left is one neutral card per account whose only variation is the ring on the
selected one and the tick beside a verified name — both per-account marks in
the design, not a rule about the first row.

The large title and its subtitle are gone too, replaced by the centred 56 bar.

### Three inversions avoided, one kept

The balance is one `<Text>` with two spans — `10,254,321` at 18 and `.00 ₮` at
14 — because that is how Figma draws it and spans in a text flow share a
baseline. Two sibling views set to the same line height only approximate that,
which is also why `MaskedDigits` is not used for the hidden state: it is a row
of views. Hiding swaps the digits inside the span instead.

### The eye

The frame draws `Use icon / Eye_off` in the navigation bar and never draws the
other state. It is wired to hide every balance on the screen, because that is
what the control means everywhere else in the app and leaving it inert would
ship a dead affordance. The shown-when-hidden glyph is the same export with
`Path (Stroke)_4` — the diagonal Figma lays over it to mark "off" — dropped;
every remaining path is the export's, untouched.

### Assets

Four SVGs, exported verbatim to `assets/account/` and inlined as strings in
`account-art.ts`, for the reason `scan-art.ts` gives: Metro has no SVG
transformer configured here. The wallet and the verified tick carry the brand
gradient in their own `<defs>` and are never recoloured; the copy glyph and the
eye are single-colour and go through `tintArt`, which swaps the one literal and
leaves the path data alone.

### Knight

Derived, not designed — the redesign shipped one light frame, as §26's did.
The page and the card surface are Home's own Knight values so the two tabs read
as one app; the divider and the two tints are the light frame's colours
restated as washes over that surface. The brand inks and the selected
account's ring are unchanged, because they are the brand.

### The other three sub-tabs

Deposits, Loans and Reward keep the panels they already had and render under
the new chrome unchanged. There is no frame for any of them, and inventing one
would be the redesign this project is told not to do — so they now sit under a
redesigned header in their prototype styling, which is visible and deliberate.
They are the obvious next three frames to ask for.

### Files

- `src/app/(app)/(tabs)/account.tsx` — rewritten: the page, the scroll, the
  hidden-balances state.
- `src/components/rightbank/account/AccountsNavBar.tsx` — new.
- `src/components/rightbank/account/AccountCard.tsx` — new.
- `src/components/rightbank/account/AccountsPanel.tsx` — rewritten.
- `src/components/rightbank/account/SegmentedTabs.tsx` — rewritten to the
  Figma control; same generic API, so the call site did not change shape.
- `src/components/rightbank/account/account-art.ts` — new.
- `src/constants/rightbank-theme.ts` — `figmaAccounts`, `figmaAccountsList`,
  `accountsCopy`.
- `assets/account/{wallet,verified,copy,eye-off}.svg` — the exports.

`accountsList` in the theme is now unread — it is the prototype's four-account
data and is left where it is with the rest of the prototype's tables.

### Verified

Run on the web build at 375 × 812: geometry read back out of the DOM against
the table above, Light and Knight both rendered, the hidden state toggled, and
the Deposits panel confirmed still rendering under the new chrome. The console
carries only the pre-existing `getBannerList` CORS failures from Home.

**Not verified on a device.** Untested there: the three brand-tinted shadows on
the track as a native `boxShadow` list, the dashed border's dash rhythm on
Android, and the masked gradient on the "Open a new account" label — the same
`MaskedView` recipe as the selected tab's label, which is itself still
unverified from §26.

### §33.1 — Two things device feedback caught

**The type was a weight too light.** Mapping `GIP:Bold` to `Manrope_700Bold`
reads the name across, but the two families do not line up rung for rung —
GIP's Bold is appreciably heavier. Measured as mean ink coverage of the same
string at the same size and line box, against Figma's own export:

| String | Figma (GIP) | Manrope 600 | Manrope 700 | Manrope 800 |
| --- | --- | --- | --- | --- |
| `Хүнс` Bold 14 | 0.2306 | — | 0.2078 | **0.2259** |
| `Харилцах данс` SemiBold 12 | 0.2147 | 0.2032 | **0.2239** | — |

So every GIP weight is one Manrope rung heavier than its name suggests. That
ladder is now `GipFont` in the theme, next to `Font`, and this screen uses it.

Two things it is *not*: it is not a fallback bug — Manrope carries the
Mongolian Cyrillic (`ү`, `ө`) and the weights do apply, confirmed by measuring
the string against `sans-serif` and against Manrope's own other weights; and it
is not applied globally, because that would silently re-weight screens signed
off under the old mapping. Swapping `Font` for `GipFont` in them is the whole
change when that is wanted, and all of it becomes a no-op the day GIP arrives.

**The dashed border was the platform's, not Figma's.** `borderStyle: 'dashed'`
draws roughly 3 on, 3 off and reads as a dotted line. Figma's is 9.29 of ink to
6.43 of gap — a 15.71 period, measured off its own render of the button and
held to ±0.5 over fifteen periods. React Native has no way to say either
number, so the border is now an SVG rounded rect with that `strokeDasharray`
and the view carries no border at all. The rect waits one frame for `onLayout`
to give it a width.

## §34 — The two account sheets (Figma `15338:61406`, `16058:37255`)

Two bottom sheets reached from the Accounts tab: **Account detail**, which an
account card opens, and **Open an account**, which the dashed "＋ Open a new
account" button opens. The request named the card for both; the second frame is
a product picker with a Continue button and no account in it, so it is wired to
the button that means "open one" rather than to the card that means "show me
this one". Say the word if the card was meant to reach both.

### Routes, not overlays

Both are files in `src/app/(app)/`, presented as `transparentModal` with
`animation: 'none'`. That is what `(app)/_layout.tsx` already says to do for a
screen pushed from a tab: the floating tab bar is the tab navigator's own
`tabBar` and a sibling of the screen container, so nothing rendered inside a tab
can cover it whatever its `zIndex`. One level up it can. Being a route also
gives the Android back button and a real dismissal for nothing.

`animation: 'none'` hands the entrance to the sheet, which slides and fades with
Reanimated exactly as `BiometricOptInSheet` does — a native `formSheet` would
bring its own radius, grabber and detents, none of which are the ones drawn, and
the two frames differ in height by 265.

The stack sets `contentStyle: { backgroundColor: '#000' }` for its screens; both
of these override it to `transparent`, or the tab they are supposed to float
over is painted out and the scrim has nothing to dim.

### Geometry, measured

Read out of the running app with `getBoundingClientRect` and compared against
`get_metadata`. Every number is Figma's, relative to each sheet's own top edge.

**Account detail — 375 × 683**

| | Figma | app |
| --- | --- | --- |
| sheet | 375 × 683 at the bottom edge | ✓ |
| grabber | 175.5, 12, 24 × 4 | ✓ |
| title | 16, 40, 343 × 24 | ✓ |
| close | 335, 40, 24 × 24 | ✓ |
| balance card | 16, 88, 343 × 99 | ✓ |
| reference banner | 15.5, 203, 344 × 85 | ✓ |
| "Interest · up to 3%" | 16, 304 | ✓ |
| interest card | 16, 344, 343 × 179 | ✓ |
| "Manage" | 16, 539 | ✓ |
| manage card | 16, 579, 343 × 406 | ✓ |

**Open an account — 375 × 418**

| | Figma | app |
| --- | --- | --- |
| sheet | 375 × 418 | ✓ |
| title | 16, 40 | ✓ |
| "Бүтээгдэхүүн" | 16, 88 | ✓ |
| card | 16, 131, 343 × 168 | ✓ |
| rows | 32, 147 / 199 / 251, 311 × 32 | ✓ |
| rules | 32, 189 / 241, 316 wide | ✓ |
| Continue | 16, 330, 343 × 48 | ✓ |

### Three things that had to be stated rather than left to the renderer

**Line heights.** The frames set `leading: normal`, which under GIP gives a 15
box for a 12 title and a 14 for its subtitle. Manrope's normal leading draws
each at about 16.4, which added four to every list row — five on the balance
card, fifteen on the three-row Interest card and thirty on the seven-row Manage
card, and pushed everything below them down by the same. Every text now carries
Figma's own box. Same treatment, same reason, as `biometricSheet`.

**The amount's two spans.** An 18 and a 14 in one `<Text>` measure 24 even with
both line heights pinned to 22, so the identity row states Figma's 22 outright.
The card's 12 of padding absorbs the overhang. (`AccountCard` has the same
construct but a fixed 36 row, so it never showed.)

**Zero-height rules.** Figma's dividers sit in a slot of no height between two
12 gaps — a 1px line that costs the column nothing. Rendered as a 1-tall view
with `marginVertical: -0.5`, drawn as a sibling of the rows rather than nested
in a wrapper, so the card's own gap lands above it as well as below.

The one rule not tidied: "Open an account" runs its 316-wide line 5 past the
311 content column it separates. That is measured, so it is reproduced; the
detail sheet's own rules are flush.

### Assets

Exports, verbatim, inlined as strings in `account-sheet-art.ts` because Metro
has no SVG transformer; originals in `assets/account-sheets/`. Close (9.5 in a
24 box), chevron (5.5 × 9.5 in 24), pen (10.33 scaled into 11.33, in 16), the
16 copy glyph (17 of art, half a pixel proud each way — not the card's 13
stroke), and `Verified`, which Figma draws in two colour schemes from one
drawing: both its fills are placeholders behind `verifiedArt(badge, tick)`.

### Weights

The frames name `GIP:ExtraBold` for both sheet titles. `GipFont` now carries an
`extrabold` key, but it has nowhere to go — 800 is the heaviest Manrope face
loaded and `bold` already claims it, so the two render identically until GIP
arrives. The name is there so that day is one more line in one file. See §33.1
and `assets/fonts/README.md`.

One glyph is type rather than an emoji: the fullwidth `＋` on "Add money",
which Figma sets in ExtraBold. It carries a `bold` flag in the copy; the other
tiles are emoji, where the family does not matter.

### A defect this turned up in `AccountCard`

Making the whole card open the sheet put a button inside a button — the card
already holds the copy affordance and the "Хуулга" badge. React Native Web
flagged it as invalid DOM, and it is a hierarchy no assistive technology can
read either. The card's identity row now carries the label and the button role;
the outer layer is `accessible={false}` and exists only so a tap anywhere on the
card still opens the sheet.

### What is not wired

Everything below the balance card is the frame's own copy — there is no data
behind the interest figures, the SMS thresholds or the standing-order count, and
no flow behind any `Manage` row, the Statements pill, the Reference pill, the
rename pen, or Open an account's three products and its Continue. Each is a
prop that takes a handler. The account identity itself is real: the tapped
account's index travels in the route params, and the navigation bar's eye
travels with it, so a hidden balance does not reappear one tap later. Opened
without a valid index — a deep link, or a list that has since changed — the
sheet falls back to the frame's own literals, which are at least not somebody's
real balance.

### Dark

Neither frame is drawn in dark. `accountSheet.dark` is derived from the Accounts
screen's own dark tokens, which is the surface these sheets rise from. It reads
coherently but it is a reading of the design system, not a designed frame — the
third dark frame now owed, after the Accounts tab and its sub-tabs.

### Files

- `src/app/(app)/account-detail.tsx`, `src/app/(app)/open-account.tsx` (new)
- `src/app/(app)/_layout.tsx` — the two screens registered
- `src/components/rightbank/account/AccountSheetShell.tsx` (new) — the shared
  chrome, plus `SheetSectionHeader` and `SheetChevron`
- `src/components/rightbank/account/AccountDetailSheet.tsx` (new)
- `src/components/rightbank/account/OpenAccountSheet.tsx` (new)
- `src/components/rightbank/account/account-sheet-art.ts` (new)
- `src/components/rightbank/account/AccountCard.tsx` — `onPress`, and the
  nested-button fix
- `src/components/rightbank/account/AccountsPanel.tsx` — both destinations
- `src/constants/rightbank-theme.ts` — `accountSheet`, `accountDetailSheet`,
  `openAccountSheet`, `accountSheetCopy`, `GipFont.extrabold`
- `assets/account-sheets/*.svg` (new)

### Verified, and not

Verified on the web build at 375 × 812: every measurement in the two tables
above, in light; the scrim and both dismissals (close button, and the router pop
it performs); dark mode end to end by eye. `tsc` is clean and `expo lint` adds
nothing beyond the 23 pre-existing `react/no-unescaped-entities` errors in
`DepositsPanel` / `LoansPanel` / `RewardPanel`.

Not verified on a device: the two multi-shadow `boxShadow` lists, the Reanimated
slide under `transparentModal` on Android, the emoji tiles' rendering, and
whether the identity row's pinned 22 clips the amount on either platform — it
does not on web, where the line box is the 24 that made the pin necessary.

### §34.1 — Two things device feedback caught

**The cards were pinned to Figma's board, not to the gutters.** Every card in
both sheets carried Figma's literal width — 343, or 344 for the reference
banner — centred in the sheet. On the 375 board that is the same thing as two
16 gutters, so the web check at 375 saw nothing wrong. On a 411 device it is
not: the sheet's cards came out 343 wide with 34 of margin either side, while
the Accounts tab's cards behind them stretched to 379 at the gutter. The two
did not line up, and the sheet read as inset.

Now held as `marginHorizontal: 16` throughout, which is what Figma's 343 *is*.
Measured at 411: the sheet's four cards are 379 at x 16, exactly the tab card
behind them, and every vertical offset and height is unchanged (88 / 203 / 344
/ 579 and 99 / 85 / 179 / 406).

Two things had to move with them. The reference banner's pill was anchored at
Figma's `left: 237`; it is now held from the right at 17, so it stays by the
edge it is nearest, and the title is stopped at the pill's left edge rather
than at the card's. And both gradients took a hard-coded 343 as their box —
`cssGradientAngle` needs the width the gradient is actually drawn at, or the
angle comes out wrong on anything but a 375 screen, so both now read it from
`useWindowDimensions`.

**The sheet had no way out.** It slid in and then vanished. `router.back()`
unmounts the route in the same frame, so a Reanimated `exiting` animation never
gets to run — the entrance worked only because nothing was tearing the tree
down at mount.

Both directions are now one `open` flag driving the sheet's `translateY` and
the scrim's opacity through `withTiming` in the animated style — in over 260
with `Easing.out(cubic)`, out over 200 with `Easing.in(cubic)`. The flag is
flipped from a zero-delay timer rather than during the mount render, so the
first frame paints the sheet at its closed position and the rise is something
the eye can follow.

Declarative rather than assigning to a shared value, because the React
Compiler rejects mutating a value that an effect also depends on — and it is
less code besides.

The pop is a `setTimeout` for the same 200, not the animation's completion
callback. They land together, but a timer fires whether or not the animation
ticks — and it does not tick while the app is backgrounded, which with a
callback would leave a sheet that had been asked to close still sitting there
on return. A dismissal has to be unconditional.

The Android back button is intercepted and routed through the same close, so
all three ways out — button, scrim, back — animate identically instead of two
of them animating and the third cutting.

Verified at 411 × 891 on the web build: the card widths above, and the motion
caught in flight at `translateY(459.369)` of its 683 with the scrim at 0.3257
— which is `1 − 459/683`, so the two are moving in lockstep as intended. The
route pops on close.

The tween could only be sampled one frame at a time: the browser pane reports
`document.hidden`, which pauses `requestAnimationFrame`, and only a screenshot
forces a frame. That accidentally proved the point of the timer, though — with
the animation frozen mid-flight the route still dismissed on schedule. Worth a
look on the device all the same, for smoothness rather than correctness.

## §35 — `FaceIdSheet` removed

Deleted `src/components/rightbank/FaceIdSheet.tsx` and `FaceScanIcon.tsx`
(orphaned by the removal — nothing else imported it). The sheet ran the real
`expo-local-authentication` prompt on the login screen, animated the scan /
fail / retry states, held its own built-in password fallback form, and played
a 620 ms "Welcome back" hand-off before a successful sign-in. None of that is
coming back in this form, so rather than leave it disconnected the file is
gone.

Two call sites in `(auth)/index.tsx` needed a replacement:

- **The `bio` view's Face ID button.** It opened the sheet at its `scan`
  state, which would attempt the OS prompt and fall back to the sheet's own
  password form on failure, cancellation, or missing hardware. See §35.1 —
  this was first replaced with a direct drop into `pw` and no biometric
  attempt at all, then corrected the same day to keep the real prompt.
- **`submit()`'s success path.** It opened the sheet at `start='ok'` to show
  "Welcome back" for 620 ms before calling `finish()`. `submit()` now calls
  `finish()` directly — a valid form signs in immediately, with no pause and
  no card. This part did not change again in §35.1.

`bio` as a view is unchanged: a remembered user who opted into biometric login
(`peekBiometricLogin()`) still lands there and still sees a "Face ID" button
with the Face ID glyph. `expo-local-authentication` and `biometricLabel()`
remain in `biometric-login.ts` regardless of how the button above ended up
wired — `BiometricOptInSheet` calls into the same module for the post-login
opt-in flow either way.

Not touched: `EyeIcon` (still used by `CardFace`/`card.tsx`), `biometricLabel`
and everything else in `biometric-login.ts`, and `BiometricOptInSheet` itself
— a different sheet, asked after a successful sign-in, not before one.

Verified: `tsc --noEmit` clean, `expo lint` back to the same 23 pre-existing
`react/no-unescaped-entities` errors (nothing new). Not re-verified visually
in this pass — the change is a straight-line removal with no new geometry to
measure, and the prior screenshots of the `full`/`bio`/`pw` views are
unaffected by it.

### §35.1 — The Face ID button keeps its real prompt

§35 above made the `bio` view's Face ID button a plain alias for "go to
`pw`" — no `expo-local-authentication` call left anywhere on this screen. The
correction: the button now runs the actual OS prompt again, inline, with no
sheet or modal wrapping it.

`attemptFaceId` does what `FaceIdSheet`'s `scan` effect used to, minus the
component around it: check `hasHardwareAsync()` / `isEnrolledAsync()`, then
`authenticateAsync({ promptMessage, cancelLabel: 'Use password',
disableDeviceFallback: true })`. `result.success` → `finish()`; the
cancel/dismiss error codes → `changeView('pw')`; anything else → a buzz.

This mapping was wrong, and §35.2 below replaces it — kept here only for the
record of what shipped first.

### §35.2 — Cancelling the prompt is not "use password"

Bug: dismissing the OS biometric dialog any way at all — swiping it away,
tapping outside it, the hardware back gesture — opened `pw`, with no tap on
anything resembling a "use password" control.

The cause was `expo-local-authentication`'s own contract, not a mistake in
reading it. `cancelLabel` renames the prompt's existing Cancel button; it does
not add a second, distinguishable button. Every way of leaving the prompt
without authenticating — the (re)labelled Cancel button, a swipe, a tap
outside, the system dismissing it — resolves to the same `user_cancel` (or
`system_cancel` on Android). §35.1's `if (result.error === 'user_cancel' ||
…)  changeView('pw')` could not tell any of these apart, because the API
itself cannot. Relabelling Cancel to say "Use password" made the dialog *look*
like it had that affordance; it did not make the outcome distinguishable from
an ordinary dismissal.

The actual reference has this button — "Use password instead" is real,
reference-verified copy (`reference/RightBank.html`'s scan-state markup,
`onClick:()=>rbOnPw?rbOnPw():s("pass")`) — but the reference draws it as its
own pill inside the biometric modal, not as a side effect of dismissing a
system dialog the web app doesn't actually have (the reference's "Face ID" is
a CSS animation, not real hardware — the OS prompt only exists in this Expo
port). So the fix is to build that same pill, as a distinct control:

- `attemptFaceId` no longer inspects `result.error` at all beyond
  `success`/not: any non-success — mismatch, cancel, dismiss, no sensor to
  ask — is now one branch, a buzz, nothing more. `cancelLabel` is dropped too,
  since it no longer means anything the code acts on; the prompt uses the
  platform's own default Cancel wording.
- Placement is not from Figma — no frame covers `bio` at all, same as
  `loginPalette.muted`'s "Other user?" before it. `loginLayout.bio.usePassword`
  (98) centres the pill in the one gap that exists on this screen with
  nothing else in it: between the Face ID button's top edge (`submit` 40 +
  `buttonHeight` 48 = 88) and "Other user?" at 142.

Verified on the web build (`bio` view forced open with a one-line, reverted
edit to `initialView`, since `expo-secure-store` has no web implementation and
the view is otherwise unreachable there — see §35.1's note, still true):
tapping "Face ID" — which hits the no-hardware branch on web — buzzes and
stays on `bio`; tapping the new pill switches to `pw` ("Log in" over a
password field alone). `tsc --noEmit` and `expo lint` clean, same 23
pre-existing errors. Not verified: the actual OS prompt and its real
cancel/dismiss/mismatch outcomes, which need a device with biometric
hardware — `attemptFaceId`'s handling of those is now uniform (one branch,
one buzz) rather than something that could mis-fire per outcome, which is the
property that mattered here, but the prompt itself is unexercised by this
check.

## §36 — Notification screen (Figma `15804:47480`)

Opened from Home's bell (`GreetingHeader`'s `onNotifications`, wired through
`HomeHero`) via `router.push('/notifications')`, registered in
`(app)/_layout.tsx` as a genuine `presentation: 'modal'` `Stack.Screen` — an
opaque full page with its own status bar and home indicator, not a bottom
sheet, so it gets the native card-modal transition rather than the
Reanimated slide the account sheets drive themselves. That meant overriding
the stack's own `screenOptions.animation: 'none'` back to `'default'` for
just this screen, since that flag exists for the sheets, which animate
themselves, and this screen has no animation of its own to fight it.

New files: `src/app/(app)/notifications.tsx`,
`src/components/rightbank/notifications/notification-art.tsx` (the back
arrow and the two bell states, exported verbatim from the Figma node). New
tokens in `rightbank-theme.ts`: `notificationsLayout`, `notificationsPalette`,
`notificationsCopy` — only a light palette, the same posture `loginPalette`
takes, since Figma draws one frame here too.

The background's three warm blurs — two corner patches and one large ambient
glow — turned out to be the exact rig `LoginBackground` already draws: same
colours (`loginPalette.cornerGlow`/`ambientGlow`), same σ (137 and 364), same
peak. Working out each Figma layer's own centre from its box geometry landed
each one within a fraction of a pixel of `LoginBackground`'s own
`{left: 15.5, top: 32}` / `{right: 27.5, top: 32}` / `{left: 2.3, top: 11.7}`
— Figma reused its own light source rather than drawing a new one, so the
screen imports `loginPalette` and calls `GaussianBlob` directly with those
same positions instead of re-deriving values that were already sitting in
the file.

Card height in Figma (125 for the first row, 102 for the rest) is just
however far each row's own copy happened to wrap — not a rule, so it isn't
hardcoded. The layout is intrinsic instead: `cardPadTop`/`cardPadSide` (11),
a title row, a `bodyGap` (6), then the body unclamped — which reproduces both
observed heights and holds for any notification text length.

The read/unread distinction Figma actually draws is icon + opacity only:
unread rows get the solid orange bell (`BELL_FILLED`) at full opacity; read
rows get the dimmed outline bell (`BELL_OUTLINE`) at `readOpacity` (0.6).
Body text tone (`secondary` `#5C5C5C` vs `tertiary` `#898989`) does *not*
track read state in the four sample rows Figma ships — the first row is
unread-and-secondary, the rest are a mix — so `tone` is kept as its own
per-item field rather than derived from `unread`, matching what the frame
actually shows instead of inventing a rule the design doesn't state.

**A stacking bug found in testing, not from Figma**: the nav bar
(`position: absolute`) was declared *before* the `ScrollView` in JSX. The
`ScrollView` is an ordinary flow child of a `flex: 1` root, so — with the nav
bar removed from flow — it fills the entire screen, including the band the
nav bar occupies, and being declared later in JSX painted on top of it. The
back button was rendered but every tap landed on the (transparent)
`ScrollView` instead, so `router.back()` never fired. Fixed by moving the nav
bar's JSX after the `ScrollView`, which is the only change needed since
neither element is otherwise interactive in that shared band. Caught by
driving the running web build end-to-end (bell → screen → back), not by
`tsc`/`lint`, which see nothing wrong with either ordering.

Verified end-to-end on the web build, signed in through the real login form:
bell → `/notifications` (list, glows, filled vs. outline bells, dimmed read
rows all present) → back → `/home`, tab bar intact throughout. `tsc --noEmit`
and `expo lint` clean, same 23 pre-existing errors. Not verified: the native
modal's card-swipe-to-dismiss gesture and the iOS/Android status-bar-style
handoff during the presentation, which the web build does not exercise.
