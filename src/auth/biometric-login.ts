/**
 * "May this device sign in with its biometrics?" — one boolean, plus the
 * capability query the answer only makes sense alongside.
 *
 * Nothing secret is stored. A fingerprint or face template never leaves the
 * secure enclave, and this module deliberately does not hold a password, a
 * token or a PIN either: the flag records a *preference*, and the credential
 * that proves it is the OS prompt, asked fresh every time. So the worst an
 * attacker learns from reading it is that the owner of the phone likes Face ID.
 *
 * It goes in the keystore anyway, for the same reason
 * [remembered-user.ts](./remembered-user.ts) does: this outlives sign-out on
 * purpose, and a security preference that anyone can flip by editing a plaintext
 * file is not a security preference. Kept out of `tokenManager` so `logout()`
 * clearing the session can never take it with it.
 *
 * Mirrored in a module cache so the login screen can read it synchronously on
 * its first render — the root layout awaits `loadBiometricLogin()` before first
 * paint, so a returning user never sees the password form flash before the
 * Face ID one.
 */
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'rightbank.auth.biometricLogin';

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  // Same posture as the session tokens and the remembered username: this device
  // only. Biometrics are enrolled per device, so a preference restored onto a
  // new phone from a backup would be a promise about hardware that is not there.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/** `expo-secure-store` has no web implementation; see `remembered-user.ts`. */
const supported = Platform.OS !== 'web';

let cache = false;

/** Hydrate the cache. Never rejects — unreadable storage means "not enabled". */
export async function loadBiometricLogin(): Promise<boolean> {
  if (!supported) return false;

  try {
    cache = (await SecureStore.getItemAsync(KEY, SECURE_OPTIONS)) === '1';
  } catch {
    cache = false;
  }

  return cache;
}

/** The cached value, without touching storage. */
export function peekBiometricLogin(): boolean {
  return cache;
}

/**
 * Turn it on or off. Writes the cache first so the next render is right even if
 * the keystore is slow, and swallows a failed write: the cost is one more
 * password on the next launch, which is not worth throwing over.
 */
export async function setBiometricLogin(on: boolean): Promise<void> {
  cache = on;
  if (!supported) return;

  try {
    if (on) await SecureStore.setItemAsync(KEY, '1', SECURE_OPTIONS);
    else await SecureStore.deleteItemAsync(KEY, SECURE_OPTIONS);
  } catch {
    // Keep the in-memory answer; storage will be re-read next launch.
  }
}

/** What this device's biometrics are called, for copy that names them. */
export function biometricLabel(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'Iris';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  }
  return 'Biometric sign-in';
}

export type BiometricCapability = {
  /** Hardware present *and* something enrolled on it. */
  available: boolean;
  label: string;
  /** The two halves, kept apart so a suppression can say which one failed. */
  hasHardware: boolean;
  enrolled: boolean;
};

/**
 * Both halves of "can this device do it": the sensor existing is not enough,
 * because an enrolled face is what the prompt actually matches against. Offering
 * to enable biometric login on a phone with no enrolled finger would enable a
 * sign-in that can never succeed.
 */
export async function queryBiometricCapability(): Promise<BiometricCapability> {
  if (!supported) {
    return { available: false, label: biometricLabel([]), hasHardware: false, enrolled: false };
  }

  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    return {
      available: hasHardware && enrolled,
      label: biometricLabel(types),
      hasHardware,
      enrolled,
    };
  } catch {
    // A module that will not answer is a device that cannot be relied on for
    // sign-in. Treated as "no", never as "probably fine".
    return { available: false, label: biometricLabel([]), hasHardware: false, enrolled: false };
  }
}

/**
 * Prove the user can pass the prompt before promising them they will not need
 * their password again.
 *
 * `disableDeviceFallback` matters here: the passcode sheet would let someone
 * enable *biometric* login without ever showing a biometric, which is not the
 * thing being switched on.
 */
export async function confirmBiometric(label: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Enable ${label} for RightBank`,
      cancelLabel: 'Одоо биш',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
