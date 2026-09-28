/**
 * Shared plumbing for every Axios instance in the app.
 *
 * This module is the bottom of the dependency graph: it imports no other API
 * file, so `authClient` and the APIM service clients can both use it without
 * either one having to import the other. That is what keeps the refresh path
 * acyclic.
 */
import { isAxiosError, type AxiosError } from 'axios';

import { ApiError } from './types';

/* ------------------------------------------------------------------ *
 * Environment — four values, nothing else
 *
 * `EXPO_PUBLIC_*` values are inlined into the JS bundle at build time, so they
 * are readable by anyone with the app. Hostnames and non-secret ids only.
 *
 * The `EXPO_PUBLIC_` prefix is not decoration: Metro only inlines variables
 * that carry it. A bare `APIM_TOKEN_URL` in `.env` reads back as `undefined`
 * at runtime, which is why the four names below are prefixed.
 * ------------------------------------------------------------------ */

/** APIM token endpoint host. Login, refresh and revoke go here — nothing else. */
export const APIM_TOKEN_URL = process.env.EXPO_PUBLIC_APIM_TOKEN_URL ?? '';

/** APIM gateway host. Every service client is built from this + context + version. */
export const APIM_GATEWAY_URL = process.env.EXPO_PUBLIC_APIM_GATEWAY_URL ?? '';

/** Published API context and version for the banner service. */
export const APIM_BANNER_CONTEXT = process.env.EXPO_PUBLIC_APIM_BANNER_CONTEXT ?? '';
export const APIM_BANNER_VERSION = process.env.EXPO_PUBLIC_APIM_BANNER_VERSION ?? '';

/** Not env-driven — one value, the same everywhere, changed by editing this line. */
export const REQUEST_TIMEOUT_MS = 20_000;

/* ------------------------------------------------------------------ *
 * Unauthorized notification
 *
 * The API layer must not import navigation — that would couple the transport to
 * Expo Router and make it untestable. Instead, an unrecoverable 401 (one that
 * survived a refresh attempt) is published here and `AuthProvider` subscribes.
 * ------------------------------------------------------------------ */

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((listener) => listener());
}

/* ------------------------------------------------------------------ *
 * Ids
 * ------------------------------------------------------------------ */

/**
 * UUID v4 shape from `Math.random`.
 *
 * NOT cryptographically strong, and deliberately so: this is used for request
 * correlation ids and the device handle, where uniqueness is the requirement
 * and unpredictability is not. `crypto.randomUUID` is unavailable on Hermes,
 * and a strong id would mean pulling in `expo-crypto` for no security gain.
 */
export function randomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/* ------------------------------------------------------------------ *
 * Response envelope
 * ------------------------------------------------------------------ */

/**
 * The MI services answer `{ Status, Response }`; some answer the shorter
 * `{ success, data }`, and a REST resource may return its payload directly.
 * Accept all three so no caller has to unwrap by hand.
 *
 * A non-SUCCESS `Status` arrives with HTTP 200 — it is a business failure, not
 * a transport one, so it has to be detected here rather than in the Axios
 * response interceptor.
 */
export function unwrapEnvelope<TData>(raw: unknown, label: string): TData {
  if (!raw || typeof raw !== 'object') return raw as TData;

  const envelope = raw as {
    Status?: string;
    Response?: TData;
    success?: boolean;
    data?: TData;
    code?: string;
    message?: string;
    Message?: string;
    ErrorMessage?: string;
  };

  if ('Status' in envelope) {
    if (envelope.Status !== 'SUCCESS') {
      throw new ApiError({
        message:
          envelope.Message ?? envelope.ErrorMessage ?? envelope.message ?? `"${label}" failed.`,
        code: envelope.code ?? envelope.Status ?? 'SERVICE_ERROR',
        status: 200,
        fn: label,
        payload: envelope,
      });
    }
    return envelope.Response as TData;
  }

  if ('success' in envelope) {
    if (envelope.success === false) {
      throw new ApiError({
        message: envelope.message ?? `"${label}" failed.`,
        code: envelope.code ?? 'SERVICE_ERROR',
        status: 200,
        fn: label,
        payload: envelope,
      });
    }
    return (envelope.data ?? ({} as TData)) as TData;
  }

  return raw as TData;
}

/* ------------------------------------------------------------------ *
 * Error normalization
 *
 * One funnel so a screen never has to tell an Axios failure from a network
 * failure from a business rejection — everything arrives as `ApiError`.
 * ------------------------------------------------------------------ */

export function normalizeError(error: unknown, fallbackFn?: string): ApiError {
  if (error instanceof ApiError) return error;

  if (!isAxiosError(error)) {
    return new ApiError({
      message: error instanceof Error ? error.message : 'Unexpected error',
      code: 'UNKNOWN',
      fn: fallbackFn,
    });
  }

  const axiosError = error as AxiosError<{
    message?: string;
    code?: string;
    error_description?: string;
    error?: string;
  }>;
  const status = axiosError.response?.status;
  const data = axiosError.response?.data;

  return new ApiError({
    message:
      data?.message ??
      data?.error_description ??
      describe(axiosError.code, status) ??
      axiosError.message,
    code: data?.code ?? data?.error ?? mapCode(axiosError.code, status),
    status,
    fn: fallbackFn ?? axiosError.config?.url,
    payload: data,
  });
}

function mapCode(axiosCode: string | undefined, status: number | undefined): string {
  if (axiosCode === 'ECONNABORTED' || axiosCode === 'ETIMEDOUT') return 'TIMEOUT';
  if (axiosCode === 'ERR_NETWORK') return 'NETWORK';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status && status >= 500) return 'SERVER';
  if (status) return `HTTP_${status}`;
  return 'UNKNOWN';
}

function describe(axiosCode: string | undefined, status: number | undefined): string | undefined {
  if (axiosCode === 'ECONNABORTED' || axiosCode === 'ETIMEDOUT') return 'The request timed out.';
  // ERR_NETWORK covers every failure with no HTTP response: a genuinely offline
  // device, a rejected TLS certificate, a blocked CORS preflight, DNS. Naming
  // only the first one sent us hunting for a connectivity problem that was
  // actually a self-signed certificate.
  if (axiosCode === 'ERR_NETWORK') return 'Could not reach the server.';
  if (status === 401) return 'Your session has expired.';
  if (status && status >= 500) return 'The server is unavailable. Please try again.';
  return undefined;
}
