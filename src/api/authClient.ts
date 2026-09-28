/**
 * Authentication transport — its own Axios instance on its own host.
 *
 * Kept separate from the APIM service clients for one concrete reason: the token
 * interceptor. A refresh call must never carry the access token it is trying to
 * replace, and a 401 from the identity provider must never trigger a refresh
 * (that recurses). Two instances make both impossible by construction instead
 * of by careful flag-passing.
 *
 * Dependency direction is `apimClient -> authClient -> tokenManager`.
 * Nothing here may import `apimClient`.
 */
import { create as createAxios, type AxiosInstance } from 'axios';

import { APIM_TOKEN_URL, normalizeError, REQUEST_TIMEOUT_MS } from './http';
import {
  clearTokens,
  expiresInToEpochMs,
  getDeviceId,
  peekRefreshToken,
  setTokens,
  type Tokens,
} from './tokenManager';
import { ApiError, type OAuthTokenResponse } from './types';

/**
 * Standard OAuth 2 paths. Change these two lines if the identity provider
 * mounts them elsewhere — they are not worth an env var each.
 */
const TOKEN_PATH = '/oauth2/token';
const REVOKE_PATH = '/oauth2/revoke';

export const authClient: AxiosInstance = createAxios({
  baseURL: APIM_TOKEN_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

// Errors only. There is no request interceptor here on purpose: the auth client
// is never authorized with a bearer token.
authClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    throw normalizeError(error);
  }
);

/** `application/x-www-form-urlencoded`, built by hand — RN's URLSearchParams is partial. */
function form(fields: Record<string, string | undefined>): string {
  return Object.entries(fields)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

async function requestTokens(fields: Record<string, string | undefined>): Promise<Tokens> {
  const deviceId = await getDeviceId();

  const { data } = await authClient.post<OAuthTokenResponse>(
    TOKEN_PATH,
    form(fields),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded', DeviceId: deviceId } }
  );

  if (!data?.access_token) {
    throw new ApiError({ message: 'The sign-in service returned no token.', code: 'AUTH_NO_TOKEN' });
  }

  const tokens: Tokens = {
    accessToken: data.access_token,
    // A provider that rotates refresh tokens sends a new one; one that does not
    // omits it, and the existing token stays valid.
    refreshToken: data.refresh_token ?? peekRefreshToken(),
    expiresAt: expiresInToEpochMs(data.expires_in),
  };

  await setTokens(tokens);
  return tokens;
}

/** Resource-owner password grant. */
export function login(username: string, password: string): Promise<Tokens> {
  return requestTokens({ grant_type: 'password', username, password, scope: 'openid' });
}

/**
 * Authorization-code + PKCE exchange.
 *
 * The browser half of the flow (opening the authorize URL and generating the
 * verifier/challenge pair) is not here — it needs `expo-auth-session` and
 * `expo-crypto`, neither of which is a dependency yet. This is the half that
 * belongs to the API layer: hand it the code and verifier you got back.
 */
export function exchangeAuthorizationCode(args: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<Tokens> {
  return requestTokens({
    grant_type: 'authorization_code',
    code: args.code,
    code_verifier: args.codeVerifier,
    redirect_uri: args.redirectUri,
  });
}

/* ------------------------------------------------------------------ *
 * Refresh — single-flight
 *
 * Four screens mounting at once produce four parallel gateway calls, and an
 * expired token makes all four try to refresh. Without this, the first refresh
 * rotates the token and the other three present a now-revoked one, which on a
 * provider with refresh-token rotation logs the user out. They share one
 * promise instead.
 * ------------------------------------------------------------------ */

let inFlightRefresh: Promise<string | null> | null = null;

/**
 * Returns the new access token, or `null` when the session cannot be renewed
 * (no refresh token, or the provider rejected it). A `null` means sign out.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const refreshToken = peekRefreshToken();
    if (!refreshToken) return null;

    try {
      const tokens = await requestTokens({ grant_type: 'refresh_token', refresh_token: refreshToken });
      return tokens.accessToken;
    } catch {
      // The refresh token is spent or revoked. Drop the whole session — leaving
      // a dead token in the keystore only produces another 401 next launch.
      await clearTokens();
      return null;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

/**
 * Revoke server-side, then clear locally.
 *
 * The local clear happens even if the network call fails: the user asked to be
 * signed out of this device, and that must not depend on connectivity.
 */
export async function logout(): Promise<void> {
  const refreshToken = peekRefreshToken();

  try {
    if (refreshToken) {
      await authClient.post(REVOKE_PATH, form({ token: refreshToken }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    }
  } catch {
    // Best effort.
  } finally {
    await clearTokens();
  }
}

export const AuthApi = { login, logout, refreshAccessToken, exchangeAuthorizationCode };
