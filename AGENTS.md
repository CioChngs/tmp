# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Web Reference → Expo Native Migration

## Objective

This project is migrating an existing React/HTML web application into a native Expo iOS/Android application.

The `/reference/RightBank.html` application is the **visual source of truth**.

The final Expo application must reproduce the reference application's UI as accurately as possible.

### Primary Goal

**Pixel-perfect visual parity with the reference takes priority over redesigning the interface.**

Do NOT redesign the interface.

Do NOT modernize the interface.

Do NOT make the interface "more native" unless explicitly requested.

Do NOT invent different spacing, typography, colors, icons, dimensions, layouts, or interactions when they can be determined from the reference.

The reference is the specification.

---

# Reference Application

Location:

`/reference/RightBank.html`

Treat this file as **READ-ONLY**.

Never modify the reference application while implementing the Expo application.

The reference may be a bundled/compiled React application. Do not assume that its source structure is clean or that its CSS structure directly maps to React Native.

Use the **rendered application** as the primary source of truth.

Source code is useful for understanding:

* content
* assets
* routes
* component relationships
* colors
* dimensions
* responsive behavior
* interactions

But the rendered result has priority over assumptions made from source code.

---

# Target Application

The target is a real native Expo application.

Prefer:

* React Native
* Expo APIs
* Expo Router where appropriate
* native components
* React Native styling
* local assets
* native navigation
* native gestures

Do NOT implement the entire application using a WebView or DOM component.

DOM/web components may only be used intentionally for individual parts that genuinely require web technology.

The final application should be a real native Expo application.

---

# Migration Philosophy

Migrate screen-by-screen.

Do not attempt a giant one-shot conversion.

For every screen:

1. Inspect the reference.
2. Understand its route and state.
3. Open/run the reference when possible.
4. Interact with it.
5. Determine the exact visual structure.
6. Determine dimensions and spacing.
7. Determine typography.
8. Determine colors.
9. Determine borders, radii, and shadows.
10. Identify images and icons.
11. Implement the screen in React Native.
12. Run the Expo application.
13. Compare the native result with the reference.
14. Identify visual differences.
15. Fix the largest differences first.
16. Repeat the comparison.
17. Do not move to the next screen until the current screen is sufficiently close.

---

# Phase 1 — Assess the Reference

Before implementing UI, inspect the entire reference application.

Create:

`migration-progress.md`

Document:

## Screen Inventory

For every screen record:

* route
* screen name
* entry point
* navigation destinations
* important states
* whether it scrolls
* whether it contains modals/sheets
* whether it contains keyboard input
* whether it contains animations
* important interactive elements

Example:

```text
Home

Route: /

Type: scrollable

Navigation:
  → Details
  → Search
  → Profile

States:
  - default
  - loading
  - empty
  - populated
```

## Asset Inventory

Identify:

* logos
* SVGs
* icons
* PNGs
* JPGs
* WebP
* fonts
* illustrations
* background images

Prefer reusing the exact reference assets whenever technically and legally possible.

Do not replace an exact asset with an approximate asset.

## Design-Token Inventory

Identify repeated:

* colors
* font sizes
* font weights
* line heights
* letter spacing
* spacing values
* corner radii
* border widths
* shadows
* component heights

Create centralized Expo design tokens for repeated values.

---

# Phase 2 — Establish the Visual Baseline

Choose one exact reference viewport as the primary validation target.

Use:

```text
REFERENCE_WIDTH = [SET THIS]

REFERENCE_HEIGHT = [SET THIS]
```

Do not randomly compare different device dimensions.

The first target must have a fixed viewport.

When responsive behavior exists in the reference, document it explicitly rather than inventing new behavior.

Account for:

* status bar
* navigation bar
* safe areas
* keyboard
* device orientation

The target viewport should be treated as the primary visual regression baseline.

---

# Phase 3 — Build the Native Foundation

Before implementing screens:

* verify Expo project configuration
* verify routing
* verify assets
* verify fonts
* establish design tokens
* establish reusable primitives
* establish safe-area behavior
* establish screen container behavior

Avoid unnecessary architectural refactors.

Do not change unrelated code.

---

# Phase 4 — Implement One Screen

Pick the highest-priority incomplete screen.

Do not implement the entire application at once.

For the selected screen, first analyze:

