/** Public surface of the API layer — import from `@/api`, not from the files. */

// Transport
export { createApimClient } from './apimClient';
export { authClient, AuthApi, exchangeAuthorizationCode, login, logout, refreshAccessToken } from './authClient';
export {
  APIM_BANNER_CONTEXT,
  APIM_BANNER_VERSION,
  APIM_GATEWAY_URL,
  APIM_TOKEN_URL,
  onUnauthorized,
  REQUEST_TIMEOUT_MS,
  unwrapEnvelope,
} from './http';
export { queryClient } from './queryClient';

// Credentials
export {
  clearTokens,
  getDeviceId,
  isAccessTokenExpired,
  loadTokens,
  peekAccessToken,
  peekTokens,
  setTokens,
  type Tokens,
} from './tokenManager';

// Features
export { BannerApi, bannerKeys, BannerScreen, useBanners } from './banners';

export * from './types';
