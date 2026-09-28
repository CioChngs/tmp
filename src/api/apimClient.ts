/**
 * Business transport — one Axios instance per published APIM API.
 *
 * APIM addresses a service by context and version rather than by a single
 * gateway endpoint, so the base URL is built per service:
 *
 *   https://apigw-devtest.xac0000.mn / BANNER_CONTENT / 1.0
 *   └── APIM_GATEWAY_URL             └── context      └── version
 *
 * A feature module creates its instance once and then uses plain REST:
 *
 *   const bannerInstance = createApimClient(APIM_BANNER_CONTEXT, APIM_BANNER_VERSION);
 *   await bannerInstance.get('/banners');
 *
 * Every instance shares the same interceptors, so the access token, the retry
 * on 401 and the error normalization are written once. These are the only
 * clients that carry the token; `authClient` deliberately does not.
 */
import {
  create as createAxios,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { refreshAccessToken } from './authClient';
import {
  APIM_GATEWAY_URL,
  normalizeError,
  notifyUnauthorized,
  REQUEST_TIMEOUT_MS,
} from './http';
import {
  clearTokens,
  isAccessTokenExpired,
  peekAccessToken,
  peekRefreshToken,
} from './tokenManager';

/** Set on a config that has already been retried, so a retry can never loop. */
type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export function createApimClient(context: string, version: string): AxiosInstance {
  const client = createAxios({
    baseURL: APIM_GATEWAY_URL.replace(/\/+$/, ''),
    // baseURL: `${APIM_GATEWAY_URL.replace(/\/+$/, '')}/${context}/${version}`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  /* -- request: bearer token ----------------------------------------- */

  // No custom headers here. The gateway answers a preflight with
  //   Access-Control-Allow-Headers: authorization, Access-Control-Allow-Origin,
  //   Content-Type, SOAPAction, apikey, Internal-Key, Authorization, ApiKey
  // and a browser rejects the whole request if it carries any header outside
  // that list. The `RequestId` / `DeviceId` pair this used to send came from the
  // old MI envelope; APIM does not declare them, so on web they turned every
  // call into a blocked preflight — indistinguishable from being offline.
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    // Renew before sending rather than after a 401. Saves a round-trip on the
    // common case of a token that expired while the app was backgrounded.
    if (isAccessTokenExpired() && peekRefreshToken()) {
      await refreshAccessToken();
    }

    const token = peekAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  });

  /* -- response: refresh-and-retry once, then normalize -------------- */

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      // Read before attempting a refresh: a failed refresh clears the keystore,
      // so afterwards there is no way to tell "the session died" from "there
      // never was one".
      const hadSession = Boolean(peekAccessToken() || peekRefreshToken());
      const apiError = normalizeError(error);
      const config = (error as { config?: RetryableConfig }).config;

      if (apiError.status === 401 && config && !config._retried) {
        config._retried = true;

        // Shared promise — parallel 401s produce one refresh, not one each.
        const token = await refreshAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return client(config);
        }
      }

      // Only a 401 that ended a real session is a sign-out. A 401 on a call
      // made with no token at all means that call needs sign-in — signing out
      // there would bounce the user to the login screen over one failed
      // background fetch.
      if (apiError.status === 401 && hadSession) {
        await clearTokens();
        notifyUnauthorized();
      }

      throw apiError;
    }
  );

  return client;
}