## Geometry

Determine:

* screen dimensions
* header height
* content width
* horizontal padding
* vertical spacing
* element widths
* element heights
* gaps
* alignment
* positioning

## Typography

Determine:

* font family
* font size
* font weight
* line height
* letter spacing
* text color
* text alignment

## Visual Styling

Determine:

* background colors
* borders
* border widths
* corner radius
* shadows
* opacity
* gradients
* images
* icons

## Behavior

Determine:

* scrolling
* touch behavior
* pressed states
* disabled states
* loading states
* keyboard behavior
* modals
* sheets
* navigation

Then implement the screen natively.

---

# Phase 5 — Visual Validation

Never consider a screen complete simply because it compiles.

The validation loop is:

```text
REFERENCE
    ↓
IMPLEMENT
    ↓
RUN EXPO
    ↓
CAPTURE SCREEN
    ↓
COMPARE
    ↓
IDENTIFY DIFFERENCES
    ↓
FIX
    ↓
CAPTURE AGAIN
    ↓
COMPARE AGAIN
```

When possible, compare screenshots at the same viewport dimensions.

Prioritize differences in this order:

1. overall geometry
2. positioning
3. spacing
4. component dimensions
5. typography
6. colors
7. borders
8. corner radius
9. shadows
10. icons and symbols
11. images
12. animations

Do not make many unrelated changes at once.

Fix a small group of measurable differences, then compare again.

---

# Pixel-Perfect Rules

When a measurement can be determined from the reference, use the measured value.

Do not use arbitrary approximations.

Bad:

```text
padding: 20 because it looks about right
```

Better:

```text
reference horizontal padding = 16
native horizontal padding = 16
```

If the reference uses a 14px radius, do not automatically convert it to a preferred native radius.

If the reference uses a particular icon, Unicode character, or emoji, reproduce the same symbol or asset used by the reference.

If the reference uses a particular font, do not substitute the system font without a deliberate reason.

When there is a conflict between common development conventions and the reference appearance, prioritize the reference appearance unless doing so is technically impossible.

---

# Icons and Symbols

The reference application's actual implementation is the source of truth.

**Use exactly what the reference HTML/application uses whenever possible.**

If the reference uses:

* Unicode emoji → use the same Unicode emoji
* Unicode characters → use the same Unicode characters
* SVG → use the same SVG
* PNG/JPG/WebP → use the same asset
* Icon library → use the same icon/library when practical
* CSS-generated symbol → reproduce the same visual result in React Native

Do NOT automatically replace Unicode emoji or characters with SVGs, icon libraries, or platform-specific icons.

For example, if the reference contains:

```tsx
<Text>🔒</Text>
```

the Expo implementation should use the same `🔒` character.

If the reference contains:

```tsx
<Text>⚡</Text>
```

the Expo implementation should use the same `⚡` character.

The objective is **visual and behavioral parity with the reference**, not adherence to a preferred icon implementation strategy.

## Platform Rendering

Unicode emoji may render differently across platforms.

However, for this project, the first priority is to reproduce what the reference uses.

Do not change an emoji or Unicode character simply because another representation may be more consistent across platforms.

If platform-specific rendering creates a visual mismatch, document the mismatch and investigate ways to reproduce the reference appearance while preserving the reference's actual symbol where possible.

Never substitute an arbitrary "similar-looking" icon without first checking the reference implementation.

---

# Typography

Typography is part of the visual specification.

Do not approximate:

* font family
* weight
* size
* line height
* letter spacing

If the reference uses a custom font, determine whether the font can be loaded into Expo and use it.

Pay particular attention to:

* heading dimensions
* button text
* text wrapping
* baseline alignment
* multiline text
* vertical centering

Do not assume that matching `fontSize` alone produces matching typography.

---

# Images

Prefer the exact image assets from the reference.

Do not recreate an existing asset with a different image.

Preserve:

* aspect ratio
* cropping
* object positioning
* dimensions
* border radius
* opacity

If the reference uses an image asset that already exists in the project, reuse it rather than creating a replacement.

---

# Responsive Behavior

Do not invent responsive behavior.

First determine what the reference actually does.

If the reference has different layouts at different widths, reproduce those breakpoints intentionally.

If it does not, do not introduce unnecessary responsive complexity.

