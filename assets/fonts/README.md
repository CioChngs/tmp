# GIP

The typeface the Figma design system specifies. It is **not in this repo** —
Manrope stands in for it, through `GipFont` in `src/constants/rightbank-theme.ts`.

GIP is not a Google font and is not on any public CDN, so it cannot be fetched;
the files have to come from whoever holds the licence. Drop them here and the
substitution goes away.

## What to drop here

Static `.ttf` or `.otf`, one file per weight, named exactly:

| File | Figma names it |
| --- | --- |
| `GIP-Regular.ttf` | `GIP:Regular` |
| `GIP-Medium.ttf` | `GIP:Medium` |
| `GIP-SemiBold.ttf` | `GIP:SemiBold` |
| `GIP-Bold.ttf` | `GIP:Bold` |

Those four are every weight the migrated frames use. A variable font works too
— say so, because it is loaded differently.

Check before handing them over that the files carry the Mongolian Cyrillic the
app sets: `ү ө Ү Ө`. A Latin-only cut will fall back to the system face for
exactly the words that matter most.

## What changes when they land

Two edits, and nothing else in the app:

1. `src/app/_layout.tsx` — add them to the `useFonts` call beside Manrope.
2. `src/constants/rightbank-theme.ts` — point `GipFont` at them.

`GipFont` is the only place any screen names a GIP weight, so every screen
already routed through it picks the real font up with no further change. The
weight ladder it currently encodes (each GIP weight is one Manrope rung
heavier — see migration-progress.md §33.1) exists only to survive the
substitution and disappears with it: `GipFont.bold` becomes `GIP-Bold`.
