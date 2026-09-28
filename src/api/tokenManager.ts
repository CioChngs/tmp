/**
 * The only thing that touches credential storage.
 *
 * Tokens live in the OS keystore (Keychain on iOS, EncryptedSharedPreferences
 * on Android) rather than AsyncStorage, which is plaintext on disk and readable
 * on a rooted or jailbroken device. `expo-secure-store` has no web
 * implementation, so web falls back to AsyncStorage — acceptable for the dev
 * preview, and web is not a shipping target for this app.
 *
 * Everything is mirrored in a module-level cache, because the request
 * interceptor runs on every call and a keystore read is a bridge hop. Call
 * `loadTokens()` once at startup; after that `peekAccessToken()` is synchronous.
 *
 * This module imports no other API file. That is deliberate — `authClient` and
 * `gatewayClient` both depend on it, so it has to be a leaf or the refresh path
 * would be circular.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { randomId } from './http';

const ACCESS_TOKEN_KEY = 'rightbank.auth.accessToken';
const REFRESH_TOKEN_KEY = 'rightbank.auth.refreshToken';
const TOKEN_EXPIRY_KEY = 'rightbank.auth.tokenExpiry';
const DEVICE_ID_KEY = 'rightbank.device.id';

/**
 * Stored as four keys rather than one JSON blob: Android's backing store warns
 * above ~2KB per entry, and two JWTs together can cross that.
 */
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  // Not restored to a new device from a backup, and unreadable while locked.
  // Correct for a banking session — it should not outlive the device.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const isWeb = Platform.OS === 'web';

async function readKey(key: string): Promise<string | null> {
  try {
    return isWeb
      ? await AsyncStorage.getItem(key)
      : await SecureStore.getItemAsync(key, SECURE_OPTIONS);
  } catch {
    // A keystore that will not open is indistinguishable from "not signed in".
    return null;
  }
}

async function writeKey(key: string, value: string | null): Promise<void> {
  try {
    if (value === null) {
      await (isWeb ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key, SECURE_OPTIONS));
    } else {
      await (isWeb
        ? AsyncStorage.setItem(key, value)
        : SecureStore.setItemAsync(key, value, SECURE_OPTIONS));
    }
  } catch {
    // Losing the write costs the user a re-login next launch; it must not throw
    // into the middle of a request.
  }
}

export type Tokens = {
  accessToken: string;
  refreshToken: string | null;
  /** Epoch milliseconds. `null` when the server did not send `expires_in`. */
  expiresAt: number | null;
};

let cache: Tokens | null = null;
let loaded = false;
let deviceId: string | null = null;

/**
 * Hydrate the cache from the keystore. Safe to call more than once; only the
 * first call reads. Never rejects — an unreadable keystore means "signed out".
 */
export async function loadTokens(): Promise<Tokens | null> {
  if (loaded) return cache;

  const [accessToken, refreshToken, expiry] = await Promise.all([
    readKey(ACCESS_TOKEN_KEY),
    readKey(REFRESH_TOKEN_KEY),
    readKey(TOKEN_EXPIRY_KEY),
  ]);

  cache = accessToken ? { accessToken, refreshToken, expiresAt: expiry ? Number(expiry) : null } : null;
  loaded = true;
  return cache;
}

/** The cached tokens, without touching storage. Null before `loadTokens` resolves. */
export function peekTokens(): Tokens | null {
  return cache;
}

export function peekAccessToken(): string | null {
  return cache?.accessToken ?? null;
}

export function peekRefreshToken(): string | null {
  return cache?.refreshToken ?? null;
}

/**
 * True when the access token is absent or within `skewMs` of expiring.
 *
 * The skew exists so a token that dies in flight does not cost a round-trip: a
 * request that would arrive just after expiry refreshes before it is sent.
 */
export function isAccessTokenExpired(skewMs = 30_000): boolean {
  if (!cache) return true;
  if (cache.expiresAt === null) return false; // no expiry known — let the 401 decide
  return Date.now() >= cache.expiresAt - skewMs;
}

export async function setTokens(tokens: Tokens): Promise<void> {
  // Cache first: the UI and the next request see the new token immediately,
  // and a slow keystore write cannot delay them.
  cache = tokens;
  loaded = true;

  await Promise.all([
    writeKey(ACCESS_TOKEN_KEY, tokens.accessToken),
    writeKey(REFRESH_TOKEN_KEY, tokens.refreshToken),
    writeKey(TOKEN_EXPIRY_KEY, tokens.expiresAt === null ? null : String(tokens.expiresAt)),
  ]);
}

export async function clearTokens(): Promise<void> {
  cache = null;
  loaded = true;

  await Promise.all([
    writeKey(ACCESS_TOKEN_KEY, null),
    writeKey(REFRESH_TOKEN_KEY, null),
    writeKey(TOKEN_EXPIRY_KEY, null),
  ]);
  // The device id is intentionally not cleared — it identifies the install, not
  // the person, and the backend uses it to recognise a returning device.
}

/**
 * Stable per-install identifier, minted on first use and kept in the keystore.
 * Sent on every gateway call so the backend can bind a session to a device.
 */
export async function getDeviceId(): Promise<string> {
  if (deviceId) return deviceId;

  const stored = await readKey(DEVICE_ID_KEY);
  if (stored) {
    deviceId = stored;
    return stored;
  }

  const minted = randomId();
  deviceId = minted;
  await writeKey(DEVICE_ID_KEY, minted);
  return minted;
}

/** The cached device id, or `null` before `getDeviceId()` has resolved once. */
export function peekDeviceId(): string | null {
  return deviceId;
}

/** `expires_in` (seconds, per OAuth 2) → absolute epoch ms. */
export function expiresInToEpochMs(expiresIn: number | undefined): number | null {
  return typeof expiresIn === 'number' && Number.isFinite(expiresIn)
    ? Date.now() + expiresIn * 1000
    : null;
}
