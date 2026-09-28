/**
 * Banner feature — home-screen promo rail.
 *
 * The template for every other feature module: one Axios instance built from
 * this service's APIM context and version, one thin `XxxApi` object, then the
 * hooks that wrap it.
 */
import { useQuery } from '@tanstack/react-query';

import { createApimClient } from './apimClient';
import { APIM_BANNER_CONTEXT, APIM_BANNER_VERSION, unwrapEnvelope } from './http';
import type { ApiError, Banner, BannerListResponse } from './types';

import * as Crypto from 'expo-crypto';

/** https://<gateway>/BANNER_CONTENT/1.0 */
const bannerInstance = createApimClient(APIM_BANNER_CONTEXT, APIM_BANNER_VERSION);

/** Screen ids are configured per banner slot on the backend. */
export const BannerScreen = {
  home: 'wallet.Home',
} as const;

export const BannerApi = {
  getBannerList: async (screenId: string): Promise<BannerListResponse> => {
    const { data } = await bannerInstance.post(
      '/getBannerList',
      {
        Request: {
          channel: 'WALLET',
          screenId,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Source: 'MOBILEBANK',
          Function: 'getBannerList',
          UserId: 'DEVTEST',
          RequestId: Crypto.randomUUID(), // or your GUID generator
          RequestType: 'R',
          SecurityCode: '10902AE77F0ACE2B433BCF0B11E3CC98',
        },
      }
    );

    // The service may answer the bare array or the MI `{ Status, Response }`
    // envelope depending on which backend fronts it; accept either.
    return unwrapEnvelope<BannerListResponse>(data.Response, 'banners');
  },
};

export const bannerKeys = {
  byScreen: (screenId: string) => ['banners', screenId] as const,
};

/** Numeric sort on the string `displayOrder`; unparseable values sink to the end. */
function byDisplayOrder(a: Banner, b: Banner): number {
  const left = Number(a.displayOrder);
  const right = Number(b.displayOrder);
  if (Number.isNaN(left)) return Number.isNaN(right) ? 0 : 1;
  if (Number.isNaN(right)) return -1;
  return left - right;
}

export function useBanners(screenId: string = BannerScreen.home) {
  return useQuery<BannerListResponse, ApiError, Banner[]>({
    queryKey: bannerKeys.byScreen(screenId),
    queryFn: () => BannerApi.getBannerList(screenId),
    // Sorting and filtering in `select` keeps it out of render, and React Query
    // memoizes the result so the rail does not re-sort on every re-render.
    // The gate is `bannerName`, not `imgUrl`: the rail draws banners as coloured
    // gradient tiles now, so the name is the only field it actually renders and
    // an artwork-less banner is still perfectly displayable.
    select: (banners) =>
      (banners ?? []).filter((banner) => Boolean(banner.bannerName)).sort(byDisplayOrder),
  });
}