The primary target viewport must always remain visually accurate.

---

# Safe Areas

**Every screen, sheet, modal and overlay must inset its own content from the safe area.**
This applies to all future work, not only to the screens already migrated.

The app draws edge to edge. Nothing shrinks the window for you: the status bar, the notch or
punch-hole, the iOS home indicator and the Android navigation bar all sit *on top of* what you draw.
Content that ignores them is not "slightly tight" — it is unreachable, because the system bar takes
the touch.

## The rule

Use `useSafeAreaInsets()` from `react-native-safe-area-context`. `SafeAreaProvider` is mounted once
at the root with `initialWindowMetrics`, so the insets are correct on the very first frame; do not
mount another one.

* Anything anchored to the **top** — a header, a greeting row, a title bar — starts at
  `insets.top + <the design's offset below the status bar>`.
* Anything anchored to the **bottom** — a button row, a tab bar, a sheet's actions — ends at
  `insets.bottom + <the design's gap>`, never at the design's gap alone.
* A **scroll view** pads its content past whatever floats over it:
  `paddingBottom: insets.bottom + <bar height + gap>`.
* A **full-screen overlay** (scrim, modal, interstitial) pads by the insets too, or takes them as a
  floor: `Math.max(insets.top, <design padding>)`.

Do **not** use `<SafeAreaView>`. It only pads, so it cannot do the one thing this app needs
constantly — let a background run under a system bar while its content stays clear of it.

## Reading a Figma frame's bottom offsets

Figma's frames are iPhone 13 mini boards: the bottom **34** is the home-indicator band, and every
bottom offset in the design is measured from the bottom of the *frame*, not from the top of that
band. So a control drawn at 40 clears the band by 6, and one drawn at 29 sits 5 *inside* it.

That overlap is deliberate and fine on iOS — the indicator is a hairline pill near the bottom of the
band and content may share the rest. It is not fine on Android, where the navigation bar is 48 tall
and opaque. Reproduce the design's offset, then guarantee the clearance:

```ts
const figmaLift = Math.max(0, insets.bottom - REFERENCE_SAFE_BOTTOM); // 34
const lift = figmaLift > 0
  ? Math.max(figmaLift, insets.bottom + MIN_CLEAR - lowestControlOffset)
  : figmaLift;
```

A bottom inset deeper than 34 means an opaque bar rather than an indicator. `MIN_CLEAR` is the
smallest gap the design itself uses, so nothing is invented — see
`loginLayout.minBottomClear` and `(auth)/index.tsx`.

## Before calling a screen done

Check it on all four: an iPhone with a 34 indicator, an Android device with a 48 three-button bar,
an Android device with a ~24 gesture bar, and a device with no inset at all. The lowest control must
clear the inset on every one of them, and the top content must clear the status bar.

---

# Components

Create reusable components when there is genuine repetition.

Examples:

```text
Button
Card
Header
Avatar
Input
ListItem
BottomSheet
IconButton
Section
```

Do not prematurely create a large design-system abstraction for components that are only used once.

Visual accuracy is more important than abstraction.

When a component is genuinely shared, ensure that changes to the shared component do not unintentionally alter already-completed screens.

---

# Data and Logic

Separate visual migration from backend migration where possible.

First reproduce:

* screen structure
* layout
* visuals
* navigation
* interactions

Then connect:

* API
* authentication
* persistence
* storage
* real data

Do not rewrite backend behavior unnecessarily.

If real backend functionality is already present in the Expo project, preserve it unless the migration requires a change.

---

# Navigation

Map the reference application's navigation to Expo Router/native navigation.

Preserve the user's navigation flow.

Do not redesign navigation unless explicitly requested.

Navigation transitions and screen hierarchy should reproduce the reference behavior as closely as practical.

---

# Web → React Native Mapping

Translate concepts rather than blindly translating HTML.

Examples:

```text
div               → View
span              → Text
button            → Pressable / Button
img               → Image
input             → TextInput
textarea          → TextInput with multiline
select            → appropriate native selection UI
scroll container  → ScrollView / FlatList
```

Do not mechanically reproduce HTML nesting when a simpler native hierarchy produces the same visual result.

Do not copy browser CSS blindly.

Translate the visual intent into React Native styles.

---

# Important Web Differences

Watch carefully for:

