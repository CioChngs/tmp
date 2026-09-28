/**
 * Shared transport types + DTOs.
 *
 * Feature DTOs plus the one error type every call in the app rejects with.
 */

/** Every failure — network, HTTP, or business — surfaces as this. */
export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly fn?: string;
  readonly payload?: unknown;

  constructor(args: {
    message: string;
    code: string;
    status?: number;
    fn?: string;
    payload?: unknown;
  }) {
    super(args.message);
    this.name = 'ApiError';
    this.code = args.code;
    this.status = args.status;
    this.fn = args.fn;
    this.payload = args.payload;
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.code === 'UNAUTHORIZED';
  }

  get isNetwork(): boolean {
    return this.code === 'NETWORK' || this.code === 'TIMEOUT';
  }
}

/* ------------------------------------------------------------------ *
 * DTOs
 * ------------------------------------------------------------------ */

export type CurrencyCode = 'MNT' | 'USD' | 'EUR' | 'CNY' | 'JPY' | 'KRW' | 'RUB';

export type Account = {
  id: string;
  /** IBAN or local account number, as returned by the core. */
  number: string;
  name: string;
  currency: CurrencyCode;
  /** Minor units are NOT used — the gateway returns decimal majors. */
  balance: number;
  availableBalance: number;
  type: 'current' | 'savings' | 'card' | 'loan';
  isDefault: boolean;
};

export type AccountResponse = {
  accounts: Account[];
};

export type Deposit = {
  id: string;
  accountNumber: string;
  name: string;
  currency: CurrencyCode;
  principal: number;
  interestRate: number;
  accruedInterest: number;
  /** ISO-8601 date strings. */
  openedAt: string;
  maturesAt: string;
  status: 'active' | 'matured' | 'closed';
};

export type DepositResponse = {
  deposits: Deposit[];
};

export type TransferMoneyBody = {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  currency: CurrencyCode;
  description?: string;
};

export type TransferMoneyResponse = {
  transactionId: string;
  status: 'completed' | 'pending' | 'failed';
  fee: number;
  completedAt: string;
};

/**
 * One banner slot.
 *
 * `displayOrder` and `autoRotateSecond` arrive as strings from the gateway,
 * not numbers — parse before comparing.
 */
export type Banner = {
  bannerId: string;
  bannerName: string;
  imgUrl: string;
  displayOrder: string;
  autoRotateSecond: string;
  contentType: 'HTML' | 'IMAGE';
};

export type BannerListResponse = Banner[];

/* ------------------------------------------------------------------ *
 * Auth DTOs
 *
 * These are the identity provider's shapes — snake_case, per RFC 6749.
 * ------------------------------------------------------------------ */

/** RFC 6749 §5.1 token response. */
export type OAuthTokenResponse = {
  access_token: string;
  token_type?: string;
  /** Seconds until the access token expires. */
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
};

/** RFC 6749 §5.2 error response. */
export type OAuthErrorResponse = {
  error: string;
  error_description?: string;
};
