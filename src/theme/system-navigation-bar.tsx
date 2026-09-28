/**
 * The Android system navigation bar, themed from the app's own Light / Knight
 * mode rather than the OS's.
 *
 * With `enforceContrast: true` on the `expo-navigation-bar` plugin — which is
 * what `app.json` asks for — this is a single decision, not two. Android draws
 * its own contrast scrim behind the buttons and picks that scrim's colour from
 * the same window flag that picks the button colour, so one call themes the
 * whole bar:
 *
 * | `setStyle` | Flag | Scrim | Buttons |
 * | --- | --- | --- | --- |
 * | `'dark'` | light appearance | near-white | dark |
 * | `'light'` | dark appearance | near-black | light |
 *
 * Light mode therefore wants `'dark'` and Knight wants `'light'`. The library's
 * `style` names the *content* colour rather than the bar's, which reads
 * backwards often enough to be worth not repeating — so the API here is named
 * after the thing being chosen: `buttons`, `'black'` or `'white'`.
 *
 * The mapping is spelled out rather than handed to the library's `'auto'` or
 * `'inverted'`, because both of those resolve against the **OS** colour scheme,
 * and this app's theme is a persisted in-app choice that deliberately does not
 * follow it.
 *
 * `NavigationBar.setStyle` is used in preference to the declarative
 * `<NavigationBar style=… />`: the component defers every update through a
 * `setImmediate` and merges it through a module-level entries stack, and in this
 * app that never reached the native module.
 */
import { NavigationBar } from 'expo-navigation-bar';
import { useIsFocused } from 'expo-router/react-navigation';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useAppMode } from '@/theme/app-mode';

export type NavigationBarButtons = 'black' | 'white';

const STYLE = { black: 'dark', white: 'light' } as const;

/** The theme's choice, and the focused screens stacked on top of it. */
let themeButtons: NavigationBarButtons = 'black';
const overrides: { buttons: NavigationBarButtons }[] = [];

/**
 * The topmost override wins; with none, the theme does.
 *
 * Sent twice, the first send deliberately being the wrong value. `setStyle`
 * keeps a module-level record of what it last sent and drops a repeat, and that
 * record is written only by JS — so it goes stale whenever the window's
 * appearance changes natively, and the call it then drops is precisely the one
 * that would have corrected it. That is not hypothetical here: React Native sets
 * this flag itself at startup (from the OS scheme, not ours), and
 * `expo-image-picker`'s crop activity, which the scanner opens, sets it for its
 * own window.
 *
 * Both calls hop to the main thread in order and land in the same batch, so
 * nothing renders between them.
 */
function apply() {
  const top = overrides[overrides.length - 1];
  const wanted = STYLE[top ? top.buttons : themeButtons];

  if (Platform.OS === "android") {
    NavigationBar.setStyle(wanted === 'dark' ? 'light' : 'dark');
    NavigationBar.setStyle(wanted);
  }
}

/** Mount once, at the root, inside `AppModeProvider`. */
export function SystemNavigationBar() {
  const { mode } = useAppMode();
  const buttons: NavigationBarButtons = mode === 'dark' ? 'white' : 'black';

  useEffect(() => {
    themeButtons = buttons;
    apply();
  }, [buttons]);

  // Coming back from another activity can leave someone else's choice in place.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') apply();
    });
    return () => sub.remove();
  }, []);

  return null;
}

/**
 * Mount inside a screen whose background does not follow the theme — the
 * scanner is always a dark camera, My QR always a light page — so the bar does
 * not theme itself into invisibility against a screen that ignored the theme.
 *
 * Focus-gated, not mount-gated: these are tabs, and a tab stays mounted once
 * visited, so an override tied to mounting would keep applying from behind
 * whatever tab you moved to. Leaving the screen pops it and the theme's own
 * choice comes back.
 */
export function ScreenNavigationBar({ buttons }: { buttons: NavigationBarButtons }) {
  const focused = useIsFocused();

  useEffect(() => {
    if (!focused) return;

    // The entry is the identity, so a screen only ever removes its own — two
    // screens asking for the same colour do not cancel each other out.
    const entry = { buttons };
    overrides.push(entry);
    apply();

    return () => {
      const i = overrides.indexOf(entry);
      if (i !== -1) overrides.splice(i, 1);
      apply();
    };
  }, [focused, buttons]);

  return null;
}