* CSS box sizing
* flexbox differences
* grid
* absolute positioning
* percentage dimensions
* viewport units
* CSS variables
* pseudo-elements
* overflow behavior
* sticky positioning
* browser text rendering
* shadows
* filters
* gradients
* web fonts
* hover states

For every unsupported web behavior, find the closest native implementation that preserves the reference appearance and behavior.

When a web behavior has no direct React Native equivalent, prioritize the resulting visual and interaction behavior rather than trying to reproduce the underlying web implementation.

---

# Web Reference Inspection

When inspecting the reference, use both source code and the rendered application.

Source inspection is useful for discovering:

* exact text
* assets
* class names
* CSS values
* colors
* routes
* component structure
* event handlers
* states

Rendered inspection is essential for determining:

* actual dimensions
* actual positioning
* text wrapping
* visual hierarchy
* responsive behavior
* interaction states
* resulting appearance

If source code and rendered behavior appear inconsistent, trust the rendered behavior.

Do not assume a CSS declaration produces the expected result without verifying the rendered output.

---

# Visual Comparison Discipline

When comparing the Expo implementation to the reference:

Do not rely only on subjective impressions such as:

* "looks close"
* "looks good"
* "seems aligned"
* "probably the same"

Instead identify concrete differences whenever possible.

Examples:

```text
Reference header height: 64
Expo header height: 72
Difference: +8
```

```text
Reference left padding: 16
Expo left padding: 20
Difference: +4
```

```text
Reference card radius: 12
Expo card radius: 16
Difference: +4
```

Fix measurable differences before making subjective stylistic adjustments.

---

# Screen Completion Rules

Do not mark a screen as complete simply because:

* it compiles
* it launches
* navigation works
* the layout is approximately correct

A screen must go through visual validation.

If a screen still has obvious visual differences from the reference, keep working on that screen.

Do not move to the next screen merely to increase the number of completed screens.

---

# Performance

Do not sacrifice the whole application architecture for pixel matching.

Avoid:

* unnecessary WebViews
* unnecessary re-renders
* huge images
* duplicated assets
* excessive absolute positioning
* giant monolithic components

But do not prematurely optimize visual code before achieving parity.

If a performance optimization changes the visual result, verify the screen again against the reference.

---

# Migration Progress

Maintain:

`migration-progress.md`

Each screen should have a status:

```text
[ ] analyzed
[ ] structure implemented
[ ] navigation implemented
[ ] visual pass 1
[ ] visual pass 2
[ ] typography verified
[ ] assets verified
[ ] interactions verified
[ ] final comparison
[ ] complete
```

Only mark a screen complete after visual verification.

The progress file should be updated as the migration progresses.

Do not fabricate completion status.

---

# Working Rules for Claude

Before changing code:

1. Inspect existing code.
2. Inspect the reference.
3. Understand why the current code exists.
4. Determine the smallest appropriate change.
5. Make the change.
6. Verify the result.

Do NOT:

* rewrite the entire project unnecessarily
* change dependencies without reason
* redesign UI
* invent components
* invent assets
* invent colors
* invent spacing
* remove working functionality
* modify the reference project
* replace reference symbols without checking the reference
* introduce unnecessary abstractions
* perform unrelated refactors

When uncertain about visual behavior, inspect the reference rather than guessing.

When uncertain about an implementation detail, prefer the simplest native Expo implementation that reproduces the reference.

When there are multiple technically valid implementations, choose the one that produces the closest visual and behavioral result to the reference.

---

# Change Discipline

Make changes incrementally.

Do not modify many unrelated files or systems during a visual refinement pass.

When fixing a visual issue:

1. Identify the cause.
2. Make the smallest change that addresses it.
3. Re-run the affected screen.
4. Compare against the reference.
5. Verify that previously completed screens were not unintentionally changed.

Avoid large refactors during screen-level visual refinement.

---

# Definition of Done

A screen is complete when:

* it renders correctly
* navigation works
* interactions work
* scrolling works
* keyboard behavior works where applicable
* assets match
* typography matches
* dimensions match
* spacing matches
* colors match
* borders match
* radii match
* shadows match
* icons and symbols match
* important states match
* the screen has been visually compared against the reference
* no obvious unresolved visual differences remain

The goal is not "similar."

The goal is **visual parity with the reference**.

