/**
 * "Who last signed in on this device" — the one fact that decides whether the
 * login screen opens at the full form or the password-only form.
 *
 * Deliberately *not* part of `tokenManager`. Tokens are a live session and are
 * destroyed on sign-out; this outlives sign-out on purpose, which is the whole
 * point of it. Keeping them in separate modules means `logout()` clearing the
 * keystore can never accidentally take the remembered user with it.
 *
 * Only a username is stored. No password, no token, no PIN — a remembered
 * username is a convenience, and the credential that proves it is still typed
 * every time.
 *
 * It goes in the OS keystore anyway rather than AsyncStorage: a username is a
 * customer identifier, and leaving it in plaintext on disk tells anyone with
 * the device who banks here.
 *
 * Mirrored in a module cache so the login screen can read it synchronously at
 * mount. Call `loadRememberedUser()` once at startup; the root layout already
 * awaits storage before first paint, so there is no view flash.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'rightbank.auth.rememberedUser';

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  // Same posture as the session tokens: this device only, never restored to a
  // new phone from a backup.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * `displayName` is what the greeting prefers when it is known.
 *
 * It is optional because nothing supplies it yet — the sign-in API is not wired
 * up, so today only the typed username exists. When a real login response
 * arrives with the customer's name on it, `rememberUser` takes it as a second
 * field and the greeting improves on its own; no caller has to change shape.
 */
export type RememberedUser = {
  /** The identifier the user types to sign in. */
  username: string;
  /** Human name for "Сайн уу, …", when the server has told us one. */
  displayName?: string;
};

/**
 * `expo-secure-store` has no web implementation. Web is a dev preview here, not
 * a shipping target, and the alternative — AsyncStorage — is plaintext, which
 * is exactly what this module exists to avoid. So web simply does not remember,
 * and always shows the full form.
 */
const supported = Platform.OS !== 'web';

let cache: RememberedUser | null = null;

/** Hydrate the cache. Never rejects — unreadable storage means "no one yet". */
export async function loadRememberedUser(): Promise<RememberedUser | null> {
  if (!supported) return null;

  try {
    const raw = await SecureStore.getItemAsync(KEY, SECURE_OPTIONS);
    cache = raw ? (JSON.parse(raw) as RememberedUser) : null;
  } catch {
    // A keystore that will not open, or a value written by an older shape.
    cache = null;
  }

  return cache;
}

/** The cached value, without touching storage. */
export function peekRememberedUser(): RememberedUser | null {
  return cache;
}

/** Called after a successful sign-in. */
export async function rememberUser(user: RememberedUser): Promise<void> {
  if (!supported) return;

  // Cache first, so the next render is right even if the write is slow.
  cache = user;

  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(user), SECURE_OPTIONS);
  } catch {
    // Costs the user one extra username next launch. Not worth throwing.
  }
}

/** Called by "Өөр хэрэглэгч?" — this device is no longer anyone's in particular. */
export async function forgetRememberedUser(): Promise<void> {
  cache = null;
  if (!supported) return;

  try {
    await SecureStore.deleteItemAsync(KEY, SECURE_OPTIONS);
  } catch {
    // Already gone, or unreadable. Either way the cache is clear.
  }
}
