# RightBank — API Request / Response Specification

> **Scope.** This document specifies **every client↔server interaction** the RightBank app
> needs, derived from `reference/RightBank.html` (a fully mocked in‑memory prototype — it has
> **no real backend**) and the feature inventory in `migration-progress.md`.
>
> **Architecture.** A **single gateway endpoint** receives all client traffic:
>
> ```
> POST https://api.rightbank.mn/api/gateway
> ```
>
> There is **no per‑resource REST routing**. The target service/handler is chosen by the
> `fn` (function name) field in the JSON body. Webhooks from external providers (QPay,
> E‑Mongolia / DAN, card processor) also arrive through the same endpoint via dedicated
> `*.webhook.*` intake functions.
>
> Anything the prototype does not make determinable is called out as an **[OPEN QUESTION]**
> rather than guessed.

---

## Table of contents

1. [Gateway envelope](#1-gateway-envelope)
2. [Auth model & step‑up](#2-auth-model--step-up)
3. [Gateway visibility, encryption & logging rules](#3-gateway-visibility-encryption--logging-rules)
4. [Idempotency](#4-idempotency)
5. [Rate limiting & abuse](#5-rate-limiting--abuse)
6. [Standard error codes](#6-standard-error-codes)
7. [Function catalog](#7-function-catalog)
8. [Function specifications](#8-function-specifications)
9. [Sensitive data summary](#9-sensitive-data-summary)
10. [Open questions](#10-open-questions)

---

## 1. Gateway envelope

### 1.1 Canonical request

Every client call is an HTTP `POST` to `/api/gateway` with this body shape. Only `fn`,
`requestId`, `timestamp` and `payload` are mandatory in the body; auth and routing metadata
travel in headers.

```http
POST /api/gateway HTTP/1.1
Host: api.rightbank.mn
Content-Type: application/json
Authorization: Bearer <sessionAccessToken>        ; omitted for public functions
X-RB-Client: rightbank-mobile/3.2.0 (ios 17.5; iPhone15,3; build 3200)
X-RB-Device-Id: d_9f2c…                            ; opaque per-install id, not the OS device id
X-RB-Locale: en-MN                                 ; en-MN | mn-MN
Idempotency-Key: 5f4e…-uuid-v4                      ; REQUIRED only for money-moving / create functions
X-RB-Action-Token: at_7a1c…                        ; present only when the function requires step-up
X-RB-Request-Signature: <base64 hmac>              ; service-to-service & webhook intake only
X-RB-Service: qpay-connector                        ; service-to-service & webhook intake only

{
  "fn": "transfer.domestic.execute",
  "requestId": "01J9ZC7Q4M8F2K3B6WSN0V5R7T",       // client-generated ULID, unique per attempt
  "timestamp": "2026-08-31T09:41:00.000Z",          // client clock, ISO-8601 UTC
  "payload": {
    "fromAccountRef": "acc_2f8a91",
    "toIban": "MN320000500000012...",               // see §3 — carried inside payload.secure for SWIFT
    "amount": { "value": "146200.00", "currency": "MNT" },
    "reference": "Rent August",
    "saveTransfer": false
  }
}
```

**Envelope field rules**

| Field | Type | Req | Rules |
|---|---|---|---|
| `fn` | string | yes | `domain.subject.action`, lowerCamel segments. Must be in the catalog (§7). Unknown → `FN_UNKNOWN`. |
| `requestId` | string (ULID) | yes | Unique per network attempt. Echoed in the response. Used for tracing + client-side dedupe. **Not** the idempotency key. |
| `timestamp` | string (ISO-8601 UTC) | yes | Rejected if skew > ±300 s from server time (`CLOCK_SKEW`). |
| `payload` | object | yes | Function-specific. May be `{}` but the key must be present. |
| `payload.secure` | string (JWE compact) | cond. | Present when the function carries credentials / PAN / biometric / raw PII. Encrypted to the **owning service's** public key; opaque to the gateway (§3). |
| `Authorization` | header | cond. | `Bearer <accessToken>` for `session` functions. Absent for `public`. |
| `X-RB-Device-Id` | header | yes | Opaque install id. Used for device binding, trusted-device checks, abuse scoring. |
| `X-RB-Client` | header | yes | Drives the minimum-version gate (`VERSION_UNSUPPORTED`). |
| `Idempotency-Key` | header | cond. | UUIDv4. Mandatory for every function marked *Idempotency: required* (§4). |
| `X-RB-Action-Token` | header | cond. | Short-lived step-up token from `auth.stepup.verify`, scoped to one `fn` + payload hash (§2). |
| `X-RB-Request-Signature` / `X-RB-Service` | header | cond. | HMAC-SHA256 over the raw body with the caller's shared secret; identifies the internal service or the webhook connector. Never accepted on the public client listener; rejected at the edge. |

### 1.2 Canonical success response

```json
{
  "requestId": "01J9ZC7Q4M8F2K3B6WSN0V5R7T",
  "fn": "transfer.domestic.execute",
  "ok": true,
  "ts": "2026-08-31T09:41:00.412Z",
  "data": {
    "transferRef": "txn_a41f90",
    "status": "SENT",
    "postedAt": "2026-08-31T09:41:00.390Z",
    "fee": { "value": "0.00", "currency": "MNT" },
    "newBalanceMasked": "•••'•••'321.00 ₮"
  },
  "meta": { "idempotent": false }
}
```

### 1.3 Canonical error response

```json
{
  "requestId": "01J9ZC7Q4M8F2K3B6WSN0V5R7T",
  "fn": "transfer.domestic.execute",
  "ok": false,
  "ts": "2026-08-31T09:41:00.077Z",
  "error": {
    "code": "TRANSFER_INSUFFICIENT_FUNDS",
    "message": "Not enough in that account",
    "retryable": false,
    "retryAfterMs": null,
    "fields": { "amount": "exceeds_available" },
    "traceId": "b7e1c9d2f0a34e58"
  }
}
```

- `message` is **always** a safe, localised, user-presentable string. It never contains
  amounts of other parties, account numbers, PANs, stack frames, upstream error bodies, or
  internal identifiers.
- `traceId` is an opaque correlation id the user can quote to support. It maps to full
  server-side context that is **not** returned to the client.
- `fields` keys are payload field names; values are stable machine slugs, never free text.

---

## 2. Auth model & step-up

| Level | Who / how | Carried in | Notes |
|---|---|---|---|
| **public** | No credentials. | — | App bootstrap, login, OTP, health, reference config. Still rate-limited and device-bound. |
| **session** | `Bearer <accessToken>` — JWT, ~10 min TTL, audience `rightbank-mobile`. | `Authorization` header | Paired with a rotating `refreshToken` (opaque, 30 d, single-use, device-bound). Refresh via `auth.session.refresh`. |
| **step-up** | `session` **plus** `X-RB-Action-Token` from `auth.stepup.verify`. | `X-RB-Action-Token` header | Token TTL 300 s, single-use, bound to `{fn, sha256(canonical payload), deviceId, userId}`. Reuse or mismatch → `STEP_UP_TOKEN_INVALID`. |
| **service-to-service** | mTLS client cert **plus** `X-RB-Request-Signature` (HMAC-SHA256, per-service secret) + `X-RB-Service`. | headers | Only for `gateway→service` calls and `*.webhook.*` intake. Rejected on the public listener. |

**Step-up methods** (the `askAuth` sheet in the reference): `faceid` (device-signed WebAuthn/
platform assertion — biometric never leaves the device), `txn_password` (internet-banking
transaction password), `otp` (SMS one-time code), `emongolia` (DAN re-auth). Each sensitive
function declares which methods it accepts. `auth.stepup.challenge` returns the allowed set for
a given `{fn, payloadHash}`.

**Biometric principle.** Face ID / fingerprint templates **never transit**. The device holds a
platform key created at enrolment; step-up produces a signed challenge-response. The server
stores only the public key + a credential id.

---

## 3. Gateway visibility, encryption & logging rules

### 3.1 What the gateway MAY see and log

- `fn`, `requestId`, `timestamp`, `X-RB-Locale`, `X-RB-Client`, `X-RB-Device-Id`.
- HTTP status, `ok`, `error.code`, `traceId`, latency, response byte size.
- Payload **shape** metadata: top-level key names, value types, array lengths, byte sizes.
- **Opaque reference handles** only: `accountRef`, `cardRef`, `loanRef`, `txnRef`,
  `beneficiaryRef`, `invoiceRef`, `goalRef`, `depositRef` — all per-user, non-sequential
  (ULID or HMAC of the internal id under a per-user salt). These are safe to log and route on.
- Masked display values already redacted by the service (`•••• 8841`, `****1234`).

### 3.2 What the gateway MUST NOT see or log

- The value of `Authorization`, `X-RB-Action-Token`, `Idempotency-Key` correlated to amounts.
- **Any full `payload` body** for a function tagged with a sensitive field below — request
  bodies for these functions are logged as `"<redacted: N bytes>"`.
- The contents of `payload.secure` (JWE). The gateway forwards the compact string verbatim to
  the owning service and **cannot decrypt it** (no private key).
- Decrypted PAN, CVV, PIN, I-PIN, passwords, passcodes, raw OTP, biometric data, DAN codes,
  full national **register number**, full customer legal name (in KYC context), delivery
  addresses, beneficiary bank account numbers, credit-score report bodies.

### 3.3 `payload.secure` (client-side field encryption)

When a function moves credentials or raw PII/PAN, those fields are **removed from the plain
`payload`** and placed in a JWE:

```
payload.secure = JWE( alg=ECDH-ES+A256KW, enc=A256GCM,
                      recipient = <service>.enc-public-key (kid pinned in the app),
                      claims = { <sensitive fields>, aud:"<service>", iat, jti,
                                 bind: sha256(fn + requestId + deviceId) } )
```

- The gateway routes on `fn` + the non-secure remainder of `payload`, then forwards `secure`
  to the target service, which is the only holder of the decryption key.
- `bind` ties the blob to one request so a captured blob cannot be replayed on another call.
- **The gateway can route on an encrypted blob without decrypting it.**

### 3.4 Log-leak prevention checklist

- Central redaction middleware on the gateway: deny-list of `fn`s whose request/response
  bodies are never serialised to logs; allow-list of header names that may be logged.
- Services must map upstream errors (card processor, QPay, DAN, core ledger) to RightBank
  error codes **before** returning; raw upstream payloads/stack traces are logged only at the
  service with `traceId`, never propagated to the gateway response.
- Error `message` strings are pulled from a localised catalog keyed by `error.code`; services
  may not interpolate account numbers, amounts of third parties, or PII into them.
- No sensitive value ever placed in a URL/query — the API is a single `POST`; services must
  keep the same rule for their own upstream calls.
- Crash/APM breadcrumbs on the client exclude `payload.secure`, `Authorization`, and any
  `amount`/`iban`/`pan` fields (SDK scrubber config shipped with the app).

---

## 4. Idempotency

- Required for every function that **moves money, issues a financial instrument, or creates a
  durable record with side effects**: transfers, QPay pay, bill pay, FX conversion, top-ups,
  deposit open/top-up, loan repay/prepay, overdraft activate, card order/replace/close,
  reward redeem, savings contribute, daily-streak save, statement/certificate/reference
  generation (billable), onboarding account open.
- Carried in the `Idempotency-Key` header (UUIDv4), generated once by the client per logical
  user action and **retained across retries** of that action.
- Server stores `{key, userId, fn, sha256(payload)} → response` for **24 h**.
  - Same key + same payload hash → the **stored response is replayed**, `meta.idempotent:true`,
    no re-execution.
  - Same key + **different** payload hash → `IDEMPOTENCY_KEY_REUSED` (409).
  - Missing on a required function → `IDEMPOTENCY_KEY_MISSING` (400).
- The idempotency store is **service-side**, keyed per owning service; the gateway forwards
  the header but does not itself dedupe money operations.
- External webhooks carry the provider's own event id (`qpayPaymentId`, DAN `txnId`); the
  intake function dedupes on `{provider, providerEventId}` for 30 days.

---

## 5. Rate limiting & abuse

Buckets are keyed by the tightest available of `userId`, `X-RB-Device-Id`, source IP, and
(for OTP/login) target phone/username. `RATE_LIMITED` responses carry `retryAfterMs`.

| Function(s) | Limit | Extra controls |
|---|---|---|
| `auth.login.password` | 5 / 5 min / username; 20 / h / IP | Exponential lockout, CAPTCHA-equivalent challenge after 5, alert on new device. |
| `auth.otp.send`, `onboarding.phone.verifyStart` | 1 / 30 s, 5 / h / phone; 10 / day / device | Code TTL 300 s; max 5 verify attempts per code then invalidate. |
| `auth.otp.verify`, `auth.stepup.verify` | 5 / code; 15 / 10 min / user | Lock step-up for 15 min after threshold. |
| `auth.faceid.verify` | 5 consecutive failures → biometric disabled, password required. | Mirrors reference "Face not recognised / Retry". |
| `transfer.iban.resolve`, `qpay.code.resolve` | 30 / min / user | Prevents account/merchant enumeration; results not cached across users. |
| `transfer.*.execute`, `qpay.payment.execute`, `bills.pay` | 10 / min / user, 60 / day / user | Velocity + amount anomaly scoring; large / first-to-payee → forced step-up. |
| `helpy.message.send` | 20 / min, 300 / day / user | Content moderation on input/output. |
| `notifications.list`, `transactions.list` | 60 / min / user | Cursor pagination only. |
| `admin.rewardConfig.update` | 10 / h / admin | Change is audited + dual-control [OPEN QUESTION]. |
| Global default (any `fn`) | 120 / min / user, 600 / min / device | — |

---

## 6. Standard error codes

Returned in `error.code`. Function sections list only the **function-specific** additions.

| Code | HTTP | Retryable | Meaning / user message source |
|---|---|---|---|
| `FN_UNKNOWN` | 400 | no | `fn` not in catalog. |
| `VALIDATION_FAILED` | 400 | no | Payload failed schema/rules; see `error.fields`. |
| `CLOCK_SKEW` | 400 | yes | `timestamp` outside ±300 s. |
| `UNAUTHENTICATED` | 401 | no | Missing/invalid access token. |
| `SESSION_EXPIRED` | 401 | yes | Access token expired — client should `auth.session.refresh`. |
| `REFRESH_INVALID` | 401 | no | Refresh token reused/revoked — force re-login. |
| `STEP_UP_REQUIRED` | 401 | yes | `data.challenge` describes allowed methods; obtain `X-RB-Action-Token`. |
| `STEP_UP_TOKEN_INVALID` | 401 | no | Action token missing/expired/wrong scope. |
| `FORBIDDEN` | 403 | no | Authenticated but not permitted (e.g. admin fn, other user's resource). |
| `NOT_FOUND` | 404 | no | Referenced resource handle unknown to this user. |
| `IDEMPOTENCY_KEY_MISSING` | 400 | no | Required header absent. |
| `IDEMPOTENCY_KEY_REUSED` | 409 | no | Key seen with a different payload. |
| `CONFLICT` | 409 | maybe | State changed (already frozen, already paid, deposit already closed). |
| `RATE_LIMITED` | 429 | yes | See `retryAfterMs`. |
| `UPSTREAM_UNAVAILABLE` | 502/503 | yes | Core ledger / QPay / DAN / card processor down. Generic message. |
| `MAINTENANCE` | 503 | yes | Planned downtime window. |
| `VERSION_UNSUPPORTED` | 426 | no | Client below minimum build; must update. |
| `INTERNAL` | 500 | yes | Unexpected. Generic message + `traceId` only. |

---

## 7. Function catalog

Naming: `domain.subject.action`. Direction key — **C→G** client→gateway, **G→S**
gateway→service, **W→G** external webhook→gateway.

### Session, auth & security
| fn | dir | auth |
|---|---|---|
| `health.ping` | C→G | public |
| `session.bootstrap` | C→G | public |
| `config.app.get` | C→G | public |
| `referenceData.i18n.get` | C→G | public |
| `auth.login.password` | C→G | public |
| `auth.faceid.challenge` | C→G | public |
| `auth.faceid.verify` | C→G | public |
| `auth.otp.send` | C→G | public |
| `auth.otp.verify` | C→G | public |
| `auth.session.refresh` | C→G | public (refresh token) |
| `auth.session.revoke` | C→G | session |
| `auth.password.forgot` | C→G | public |
| `auth.stepup.challenge` | C→G | session |
| `auth.stepup.verify` | C→G | session |
| `auth.emongolia.start` | C→G | session or onboarding ticket |
| `auth.emongolia.webhook` | W→G | signed (DAN) |
| `security.warning.ack` | C→G | session |
| `security.devices.list` | C→G | session |
| `security.devices.revoke` | C→G | session + step-up |
| `security.loginHistory.list` | C→G | session |
| `security.passcode.change` | C→G | session + step-up |
| `security.biometrics.set` | C→G | session + step-up |
| `security.twoFactor.set` | C→G | session + step-up |
| `push.device.register` | C→G | session |
| `push.device.unregister` | C→G | session |
| `svc.sms.sendOtp` | G→S | s2s |
| `svc.notification.dispatch` | G→S | s2s |

### Onboarding / KYC
| fn | dir | auth |
|---|---|---|
| `onboarding.start` | C→G | public |
| `onboarding.existing.verifyCode` | C→G | onboarding ticket |
| `onboarding.kyc.document.createUpload` | C→G | onboarding ticket |
| `onboarding.kyc.document.commit` | C→G | onboarding ticket |
| `onboarding.kyc.selfie.submit` | C→G | onboarding ticket |
| `onboarding.emongolia.confirm` | C→G | onboarding ticket |
| `onboarding.profile.submit` | C→G | onboarding ticket |
| `onboarding.account.open` | C→G | onboarding ticket + step-up |
| `onboarding.application.status` | C→G | onboarding ticket |
| `svc.kyc.verifyDocuments` | G→S | s2s |
| `svc.emongolia.exchangeCode` | G→S | s2s |

### Profile, preferences, limits
| fn | dir | auth |
|---|---|---|
| `profile.get` | C→G | session |
| `profile.update` | C→G | session + step-up |
| `profile.loginPicture.set` | C→G | session |
| `profile.loginPicture.remove` | C→G | session |
| `preferences.get` | C→G | session |
| `preferences.update` | C→G | session |
| `limits.get` | C→G | session |
| `limits.update` | C→G | session + step-up |

### Accounts, transactions, documents
| fn | dir | auth |
|---|---|---|
| `accounts.list` | C→G | session |
| `accounts.get` | C→G | session |
| `accounts.open` | C→G | session + step-up |
| `accounts.rename` | C→G | session |
| `accounts.close` | C→G | session + step-up |
| `accounts.reference.request` | C→G | session + step-up |
| `accounts.statement.generate` | C→G | session |
| `accounts.certificate.request` | C→G | session + step-up |
| `transactions.list` | C→G | session |
| `transactions.get` | C→G | session |
| `transactions.search` | C→G | session |
| `analytics.spendingTrend.get` | C→G | session |
| `svc.ledger.query` | G→S | s2s |
| `svc.document.render` | G→S | s2s |

### FX / treasury
| fn | dir | auth |
|---|---|---|
| `fx.rates.get` | C→G | session |
| `fx.quote.create` | C→G | session |
| `fx.conversion.execute` | C→G | session + step-up |

### Transfers
| fn | dir | auth |
|---|---|---|
| `transfer.iban.resolve` | C→G | session |
| `transfer.beneficiaries.list` | C→G | session |
| `transfer.beneficiaries.save` | C→G | session |
| `transfer.beneficiaries.delete` | C→G | session |
| `transfer.saved.list` | C→G | session |
| `transfer.domestic.quote` | C→G | session |
| `transfer.domestic.execute` | C→G | session + step-up |
| `transfer.phone.execute` | C→G | session + step-up |
| `transfer.swift.quote` | C→G | session |
| `transfer.swift.execute` | C→G | session + step-up |
| `transfer.status.get` | C→G | session |
| `svc.ledger.postTransfer` | G→S | s2s |
| `svc.swift.submit` | G→S | s2s |

### Bills & billing
| fn | dir | auth |
|---|---|---|
| `bills.inbox.list` | C→G | session |
| `bills.search` | C→G | session |
| `bills.get` | C→G | session |
| `bills.pay` | C→G | session + step-up |
| `bills.autopay.set` | C→G | session + step-up |
| `bills.sms.set` | C→G | session |
| `bills.webhook.issued` | W→G | signed (biller aggregator) |

### QPay & scan-to-pay
| fn | dir | auth |
|---|---|---|
| `qpay.code.resolve` | C→G | session |
| `qpay.payment.execute` | C→G | session + step-up |
| `qpay.receiveQr.get` | C→G | session |
| `qpay.webhook.payment` | W→G | signed (QPay) |
| `atm.cashInQr.get` | C→G | session |
| `svc.qpay.createInvoice` | G→S | s2s |
| `svc.qpay.queryPayment` | G→S | s2s |

### Top-ups
| fn | dir | auth |
|---|---|---|
| `topup.account.execute` | C→G | session + step-up |
| `topup.mobile.execute` | C→G | session + step-up |

### Cards
| fn | dir | auth |
|---|---|---|
| `cards.list` | C→G | session |
| `cards.get` | C→G | session |
| `cards.details.reveal` | C→G | session + step-up |
| `cards.freeze.set` | C→G | session |
| `cards.pin.reissue` | C→G | session + step-up (otp) |
| `cards.controls.get` | C→G | session |
| `cards.controls.update` | C→G | session + step-up |
| `cards.order` | C→G | session + step-up (otp) |
| `cards.delivery.set` | C→G | session |
| `cards.tracking.get` | C→G | session |
| `cards.renewal.prepare` | C→G | session + step-up |
| `cards.replace` | C→G | session + step-up |
| `cards.reportLostStolen` | C→G | session + step-up |
| `cards.close` | C→G | session + step-up |
| `cards.wallet.provision` | C→G | session + step-up (otp) |
| `cards.authHolds.list` | C→G | session |
| `cards.activity.list` | C→G | session |
| `svc.cardProcessor.reveal` | G→S | s2s |
| `svc.cardProcessor.lifecycle` | G→S | s2s |
| `cards.webhook.lifecycle` | W→G | signed (processor) |

### Deposits & savings
| fn | dir | auth |
|---|---|---|
| `deposits.list` | C→G | session |
| `deposits.get` | C→G | session |
| `deposits.open` | C→G | session + step-up |
| `deposits.topup` | C→G | session + step-up |
| `deposits.close` | C→G | session + step-up |
| `savings.goals.list` | C→G | session |
| `savings.goals.get` | C→G | session |
| `savings.goals.create` | C→G | session |
| `savings.goals.contribute` | C→G | session + step-up |
| `savings.goals.delete` | C→G | session |
| `savings.dailyStreak.get` | C→G | session |
| `savings.dailyStreak.saveToday` | C→G | session + step-up |
| `savings.child.get` | C→G | session |

### Loans & credit
| fn | dir | auth |
|---|---|---|
| `loans.list` | C→G | session |
| `loans.get` | C→G | session |
| `loans.upcoming.get` | C→G | session |
| `loans.repay` | C→G | session + step-up |
| `loans.prepay.quote` | C→G | session |
| `loans.prepay.execute` | C→G | session + step-up |
| `loans.holiday.eligibility` | C→G | session |
| `loans.holiday.request` | C→G | session + step-up |
| `loans.offers.check` | C→G | session |
| `credit.score.get` | C→G | session + step-up |
| `credit.report.request` | C→G | session + step-up |
| `overdraft.status.get` | C→G | session |
| `overdraft.explain` | C→G | session |
| `overdraft.activate` | C→G | session + step-up |

### Rewards
| fn | dir | auth |
|---|---|---|
| `rewards.summary.get` | C→G | session |
| `rewards.earnHistory.list` | C→G | session |
| `rewards.catalog.get` | C→G | session |
| `rewards.redeem` | C→G | session + step-up |
| `rewards.benefits.list` | C→G | session |

### Subscriptions
| fn | dir | auth |
|---|---|---|
| `subscriptions.list` | C→G | session |
| `subscriptions.get` | C→G | session |
| `subscriptions.cancel` | C→G | session + step-up |
| `subscriptions.rescan` | C→G | session |

### Notifications
| fn | dir | auth |
|---|---|---|
| `notifications.list` | C→G | session |
| `notifications.markRead` | C→G | session |
| `notifications.markAllRead` | C→G | session |
| `notifications.preferences.get` | C→G | session |
| `notifications.preferences.update` | C→G | session |

### Support & reference data
| fn | dir | auth |
|---|---|---|
| `helpy.session.start` | C→G | session |
| `helpy.message.send` | C→G | session |
| `helpy.history.get` | C→G | session |
| `support.contact.get` | C→G | session |
| `branches.list` | C→G | session |
| `referenceData.banks.list` | C→G | session |

### Bank admin (back office — NOT shipped to customers; present in the prototype)
| fn | dir | auth |
|---|---|---|
| `admin.rewardConfig.get` | C→G | admin session (s2s / staff IdP) |
| `admin.rewardConfig.update` | C→G | admin session + dual-control |

---

## 8. Function specifications

Compact-card format. Global errors from §6 apply to every function and are not repeated.
"Sensitive" lists **only** flagged fields; all other fields are non-sensitive.

---

### Session, auth & security

---

#### `health.ping`
**Dir** C→G · **Auth** public · **Idempotency** n/a · **Rate limit** global default.
**Payload**: `{}`.
**Success `data`**: `{ "status": "ok", "ts": "<ISO>", "region": "mn-1" }`.
**Errors**: `MAINTENANCE`.
**Sensitive**: none. Gateway may fully log.

---

#### `session.bootstrap`
**Dir** C→G · **Auth** public (accepts optional expired token to pre-fill `userHint`) · **Rate limit** 30/min/device.
Returns everything the app needs before login: min version, feature flags, theme catalog,
i18n bundle version, ambient config (the reference's `version 3.2.0` string, security-warning
copy version).

**Payload**
| field | type | req | rules |
|---|---|---|---|
| `clientBuild` | int | yes | From `X-RB-Client`; echoed for the version gate. |
| `lastConfigEtag` | string | no | For 304-style no-change response. |

**Success `data`**
| field | type | notes |
|---|---|---|
| `minSupportedBuild` | int | `< this` → client must hard-update. |
| `features` | object<string,bool> | e.g. `swiftTransfers`, `childSavings`, `esportsTheme`. |
| `themes` | array | Theme catalog (name, accent, motion id). |
| `i18nBundleVersion` | string | Drives `referenceData.i18n.get`. |
| `securityNoticeVersion` | int | If `> acked`, show the interstitial. |
| `configEtag` | string | Cache key. |

**Errors**: `VERSION_UNSUPPORTED`.
**Sensitive**: none client-identifying beyond the device header. Gateway may log the etag and feature diff, **not** any `userHint`.

---

#### `config.app.get`
**Dir** C→G · **Auth** public · Thin alias of the config half of `session.bootstrap` for
periodic refresh. Same response minus `userHint`. **Sensitive**: none.

---

#### `referenceData.i18n.get`
**Dir** C→G · **Auth** public · **Payload** `{ "locale": "en-MN|mn-MN", "bundleVersion": "<str>" }`.
**Success `data`**: `{ "locale", "version", "strings": { <key>: <value> } }` (includes the
bilingual toast catalog, error-message catalog, security-notice bullets).
**Sensitive**: none.

---

#### `auth.login.password`
**Dir** C→G · **Auth** public · **Idempotency** n/a · **Rate limit** 5/5min/username, 20/h/IP; lockout + challenge after 5 failures.
Reference: "Sign in with password", "Your username and internet-banking password", "Forgot password?".

**Payload** — credentials go in `payload.secure` (JWE to the **auth service**); the plain
payload carries only routing/context.
| field | location | type | req | rules |
|---|---|---|---|---|
| `username` | `payload.secure` | string | yes | 4–32 chars. |
| `password` | `payload.secure` | string | yes | Never in plain payload, never logged, never echoed. |
| `deviceName` | plain | string | no | For the trusted-devices / login-history list. |
| `bindDevice` | plain | bool | no | "Trust this device". |

**Success `data`**
| field | type | notes |
|---|---|---|
| `accessToken` | string (JWT) | ~10 min. |
| `refreshToken` | string | 30 d, single-use, device-bound. |
| `expiresInSec` | int | |
| `stepUpEnrolled` | object | `{ faceid:bool, txnPassword:bool, otp:bool }`. |
| `securityNoticeVersion` | int | Client compares to acked. |
| `mustChangePassword` | bool | |

**Errors**: `LOGIN_INVALID_CREDENTIALS` ("Sign-in details are incorrect"), `LOGIN_LOCKED`
("Too many attempts. Try again in %s"), `LOGIN_DEVICE_BLOCKED`, `PASSWORD_EXPIRED`.
Message must be **identical** for unknown-username vs wrong-password (no user enumeration).

**Sensitive**
- `username`, `password` → **ENCRYPT** (JWE to auth service). Never visible to the gateway; request body logged as redacted. Password never stored except as Argon2id hash.
- `accessToken`, `refreshToken` (response) → **treated as credentials**: TLS only, not logged, not in analytics; client stores in Keychain/Keystore.
- `deviceName` → PII-lite; may be logged.
- Gateway sees: `fn`, result code, device header, rate-bucket keys (hashed). Gateway must **not** log the `secure` blob or tokens.

---

#### `auth.faceid.challenge`
**Dir** C→G · **Auth** public · **Rate limit** 20/min/device.
**Payload**: `{ "credentialId": "<str>", "userHandle": "<opaque>" }`.
**Success `data`**: `{ "challenge": "<base64url nonce>", "expiresInSec": 120, "rpId": "rightbank.mn" }`.
**Sensitive**: `credentialId`, `userHandle` are opaque non-PII handles — MASK not needed, but
not loggable in a way that links to a person; log hashed. No biometric data present.

---

#### `auth.faceid.verify`
**Dir** C→G · **Auth** public · **Rate limit** 5 consecutive failures → biometric disabled for the install; fall back to password.
Reference: "Looking for you…", "Face not recognised", "Retry Face ID", "Use password instead".

**Payload**
| field | type | req | rules |
|---|---|---|---|
| `credentialId` | string | yes | Platform credential id. |
| `authenticatorData` | base64url | yes | WebAuthn assertion. |
| `clientDataJSON` | base64url | yes | Must embed the issued `challenge`. |
| `signature` | base64url | yes | Verified against the stored public key. |

**Success `data`**: same token bundle as `auth.login.password`.
**Errors**: `FACEID_ASSERTION_INVALID` ("Face not recognised"), `FACEID_CHALLENGE_EXPIRED`,
`FACEID_NOT_ENROLLED`, `FACEID_LOCKED_OUT` ("Use your password to sign in").

**Sensitive**
- No biometric template transits — only a signature. Nothing here is PII beyond the account linkage.
- Response tokens → credentials (as above).
- Gateway sees: `fn`, pass/fail, device header. Assertion blobs are not logged.

---

#### `auth.otp.send`
**Dir** C→G · **Auth** public (or onboarding ticket) · **Idempotency** implicit (1/30 s) · **Rate limit** 1/30 s, 5/h/phone, 10/day/device.
**Payload**
| field | type | req | rules |
|---|---|---|---|
| `purpose` | enum | yes | `login` \| `stepup` \| `onboarding` \| `card_issue` \| `wallet_provision`. |
| `phoneHint` | string | cond. | Last 4 digits only, for `login`/`onboarding` where the msisdn is known server-side. Full number is **never** sent by the client here. |
| `channel` | enum | no | `sms` (default). |

**Success `data`**: `{ "otpRef": "<str>", "expiresInSec": 300, "maskedPhone": "****1234", "resendInSec": 30, "attemptsAllowed": 5 }`.
**Errors**: `OTP_RESEND_TOO_SOON`, `OTP_QUOTA_EXCEEDED`, `OTP_NO_PHONE_ON_FILE`.
Downstream: `svc.sms.sendOtp` (G→S).

**Sensitive**
- **Phone number** → the full msisdn stays server-side; response only ever returns `maskedPhone`. **MASK**.
- `otpRef` is an opaque handle, not the code. The **code itself is never in any response**.
- Gateway sees: `fn`, `purpose`, `maskedPhone`, rate keys. Gateway must not log `phoneHint` beyond the masked form.

---

#### `auth.otp.verify`
**Dir** C→G · **Auth** public / onboarding ticket · **Rate limit** 5 attempts / `otpRef`, then invalidate.
**Payload** — code in `payload.secure` (JWE to auth service).
| field | location | type | req | rules |
|---|---|---|---|---|
| `otpRef` | plain | string | yes | From `auth.otp.send`. |
| `code` | `payload.secure` | string | yes | 4–6 digits. Never in plain payload/logs. |

**Success `data`**: for `purpose:login` → token bundle; for `purpose:stepup` → `{ "actionToken": "<str>", "expiresInSec": 300 }`; for onboarding → `{ "phoneVerified": true }`.
**Errors**: `OTP_INVALID` ("That code is not valid. Check the SMS and try again."),
`OTP_EXPIRED`, `OTP_ATTEMPTS_EXCEEDED` ("Request a new code").

**Sensitive**
- `code` → **ENCRYPT** (JWE). Never logged, never echoed. Constant-time compare service-side.
- Response `actionToken` / tokens → credentials.
- Gateway sees: `fn`, `otpRef`, pass/fail.

---

#### `auth.session.refresh`
**Dir** C→G · **Auth** public — the refresh token **is** the credential (`payload.secure`, JWE to auth service).
**Payload**: `secure { "refreshToken": "<str>" }`.
**Success `data`**: new `{ accessToken, refreshToken, expiresInSec }` — **refresh token is rotated** (old one immediately invalid; reuse of an old one revokes the whole chain and forces re-login → `REFRESH_INVALID`).
**Errors**: `REFRESH_INVALID`, `REFRESH_DEVICE_MISMATCH`.

**Sensitive**: both tokens are credentials — ENCRYPT in transit via `secure`, never logged, Keychain storage. Gateway sees only `fn` + pass/fail + device header.

---

#### `auth.session.revoke`
**Dir** C→G · **Auth** session · Reference: "Sign out" (🚪).
**Payload**: `{ "scope": "this_device" | "all_devices" }`.
**Success `data`**: `{ "revoked": true }`. Invalidates the access+refresh chain(s).
**Sensitive**: none beyond the (already-authenticated) session. Safe to log `scope`.

---

#### `auth.password.forgot`
**Dir** C→G · **Auth** public · **Rate limit** 3/h/username, 10/day/IP.
Reference: "Forgot password?", "Reset it at a branch or on 1800-1888".
**Payload**: `{ "username": "<in secure>", "method": "branch" | "phone_support" | "email_link" }`.
**Success `data`**: `{ "acknowledged": true, "channelHint": "We've sent instructions to the phone on file" }` — **always the same** regardless of whether the username exists (no enumeration).
**Sensitive**: `username` → ENCRYPT (JWE). No reset material returned to the client in-band. Gateway sees `fn` + `method` only.

---

#### `auth.stepup.challenge`
**Dir** C→G · **Auth** session · Returns which step-up methods are valid for a pending action.
**Payload**: `{ "targetFn": "<catalog fn>", "payloadHash": "<sha256 hex of canonical payload>" }`.
**Success `data`**: `{ "methods": ["faceid","txn_password","otp"], "otpRefHint": null, "reason": "large_amount" | "new_payee" | "sensitive_data" | "policy" }`.
**Sensitive**: `payloadHash` is a hash, not the data — safe. Gateway may log `targetFn` + `reason`.

---

#### `auth.stepup.verify`
**Dir** C→G · **Auth** session · **Rate limit** 5/method/10 min/user.
**Payload** — secret material in `payload.secure` (JWE to auth service).
| field | location | type | req | rules |
|---|---|---|---|---|
| `targetFn` | plain | string | yes | Scope for the resulting action token. |
| `payloadHash` | plain | string | yes | Binds the token to one payload. |
| `method` | plain | enum | yes | `faceid` \| `txn_password` \| `otp` \| `emongolia`. |
| `assertion` | `payload.secure` | object | cond. | `faceid` → WebAuthn assertion. |
| `txnPassword` | `payload.secure` | string | cond. | `txn_password`. |
| `otpRef` + `code` | `payload.secure` | — | cond. | `otp`. |
| `danAuthCode` | `payload.secure` | string | cond. | `emongolia` — code from the DAN callback. |

**Success `data`**: `{ "actionToken": "<str>", "expiresInSec": 300, "boundFn": "<targetFn>" }`.
**Errors**: `STEPUP_METHOD_REJECTED`, `TXN_PASSWORD_INVALID`, `OTP_INVALID`, `DAN_CODE_INVALID`.

**Sensitive**
- `txnPassword`, `code`, `assertion`, `danAuthCode` → **ENCRYPT** (JWE). None logged / echoed.
- `actionToken` → credential (short-lived).
- Gateway sees: `fn`, `targetFn`, `method`, pass/fail. Never the `secure` blob.

---

#### `auth.emongolia.start`
**Dir** C→G · **Auth** session **or** onboarding ticket · Begins the DAN (E‑Mongolia) OAuth-style hand-off.
Reference: "Open E-Mongolia (DAN)", "Confirm with E-Mongolia", "Identity verified online".
**Payload**: `{ "purpose": "onboarding_kyc" | "stepup" | "reverify", "returnDeepLink": "rightbank://dan/return" }`.
**Success `data`**: `{ "danAuthUrl": "https://…", "state": "<opaque>", "expiresInSec": 600 }`.
The client opens `danAuthUrl`; DAN later calls `auth.emongolia.webhook` and/or redirects to the deep link with `state`.
**Sensitive**: `state` is opaque + single-use. No PII in the URL/query beyond `state` and `redirect_uri`. Gateway may log `purpose` + `state` (hashed).

---

#### `auth.emongolia.webhook`  *(external webhook → gateway)*
**Dir** W→G · **Auth** signed — DAN's HMAC/JWS in `X-RB-Request-Signature`; `X-RB-Service: emongolia-connector`. **Idempotency** dedupe on `{provider:"dan", providerEventId}` 30 d.
Webhook-intake function so DAN callbacks also go through the single gateway shape.

**Payload** (mapped by the connector from DAN's callback body; raw DAN fields kept in `secure`)
| field | location | type | notes |
|---|---|---|---|
| `providerEventId` | plain | string | DAN transaction id — dedupe key. |
| `state` | plain | string | Correlates to `auth.emongolia.start`. |
| `status` | plain | enum | `verified` \| `declined` \| `expired`. |
| `danAuthCode` | `payload.secure` | string | One-time code the client then presents to `auth.stepup.verify` / `onboarding.emongolia.confirm`. |
| `verifiedClaims` | `payload.secure` | object | `{ registerNumber, legalNameCyrillic, dateOfBirth, … }` — encrypted to the **KYC service**. |

**Success `data`**: `{ "accepted": true }` (200; DAN expects a bare ack).
**Errors**: `WEBHOOK_SIGNATURE_INVALID` (401), `WEBHOOK_STATE_UNKNOWN`, `WEBHOOK_REPLAY` (200 + ignored).

**Sensitive**
- `registerNumber` (Mongolian national ID / РД) → **ENCRYPT** to KYC service; the gateway
  never sees it; **never** returned to any client-facing function in full (only
  `state-verified` boolean + masked `УБ96••••••` per the reference).
- `legalNameCyrillic`, `dateOfBirth` → **ENCRYPT** to KYC service; client sees derived flags
  only (`✓ Identity verified`).
- `danAuthCode` → **ENCRYPT**; single-use; not logged.
- Gateway sees + may log: `providerEventId`, `state` (hashed), `status`. **Must not** log the
  `secure` blob or map `state` to a person in logs.

---

#### `security.warning.ack`
**Dir** C→G · **Auth** session · Records the one-time security interstitial ack ("Got it").
Reference: "SECURITY WARNING / Never share your code", 4 bullet cards.
**Payload**: `{ "noticeVersion": <int> }`.
**Success `data`**: `{ "acked": true, "noticeVersion": <int> }`.
**Sensitive**: none.

---

#### `security.devices.list`
**Dir** C→G · **Auth** session · Reference: "Trusted devices (2)".
**Payload**: `{}`.
**Success `data`**: `devices[]` — `{ deviceRef, name, platform, lastSeenAt, lastSeenCityMasked, current:bool, trusted:bool }`.
**Sensitive**
- `lastSeenCityMasked` / geo → **MASK** to city-level only; no precise coordinates or IP to the client.
- IP addresses → **OMIT** from client payload (kept server-side for fraud).
- `deviceRef` opaque handle. Gateway may log the list size only.

---

#### `security.devices.revoke`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
**Payload**: `{ "deviceRef": "<str>" }`.
**Success `data`**: `{ "revoked": true }`. Kills that device's refresh chain.
**Errors**: `DEVICE_NOT_FOUND`, `CANNOT_REVOKE_CURRENT` (use `auth.session.revoke`).
**Sensitive**: none new. Gateway logs `fn` + result.

---

#### `security.loginHistory.list`
**Dir** C→G · **Auth** session · Reference: "Login history".
**Payload**: `{ "cursor": "<str|null>", "limit": 20 }`.
**Success `data`**: `entries[]` — `{ at, method: "faceid|password|otp", deviceName, cityMasked, result: "success|failed" }`, `nextCursor`.
**Sensitive**
- IP → **OMIT** (client gets `cityMasked` only).
- Precise geolocation → **MASK** to city.
- Gateway may log page size, not entries.

---

#### `security.passcode.change`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Change passcode", "Set a new passcode", "Enter passcode" keypad.
**Payload** — both passcodes in `payload.secure` (JWE to auth service).
| field | location | type | rules |
|---|---|---|---|
| `currentPasscode` | `payload.secure` | string | 4–6 digits. |
| `newPasscode` | `payload.secure` | string | 4–6 digits; not in a weak-list; ≠ current. |

**Success `data`**: `{ "changed": true }`.
**Errors**: `PASSCODE_CURRENT_INVALID`, `PASSCODE_WEAK`, `PASSCODE_REUSED`.
**Sensitive**: both fields → **ENCRYPT** (JWE); stored only as a hash; never logged/echoed. Gateway sees `fn` + result.

---

#### `security.biometrics.set`
**Dir** C→G · **Auth** session + step-up · Reference: "Face ID / biometrics", "Face ID enabled".
**Payload**: `{ "enabled": bool, "credentialId": "<str, when enabling>", "publicKey": "<COSE key, when enabling>", "attestation": "<base64url, when enabling>" }`.
**Success `data`**: `{ "enabled": bool, "credentialId": "<str>" }`.
**Sensitive**: public key + attestation only — **no biometric template**. Not PII. Gateway logs `fn` + `enabled`.

---

#### `security.twoFactor.set`
**Dir** C→G · **Auth** session + step-up · Reference: "Two-factor auth", "SMS + biometrics".
**Payload**: `{ "enabled": bool, "primaryMethod": "otp" | "faceid" }`.
**Success `data`**: `{ "enabled": bool, "primaryMethod": "<str>" }`.
**Sensitive**: none. Gateway logs `fn` + config.

---

#### `push.device.register`
**Dir** C→G · **Auth** session · Reference: "Push notifications are controlled in More › Notifications."
**Payload**: `{ "pushToken": "<APNs/FCM token>", "platform": "ios|android", "appBuild": int }`.
**Success `data`**: `{ "registered": true, "notificationTopics": ["security","payments","offers"] }`.
**Sensitive**
- `pushToken` → **treat as a secret handle**: encrypt at rest, not written to app logs, rotates on reinstall. Gateway may log presence/length only, not the value.

---

#### `push.device.unregister`
**Dir** C→G · **Auth** session · **Payload**: `{ "pushToken": "<str>" }` · **Success `data`**: `{ "registered": false }`. **Sensitive**: `pushToken` as above.

---

#### `svc.sms.sendOtp`  *(gateway → service)*
**Dir** G→S · **Auth** s2s (mTLS + HMAC) · Called by the auth service (not the gateway itself) to the SMS provider connector.
**Payload**: `secure { "msisdn": "+9767000XXXX", "template": "otp_login", "code": "<6 digits>", "ttlSec": 300 }`.
**Success `data`**: `{ "providerMessageId": "<str>", "segments": 1 }`.
**Sensitive**
- `msisdn`, `code` → **ENCRYPT** (JWE to SMS connector) + only ever inside the trusted boundary. Connector logs `providerMessageId` + masked msisdn only. The code is purged from the connector after send.
- **Never** crosses the client boundary.

---

#### `svc.notification.dispatch`  *(gateway → service)*
**Dir** G→S · **Auth** s2s · Fan-out of a domain event to push/SMS/in-app.
**Payload**: `{ "userRef": "<str>", "topic": "payments", "templateId": "transfer_sent", "params": { "amountMasked": "•••'200 ₮" }, "dedupeId": "<str>" }`.
**Sensitive**: `params` must contain **pre-masked** values only — the notification service is
not allowed to receive raw amounts/PANs/IBANs. Enforced by template schema.

---

### Onboarding / KYC

---

#### `onboarding.start`
**Dir** C→G · **Auth** public · **Rate limit** 10/h/device.
Reference: "Which of these sounds like you?" → *I already bank with RightBank* (code + DAN) vs
*I'm new to RightBank* (full KYC).
**Payload**: `{ "path": "existing_customer" | "new_customer", "deviceName": "<str>" }`.
**Success `data`**: `{ "onboardingTicket": "<str>", "expiresInSec": 1800, "steps": ["id_docs","emongolia","phone","profile","account_open","review"] }`.
The `onboardingTicket` is a scoped, pre-auth bearer used in `Authorization` for all
`onboarding.*` calls until an account exists.
**Sensitive**: `deviceName` PII-lite. Ticket → credential. Gateway logs `path` only.

---

#### `onboarding.existing.verifyCode`
**Dir** C→G · **Auth** onboarding ticket · Reference: "customer code" + E‑Mongolia.
**Payload**: `secure { "customerCode": "<str>" }`, plain `{ }`.
**Success `data`**: `{ "matched": true, "maskedName": "E•••• G••••", "nextStep": "emongolia" }`.
**Errors**: `ONBOARDING_CODE_INVALID` (generic, no enumeration), `ONBOARDING_CODE_LOCKED`.
**Sensitive**
- `customerCode` → **ENCRYPT** (JWE to onboarding/KYC service). Not logged.
- `maskedName` → **MASK** (initials only) until identity is DAN-verified.

---

#### `onboarding.kyc.document.createUpload`
**Dir** C→G · **Auth** onboarding ticket · Reference step 1: "Photograph your ID" — ID front / ID back / Selfie rows.
**Payload**: `{ "docType": "id_front" | "id_back" | "selfie", "contentType": "image/jpeg", "byteSize": int, "sha256": "<hex>" }`.
**Success `data`**: `{ "uploadRef": "<str>", "uploadUrl": "https://uploads.rightbank.mn/…", "headers": { … }, "expiresInSec": 300, "maxBytes": 8388608 }`.
Client `PUT`s the image bytes directly to `uploadUrl` (a pre-signed, single-use, write-only
object URL) — **image bytes never go through `/api/gateway`**.
**Errors**: `KYC_DOC_TYPE_INVALID`, `KYC_FILE_TOO_LARGE`, `KYC_UPLOAD_QUOTA`.
**Sensitive**
- The upload URL → **write-only, expiring, unguessable**; not reused; not logged in full.
- Uploaded ID/selfie images are **PII + potentially biometric**: stored encrypted at rest in a
  restricted KYC bucket, **auto-deleted after retention** ([OPEN QUESTION] — the reference has
  no stated KYC retention; a 14‑day auto-delete is used elsewhere in the brief for uploaded
  photos, but KYC docs likely have a regulatory minimum — flag).
- No image URL is ever returned to a client-facing read function.

---

#### `onboarding.kyc.document.commit`
**Dir** C→G · **Auth** onboarding ticket · Marks an upload complete and enqueues verification.
**Payload**: `{ "uploadRef": "<str>" }` (repeat per doc).
**Success `data`**: `{ "docType": "id_front", "received": true, "checks": "pending" }`.
Downstream: `svc.kyc.verifyDocuments` (G→S).
**Sensitive**: `uploadRef` opaque. No image data in this call.

---

#### `onboarding.kyc.selfie.submit`
**Dir** C→G · **Auth** onboarding ticket · Liveness / "Selfie check".
**Payload**: `{ "uploadRef": "<selfie upload>", "livenessSignals": { … device SDK output … } }`.
**Success `data`**: `{ "liveness": "pass" | "review", "faceMatch": "pending" }`.
**Sensitive**
- `livenessSignals` may include face-geometry hints → treat as **biometric-derived**; encrypt
  to KYC service; not logged; deleted with the selfie image.
- Result exposed to client only as coarse status.

---

#### `onboarding.emongolia.confirm`
**Dir** C→G · **Auth** onboarding ticket · Reference: "Step 2 · Confirm with E-Mongolia".
**Payload**: `secure { "danAuthCode": "<from auth.emongolia.webhook>" }`, plain `{ "state": "<str>" }`.
Downstream: `svc.emongolia.exchangeCode` (G→S) → verified claims into the KYC service.
**Success `data`**: `{ "identityVerified": true, "registerNumberMasked": "УБ96••••••", "legalNameMasked": "Э•••••• Г••••••" }`.
**Sensitive**
- `danAuthCode` → **ENCRYPT** (JWE). One-time. Not logged.
- Full `registerNumber` / legal name → **OMIT** from client payload; only masked forms returned.
- Gateway sees `fn` + `state` (hashed) + boolean result.

---

#### `onboarding.profile.submit`
**Dir** C→G · **Auth** onboarding ticket · Reference: "name" step.
**Payload**
| field | location | type | req | rules |
|---|---|---|---|---|
| `displayName` | plain | string | yes | 1–60 chars; shown in the greeting ("Good morning, Erdene"). |
| `useIdName` | plain | bool | no | If true, legal name from DAN is used for records. |
| `email` | `payload.secure` | string | no | Reference shows an email on the profile row. |
| `contactPhone` | `payload.secure` | string | cond. | Only if not already established via OTP. |

**Success `data`**: `{ "profileSaved": true }`.
**Sensitive**
- `email`, `contactPhone` → **ENCRYPT** (JWE to profile service). Client reads them back only
  masked (`****1234`, `e•••@•••`).
- `displayName` is user-chosen and low-sensitivity but still PII — not logged in the clear.

---

#### `onboarding.account.open`
**Dir** C→G · **Auth** onboarding ticket + step-up · **Idempotency** required.
Reference: "Confirm opening the account".
**Payload**: `{ "productCode": "everyday_mnt", "acceptedTermsVersion": <int>, "purpose": "personal" }`.
**Success `data`**: `{ "applicationRef": "<str>", "status": "submitted_for_review", "estimatedReviewHours": 24 }`.
Reference end state: "Application submitted for review".
**Errors**: `KYC_INCOMPLETE`, `TERMS_VERSION_STALE`, `PRODUCT_UNAVAILABLE`, `DUPLICATE_APPLICATION`.
**Sensitive**: none new in payload. `applicationRef` opaque. Gateway logs `productCode` + status.

---

#### `onboarding.application.status`
**Dir** C→G · **Auth** onboarding ticket · Polling for review outcome.
**Payload**: `{ "applicationRef": "<str>" }`.
**Success `data`**: `{ "status": "submitted_for_review" | "approved" | "needs_branch_visit" | "declined", "message": "<localised>", "sessionBundle": { accessToken, refreshToken } }` — token bundle present **only** once `approved`.
Reference: "One last step — visit a branch", "Simulate branch visit & approval (demo)".
**Sensitive**: decline reason is **coarse** (`message` from catalog); the real reason stays server-side. Token bundle → credentials.

---

#### `svc.kyc.verifyDocuments`  *(gateway → service)*
**Dir** G→S · **Auth** s2s · Orchestrator → KYC verification engine.
**Payload**: `{ "applicationRef", "docRefs": ["…"], "danClaimsRef": "<str>" }` — references only; the KYC engine already holds the images/claims.
**Success `data`**: `{ "decision": "pass" | "manual_review" | "fail", "reasons": ["face_mismatch", …] }` — reasons stay internal.
**Sensitive**: no raw PII in this call — pointer-only design so the orchestrator/gateway never touch document bytes or the register number.

---

#### `svc.emongolia.exchangeCode`  *(gateway → service)*
**Dir** G→S · **Auth** s2s · KYC service → DAN connector.
**Payload**: `secure { "danAuthCode": "<str>", "state": "<str>" }`.
**Success `data`**: `secure { "registerNumber", "legalNameCyrillic", "dateOfBirth", "address", "documentValidity" }` — encrypted response; only the KYC service decrypts and persists it, then emits masked derivations.
**Sensitive**: entire response is regulated PII → stays inside the KYC boundary; the gateway relays ciphertext.

---

### Profile, preferences, limits

---

#### `profile.get`
**Dir** C→G · **Auth** session · Reference: avatar "EG", name, phone, "✓ Identity verified", email row.
**Payload**: `{}`.
**Success `data`**
| field | type | notes |
|---|---|---|
| `displayName` | string | "Erdene". |
| `legalNameMasked` | string | "Э•••••• Г••••••". |
| `phoneMasked` | string | "****1234". |
| `emailMasked` | string | "e•••@g•••". |
| `identityVerified` | bool | |
| `registerNumberMasked` | string | "УБ96••••••". |
| `avatarMonogram` | string | "EG". |
| `memberSince` | string (date) | |

**Sensitive**
- `phone`, `email`, `legalName`, `registerNumber` → **MASK**; full values never leave the
  profile/KYC service. The client has no function that returns them unmasked.
- Gateway may log that `profile.get` was called; not the response body.

---

#### `profile.update`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Edit" profile — display name, "use ID name".
**Payload**
| field | location | type | rules |
|---|---|---|---|
| `displayName` | plain | string | 1–60 chars. |
| `useIdName` | plain | bool | |
| `email` | `payload.secure` | string | optional change; JWE to profile service. |

**Success `data`**: `{ "updated": true, "emailMasked": "e•••@g•••" }`.
**Errors**: `PROFILE_NAME_INVALID`, `EMAIL_INVALID`.
**Sensitive**: `email` → **ENCRYPT**; response masked only. `displayName` PII — redacted in logs.

---

#### `profile.loginPicture.set`
**Dir** C→G · **Auth** session · Reference: "Login screen picture", "Use your own photo behind the login screen", toast "Login picture updated".
**Payload**: `{ "uploadRef": "<from a createUpload-style flow>" }` **or** `{ "presetId": "<str>" }`.
**Success `data`**: `{ "loginPictureId": "<str>", "variant": "custom" | "preset" }`.
**Sensitive**
- A user-supplied login photo is **PII (may show a face)**. Stored in a private per-user
  bucket; served to the pre-auth screen via a **short-lived signed URL** minted only for that
  install; the raw storage URL is **OMITTED** from responses.
- [OPEN QUESTION] auto-delete policy for a replaced login picture (the brief mentions a 14‑day
  auto-delete for uploaded photos — apply here: purge the previous image on replace/remove).

---

#### `profile.loginPicture.remove`
**Dir** C→G · **Auth** session · Toast: "Login picture removed".
**Payload**: `{}`. **Success `data`**: `{ "loginPictureId": null }`. Server hard-deletes the stored image. **Sensitive**: as above.

---

#### `preferences.get` / `preferences.update`
**Dir** C→G · **Auth** session · Reference: Appearance (mode Light/Dark · theme "Knight" etc. · graphics Low/Medium/High/Ultra), Notifications, Sound & haptics, Language (English/Mongolian).
**`get` Payload**: `{}` → **`data`**: `{ "mode":"light|dark", "themeName":"knight", "graphics":"high", "language":"en-MN", "sound":true, "haptics":true, "notifications": { "payments":true, "offers":false, "security":true } }`.
**`update` Payload**: any subset of the above. **`data`**: the full resolved preferences object.
**Sensitive**: none. Fully loggable.

---

#### `limits.get`
**Dir** C→G · **Auth** session · Reference: "Daily transfer limit 20'000'000₮", "Interbank per transaction 10'000'000₮", "Foreign currency limit $50'000 (Annual, per regulation)".
**Payload**: `{}`.
**Success `data`**: `limits[]` — `{ key:"daily_transfer", label, amount:{value,currency}, period:"day|transaction|year", editable:bool, regulatoryFloorHit:bool }`.
**Sensitive**: none (these are the user's own configured limits, not third-party data). Loggable.

---

#### `limits.update`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
**Payload**: `{ "key":"daily_transfer", "amount": { "value":"5000000.00", "currency":"MNT" } }`.
**Success `data`**: `{ "key", "amount", "effectiveAt" }`.
**Errors**: `LIMIT_ABOVE_REGULATORY_MAX`, `LIMIT_NOT_EDITABLE`, `LIMIT_BELOW_MIN`.
**Sensitive**: none new.

---

### Accounts, transactions, documents

---

#### `accounts.list`
**Dir** C→G · **Auth** session · Reference: Everyday (MNT current), Savings (MNT), US Dollar (FX), Chinese Yuan (FX); hero card balance `987'654'321.00 ₮`; "3 of 5 current accounts used".
**Payload**: `{ "include": ["balances","rates"] }`.
**Success `data`**
| field | type | notes |
|---|---|---|
| `accounts[]` | array | see below |
| `accounts[].accountRef` | string | opaque per-user handle (**not** the IBAN, not the ledger id). |
| `accounts[].name` | string | "Everyday". |
| `accounts[].kind` | enum | `current` \| `savings` \| `fx`. |
| `accounts[].currency` | string | `MNT` \| `USD` \| `CNY`. |
| `accounts[].ibanMasked` | string | `MN32 0000 ••• 0127`. |
| `accounts[].balance` | money | `{ value, currency }`. |
| `accounts[].available` | money | |
| `accounts[].rate` | number | interest %, nullable. |
| `accounts[].accrued` | money | nullable. |
| `currentAccountUsage` | object | `{ used: 3, max: 5 }`. |

**Sensitive**
- **IBAN** → **MASK** in list views (`MN32 0000 ••• 0127`). Full IBAN only via `accounts.get`
  for the user's **own** account (still their data, but avoid needless exposure / shoulder-surf).
- `accountRef` → opaque, non-sequential → **prevents enumeration**; safe to log.
- Balances are the user's own → not masked to the user, but **redacted in gateway logs**
  (money fields never logged).

---

#### `accounts.get`
**Dir** C→G · **Auth** session · Account detail (rename, close, certificate, full IBAN, "type · rate% · accrued").
**Payload**: `{ "accountRef": "<str>" }`.
**Success `data`**: all of the list row **plus** `ibanFull` (own account only), `swiftBic`, `openedAt`, `statementsAvailable:bool`, `productTariffUrl`.
**Errors**: `NOT_FOUND` (handle not owned by caller).
**Sensitive**
- `ibanFull` → returned **only** for the authenticated owner's own account; **MASK** everywhere
  else; not logged.
- Gateway routes on `accountRef` without needing the IBAN.

---

#### `accounts.open`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "＋ Open a new account", "3 of 5 current accounts used · savings and deposits do not count".
**Payload**: `{ "productCode": "everyday_mnt" | "fx_usd" | "fx_cny" | "savings_mnt", "acceptedTariffVersion": int }`.
**Success `data`**: `{ "accountRef", "ibanFull", "name", "status": "active", "currency" }`.
**Errors**: `ACCOUNT_LIMIT_REACHED` ("You're using all 5 current accounts"), `PRODUCT_UNAVAILABLE`, `TARIFF_VERSION_STALE`.
**Sensitive**: `ibanFull` → owner-only, not logged.

---

#### `accounts.rename`
**Dir** C→G · **Auth** session · **Payload**: `{ "accountRef", "name": "<1–40 chars>" }` · **`data`**: `{ "accountRef", "name" }`. **Sensitive**: none.

---

#### `accounts.close`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
**Payload**: `{ "accountRef", "transferRemainderToAccountRef": "<str|null>", "reason": "<enum>" }`.
**Success `data`**: `{ "status": "closing" | "closed", "residualSwept": money | null }`.
**Errors**: `ACCOUNT_HAS_BALANCE` (needs a sweep target), `ACCOUNT_HAS_PENDING`, `PRIMARY_ACCOUNT_CANNOT_CLOSE`.
**Sensitive**: none new.

---

#### `accounts.reference.request`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Account reference · fee 30'000₮", "Official bank statement · fee 30'000₮", rendered as a **serif document**; "Verify this reference at …".
**Payload**: `{ "accountRef", "language": "en" | "mn", "addressee": "<free text, optional>", "purpose": "<enum>" }`.
**Success `data`**: `{ "documentRef", "verificationCode", "fee": money, "status": "generating" | "ready", "downloadTicket": "<short-lived>" }`.
Downstream: `svc.document.render` (G→S).
**Errors**: `INSUFFICIENT_FUNDS_FOR_FEE`, `ACCOUNT_INELIGIBLE`.
**Sensitive**
- `addressee` may contain a third party's name → PII → **ENCRYPT** to the document service;
  not logged.
- The rendered PDF contains the **full IBAN, full legal name, register number** → stored
  encrypted; retrieved only via a **single-use, short-TTL `downloadTicket`** exchanged at a
  separate signed download endpoint (not `/api/gateway`, no bytes through the gateway).
- `verificationCode` lets a third party verify authenticity without exposing account data —
  safe to show.

---

#### `accounts.statement.generate`
**Dir** C→G · **Auth** session · **Idempotency** required (billable if PDF fee applies).
Reference: "Account statements" (PDF/CSV), toast "Statement generated".
**Payload**: `{ "accountRef", "from": "<date>", "to": "<date>", "format": "pdf" | "csv" }`.
**Success `data`**: `{ "documentRef", "format", "rowCount", "downloadTicket", "expiresInSec": 120 }`.
**Errors**: `DATE_RANGE_INVALID`, `RANGE_TOO_LARGE`.
**Sensitive**
- Statement content = full transaction history + counterparties + IBAN → same download-ticket
  pattern; bytes never traverse `/api/gateway`; document auto-expires from the temp store.

---

#### `accounts.certificate.request`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Account certificate", toast "Certificate requested".
**Payload**: `{ "accountRef", "type": "balance" | "account_holder" | "tax", "year": int (tax only), "language": "en"|"mn" }`.
**Success `data`**: `{ "documentRef", "status": "generating" | "ready", "downloadTicket", "fee": money }`.
**Sensitive**: as `accounts.reference.request` — contains full identity + balance; download-ticket only.

---

#### `transactions.list`
**Dir** C→G · **Auth** session · Reference: "Recent activity" / "See all"; rows = emoji icon, merchant, `category · date · time`, signed amount; grouping by day; empty state "No transactions yet".
**Payload**
| field | type | req | rules |
|---|---|---|---|
| `accountRef` | string | no | Omit → all accounts. |
| `cursor` | string | no | Opaque forward cursor; absent = newest page. |
| `limit` | int | no | 1–50, default 25. |
| `direction` | enum | no | `credit` \| `debit` \| `all`. |

**Success `data`**
| field | type | notes |
|---|---|---|
| `groups[]` | array | `{ date, items[] }` (day grouping). |
| `items[].txnRef` | string | opaque handle. |
| `items[].merchant` | string | display name. |
| `items[].category` | string | e.g. "Groceries". |
| `items[].icon` | string | emoji, per reference. |
| `items[].amount` | money | signed; `−` = U+2212. |
| `items[].postedAt` | string | |
| `items[].status` | enum | `posted` \| `pending` \| `hold`. |
| `nextCursor` | string\|null | |

**Sensitive**
- `merchant` can reveal spending behaviour (health, religion, etc.) → **not logged** at the
  gateway; TLS only; excluded from analytics events.
- Counterparty account numbers → **OMIT** from list items (available, masked, only in
  `transactions.get`).
- `txnRef` opaque → no enumeration. `cursor` is an opaque signed token, not an offset id.

---

#### `transactions.get`
**Dir** C→G · **Auth** session · **Payload**: `{ "txnRef": "<str>" }`.
**Success `data`**: list item fields **plus** `counterpartyNameMasked`, `counterpartyIbanMasked`,
`reference`, `feeBreakdown[]`, `fxRateApplied`, `runningBalanceMasked`, `receiptDownloadTicket`.
**Sensitive**
- Counterparty name/IBAN → **MASK** (`B•••• B••••`, `MN•• •••• 8841`). Full values never
  client-visible.
- `reference` free-text may hold PII → returned to the account owner only, not logged.

---

#### `transactions.search`
**Dir** C→G · **Auth** session · **Rate limit** 30/min/user. Reference: "merchant or category", empty "Nothing matches that search."
**Payload**: `{ "query": "<1–64 chars>", "accountRef": "<str|null>", "from": "<date|null>", "to": "<date|null>", "cursor": "<str|null>" }`.
**Success `data`**: same shape as `transactions.list`.
**Sensitive**: `query` may itself be sensitive (a person's name, a clinic) → **not logged**; search executed server-side only, no third-party search index receives raw queries [OPEN QUESTION if an external search service is used].

---

#### `analytics.spendingTrend.get`
**Dir** C→G · **Auth** session · Reference: "Monthly spending trend" / Account "Analyser" charts (paid/interest/grid/axis palette).
**Payload**: `{ "accountRef": "<str|null>", "months": 6, "breakdown": "category" | "merchant" | "none" }`.
**Success `data`**: `{ "series": [ { "period":"2026-07", "total": money, "byCategory": [ { "category", "amount" } ] } ], "topMerchants": [ { "merchant", "amount", "count" } ] }`.
**Sensitive**: aggregated but still behaviour-revealing (`byCategory`, `topMerchants`) → same log/analytics exclusion as `transactions.list`.

---

#### `svc.ledger.query` *(gateway → service)*
**Dir** G→S · **Auth** s2s · Read-through the gateway uses for balances/history.
**Payload**: `{ "userRef", "accountRef" | null, "range", "cursor", "projection": "list|detail" }`.
**Success `data`**: ledger rows with full counterparty data — the **transaction service**
masks/strips before the gateway shapes the client response. The gateway never persists the
unmasked rows.

---

#### `svc.document.render` *(gateway → service)*
**Dir** G→S · **Auth** s2s · Renders statement/reference/certificate PDFs.
**Payload**: `{ "documentRef", "templateId", "dataRef" }` — a **pointer** to the already-assembled
data set held by the document service; no PII in this call. Output lands in an encrypted temp
store keyed by `documentRef`; retrieval is via `downloadTicket` only.

---

### FX / treasury

---

#### `fx.rates.get`
**Dir** C→G · **Auth** session · Reference: "Treasury FX rates", "Treasury rates for larger amounts", "Treasury prices from …".
**Payload**: `{ "base": "MNT", "quotes": ["USD","CNY","EUR", …] }`.
**Success `data`**: `{ "asOf": "<ISO>", "rates": [ { "pair":"USD/MNT", "buy":"3450.00", "sell":"3465.00", "retailSpread":"…", "treasuryThreshold": money } ] }`.
**Sensitive**: none (public market data). Loggable.

---

#### `fx.quote.create`
**Dir** C→G · **Auth** session · Reference: treasury quote flow ("· treasury rate").
**Payload**: `{ "sellAccountRef", "buyAccountRef", "sellAmount": money | null, "buyAmount": money | null }` (exactly one of the two amounts).
**Success `data`**: `{ "quoteRef", "rate", "sellAmount": money, "buyAmount": money, "fee": money, "expiresAt": "<ISO, ~60–120 s>" }`.
**Errors**: `FX_PAIR_UNSUPPORTED`, `AMOUNT_BELOW_MIN`, `AMOUNT_ABOVE_TREASURY_MAX`.
**Sensitive**: none new. `quoteRef` opaque, single-use.

---

#### `fx.conversion.execute`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Convert", "Amount to convert".
**Payload**: `{ "quoteRef": "<str>" }` (all economics locked in the quote).
**Success `data`**: `{ "conversionRef", "status": "done", "rate", "sellAmount": money, "buyAmount": money, "fee": money, "newBalancesMasked": { "<sellAccountRef>": "…", "<buyAccountRef>": "…" } }`.
**Errors**: `QUOTE_EXPIRED` ("Rate changed — get a new quote"), `INSUFFICIENT_FUNDS`, `QUOTE_ALREADY_USED`.
**Sensitive**: money fields not logged. Both accounts are the user's own.

---

### Transfers

---

#### `transfer.iban.resolve`
**Dir** C→G · **Auth** session · **Rate limit** 30/min/user (**anti-enumeration**).
Reference: "✓ Valid IBAN — press Find", "✓ IBAN resolved automatically", "This IBAN fails its check digits", "8 characters for the head office, 11 for a branch" (SWIFT/BIC).
**Payload**: `{ "iban": "<string>", "context": "domestic" | "swift" }`.
**Success `data`**: `{ "valid": true, "bank": { "code":"khan", "name":"Khan Bank", "brandColor":"#00529B" }, "beneficiaryNameMasked": "B•••• B••••", "instant": true }`.
**Errors**: `IBAN_CHECK_DIGITS_FAILED` ("This IBAN fails its check digits"), `IBAN_UNKNOWN_BANK`, `IBAN_RESOLVE_UNAVAILABLE`.
**Sensitive**
- Input `iban` → **not logged** (it's a third party's account). The response deliberately
  returns only a **masked** beneficiary name — never the full name — so the endpoint can't be
  used to harvest "which name owns IBAN X".
- Rate limiting + masked-only output are the abuse controls; result is not cached across users.

---

#### `transfer.beneficiaries.list`
**Dir** C→G · **Auth** session · Reference: "Saved beneficiaries".
**Payload**: `{}`. **Success `data`**: `beneficiaries[]` — `{ beneficiaryRef, nickname, bankName, ibanMasked, lastUsedAt, currency }`.
**Sensitive**
- `iban` → **MASK**. Full IBAN retrievable only transiently when the user selects the payee to
  send (server resolves `beneficiaryRef` → IBAN internally; the client never needs the full
  value back).
- `nickname` PII → not logged.

---

#### `transfer.beneficiaries.save`
**Dir** C→G · **Auth** session · **Idempotency** required.
Reference: "＋ Save this transfer", "Saved beneficiaries", toast "Saved — find it under Saved transfers".
**Payload**: `secure { "iban": "<str>", "beneficiaryName": "<str>" }`, plain `{ "nickname": "<str>", "bankCode": "<str>", "currency": "MNT", "swiftBic": "<str|null>" }`.
**Success `data`**: `{ "beneficiaryRef", "nickname", "ibanMasked" }`.
**Sensitive**
- `iban`, `beneficiaryName` → **ENCRYPT** (JWE to the transfer service) — third-party PII/account
  data. Stored encrypted at rest, decrypted only when posting a transfer. Gateway sees
  `nickname` + `bankCode` only.

---

#### `transfer.beneficiaries.delete`
**Dir** C→G · **Auth** session · **Payload**: `{ "beneficiaryRef": "<str>" }` · **`data`**: `{ "deleted": true }`. **Sensitive**: none new.

---

#### `transfer.saved.list`
**Dir** C→G · **Auth** session · Reference: "Saved transfers".
**Payload**: `{}`. **Success `data`**: `saved[]` — `{ savedTransferRef, label, fromAccountRef, beneficiaryRef, amount: money|null, reference }`.
**Sensitive**: `reference` free text may hold PII → not logged. `amount` not logged.

---

#### `transfer.domestic.quote`
**Dir** C→G · **Auth** session · Reference: "Transfer fee", "Beneficiary receives the full amount", "This is not an instant transfer" (interbank).
**Payload**: `{ "fromAccountRef", "toIban" | "beneficiaryRef", "amount": money, "reference": "<str>" }`.
**Success `data`**: `{ "quoteRef", "fee": money, "beneficiaryReceives": money, "instant": bool, "clearingEta": "<str>", "requiresStepUp": bool, "requiresInvoice": bool }`.
**Errors**: `INSUFFICIENT_FUNDS` ("Not enough in that account"), `AMOUNT_BELOW_MIN`, `LIMIT_EXCEEDED` (daily/interbank), `IBAN_INVALID`.
**Sensitive**: `toIban` (if raw) → not logged. Prefer `beneficiaryRef`. `amount`/`fee` not logged.

---

#### `transfer.domestic.execute`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Bank transfer", toast "Transfer sent"; "Where is my transfer?".
**Payload**
| field | location | type | req | rules |
|---|---|---|---|---|
| `quoteRef` | plain | string | yes* | From `transfer.domestic.quote`. |
| `fromAccountRef` | plain | string | yes | Must match the quote. |
| `beneficiaryRef` | plain | string | cond. | Preferred over a raw IBAN. |
| `toIban` | `payload.secure` | string | cond. | Only if no `beneficiaryRef`; JWE to transfer service. |
| `beneficiaryName` | `payload.secure` | string | cond. | With a raw IBAN. |
| `amount` | plain | money | yes | Must equal the quoted amount. |
| `reference` | `payload.secure` | string | no | Free text → may contain PII. |
| `saveTransfer` | plain | bool | no | "＋ Save this transfer". |

*If `quoteRef` omitted, server re-quotes and may return `STEP_UP_REQUIRED`/`QUOTE_REQUIRED`.

**Success `data`**: `{ "transferRef", "status": "SENT" | "PROCESSING", "fee": money, "beneficiaryReceives": money, "postedAt", "newBalanceMasked", "trackingRef" }`.
**Errors**: `INSUFFICIENT_FUNDS`, `LIMIT_EXCEEDED`, `QUOTE_EXPIRED`, `STEP_UP_TOKEN_INVALID`, `BENEFICIARY_BANK_REJECTED`, `DUPLICATE_TRANSFER` (idempotency replay returns the original with `meta.idempotent:true`).

**Sensitive**
- `toIban`, `beneficiaryName`, `reference` → **ENCRYPT** (JWE). The gateway routes on
  `fromAccountRef` + `amount` presence + `quoteRef` **without decrypting** the payee blob.
- `amount`, `fee`, `newBalanceMasked` → money → **never logged**; balance returned masked.
- Error messages must never echo the payee name/IBAN or the counterparty bank's raw rejection.
- Idempotency key ↔ amount correlation must not appear in logs.

---

#### `transfer.phone.execute`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: Transfer sheet "Phone" tab ("Нэр · Beneficiary name", "phone").
**Payload**: `secure { "phone": "<msisdn>" }`, plain `{ "fromAccountRef", "amount": money, "reference": "<in secure>", "quoteRef" }`.
**Success `data`**: `{ "transferRef", "status", "resolvedBeneficiaryMasked": "B•••• ••41", "fee": money }`.
**Errors**: `PHONE_NOT_REGISTERED` ("No RightBank customer on that number"), `INSUFFICIENT_FUNDS`, `LIMIT_EXCEEDED`.
**Sensitive**
- `phone` (payee's number) → **ENCRYPT** (JWE); the resolved payee is returned **masked only**;
  full name never returned. Anti-enumeration: same rate class as transfers, generic
  not-found message.

---

#### `transfer.swift.quote`
**Dir** C→G · **Auth** session · Reference: "SWIFT · Before you start", "SWIFT · Sender details", "You pay our fee, the beneficiary pays theirs" / "Guaranteed — beneficiary credited in full", "Of the net SWIFT fee", "Invoice or contract · required above 50'000'000₮".
**Payload**
| field | location | type | req | rules |
|---|---|---|---|---|
| `fromAccountRef` | plain | string | yes | An FX account. |
| `beneficiaryIban` | `payload.secure` | string | yes | JWE. |
| `swiftBic` | `payload.secure` | string | yes | 8 or 11 chars. |
| `beneficiaryName` | `payload.secure` | string | yes | JWE. |
| `beneficiaryAddress` | `payload.secure` | string | yes | JWE. |
| `amount` | plain | money | yes | Currency = account currency. |
| `feeOption` | plain | enum | yes | `OUR` (guaranteed full) \| `SHA`. |
| `purposeCode` | plain | string | yes | Regulatory purpose of payment. |

**Success `data`**: `{ "quoteRef", "bankFee": money, "correspondentFeeEstimate": money, "beneficiaryReceivesEstimate": money, "fxRate", "invoiceRequired": bool, "expiresAt" }`.
**Sensitive**
- All beneficiary identity/address fields → **ENCRYPT** (JWE to the SWIFT service). Gateway
  routes on `fromAccountRef` + `amount` + `feeOption` only.

---

#### `transfer.swift.execute`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "SWIFT transfers", "This is not an instant transfer", invoice upload above threshold.
**Payload**: `{ "quoteRef", "fromAccountRef", "senderDetails": <in secure>, "invoiceUploadRef": "<str|null>", "amount": money }` — `senderDetails` (name, address, register number) and any beneficiary fields carried via `payload.secure`.
**Success `data`**: `{ "transferRef", "status": "SUBMITTED", "bankFee": money, "estimatedCredit": "<date>", "trackingRef" }`.
**Errors**: `INVOICE_REQUIRED` ("Attach the invoice or contract"), `SWIFT_FIELD_INVALID`, `FX_LIMIT_EXCEEDED` ("Foreign currency limit reached"), `SANCTIONS_HOLD` (generic: "This transfer needs a manual check").
**Sensitive**
- `senderDetails` (incl. **register number**, address) and beneficiary block → **ENCRYPT**.
- `invoiceUploadRef` → the invoice doc (may contain third-party commercial data) is uploaded
  out-of-band via a pre-signed URL, stored encrypted, retained per regulation, **never**
  returned to a client read; only referenced by handle.
- `SANCTIONS_HOLD` and any correspondent-bank rejection must be surfaced with a **generic**
  message; the real reason stays server-side with `traceId`.

---

#### `transfer.status.get`
**Dir** C→G · **Auth** session · Reference: "Where is my transfer?" timeline tracker.
**Payload**: `{ "trackingRef": "<str>" }` **or** `{ "transferRef": "<str>" }`.
**Success `data`**: `{ "status": "SENT|PROCESSING|CREDITED|RETURNED|MANUAL_CHECK", "steps": [ { "key":"submitted", "at", "done":true }, … ], "beneficiaryReceives": money, "returnReason": "<localised|null>" }`.
**Sensitive**: `returnReason` from catalog only. `beneficiaryReceives` money → not logged.

---

#### `svc.ledger.postTransfer` / `svc.swift.submit` *(gateway → service)*
**Dir** G→S · **Auth** s2s · The gateway (after step-up + idempotency checks) forwards the
decrypted-by-service instruction. **Payload** includes the `payload.secure` blob **unchanged**
(the ledger/SWIFT service decrypts it). The gateway attaches `{ userRef, idempotencyKey,
actionTokenId, requestId }`. Services return the canonical `data` the gateway relays. Raw
account numbers exist only inside these services.

---

### Bills & billing

---

#### `bills.inbox.list`
**Dir** C→G · **Auth** session · Reference: "4 билл ирсэн", "Billing", "Bills paid in the app".
**Payload**: `{ "status": "unpaid" | "all", "cursor": "<str|null>" }`.
**Success `data`**: `bills[]` — `{ billRef, biller: { name, category, icon }, invoiceNumberMasked, amount: money, dueDate, status: "unpaid|paid|overdue", periodLabel }`, `unpaidCount`, `nextCursor`.
**Sensitive**
- `invoiceNumber` → **MASK** in the list (`INV-•••14`); full value only in `bills.get`.
- Biller identity can be sensitive (utility, medical) → not logged at the gateway.

---

#### `bills.search`
**Dir** C→G · **Auth** session · Reference: "Хайх · Find your bill", "merchant or category".
**Payload**: `{ "query": "<1–64>", "cursor": "<str|null>" }` · **`data`**: same shape as `bills.inbox.list`.
**Sensitive**: `query` not logged.

---

#### `bills.get`
**Dir** C→G · **Auth** session · Reference: "Invoice 2026-114 dated 02 Aug 2026", "invoice-2026-114.pdf".
**Payload**: `{ "billRef": "<str>" }`.
**Success `data`**: full bill — `invoiceNumber` (full, owner only), `issuedAt`, `lineItems[]`, `payToAccountMasked`, `qpayInvoiceRef` (opaque), `pdfDownloadTicket`.
**Sensitive**
- `invoiceNumber` full → owner-only, not logged.
- `qpayInvoiceRef` → **opaque handle**, never the raw QPay invoice id (see §9). PDF via
  download ticket, bytes off-gateway.

---

#### `bills.pay`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: pay one or many; `invoiceIds:[…]`, toast confirmations.
**Payload**
| field | type | req | rules |
|---|---|---|---|
| `fromAccountRef` | string | yes | |
| `billRefs` | string[] | yes | 1–20 bills, paid atomically per bill. |
| `quoteRef` | string | no | For fee preview parity. |

**Success `data`**: `{ "results": [ { "billRef", "status": "paid" | "failed", "paidAmount": money, "receiptRef", "failReason": "<localised|null>" } ], "newBalanceMasked" }`.
**Errors**: `INSUFFICIENT_FUNDS`, `BILL_ALREADY_PAID` (`CONFLICT`), `BILL_EXPIRED`, `PARTIAL_FAILURE` (200 with per-item status).
**Sensitive**
- The gateway maps `billRefs` → QPay invoice ids **inside the billing service**; the raw QPay
  invoice/payment ids **never** appear in the client payload or gateway logs.
- `amount`/`balance` money → not logged. Idempotency key not correlated to amount in logs.

---

#### `bills.autopay.set`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Recurring on your cards", autopay concept.
**Payload**: `{ "billerRef", "fromAccountRef", "enabled": bool, "cap": money | null, "dayOfMonth": int | null }`.
**Success `data`**: `{ "autopayRef", "enabled", "cap", "dayOfMonth" }`.
**Sensitive**: none new. `cap` money → not logged.
**Standing-rule note:** this creates persistent configuration — always step-up; changes are
audited and a confirmation notification is sent.

---

#### `bills.sms.set`
**Dir** C→G · **Auth** session · Reference: "SMS notification fee", toasts "SMS notification on/off".
**Payload**: `{ "enabled": bool }` · **`data`**: `{ "enabled", "monthlyFee": money }`. **Sensitive**: none.

---

#### `bills.webhook.issued`  *(external webhook → gateway)*
**Dir** W→G · **Auth** signed (biller-aggregator HMAC) · **Idempotency** dedupe `{provider, providerEventId}` 30 d.
A new bill was issued for a customer → creates a `bills.inbox` entry + triggers a notification.
**Payload**: `plain { providerEventId, billerCode, category }`, `secure { customerRegisterNumberOrMsisdn, invoiceNumber, amount, dueDate, lineItems }` (encrypted to the billing service, which matches it to a `userRef`).
**Success `data`**: `{ "accepted": true }`.
**Errors**: `WEBHOOK_SIGNATURE_INVALID`, `WEBHOOK_CUSTOMER_UNMATCHED` (202 + queued for manual match).
**Sensitive**
- The customer matching key (register number / msisdn) and invoice details → **ENCRYPT** to the
  billing service; the gateway routes on `billerCode` only and cannot see who the bill is for.
- Raw invoice numbers never surface unmasked to clients.

---

### QPay & scan-to-pay

---

#### `qpay.code.resolve`
**Dir** C→G · **Auth** session · **Rate limit** 30/min/user.
Reference: "Point at any QPay or bank code", resolves to "Nomin Supermarket / INV-88214 · QPay", amount, `PAY FROM` selector; "Scan a different code".
**Payload**: `{ "raw": "<scanned QR/deeplink string>", "kind": "qpay" | "bank" | "unknown" }`.
**Success `data`**
| field | type | notes |
|---|---|---|
| `paymentRequestRef` | string | opaque handle for this resolved code (not the QPay invoice id). |
| `merchant` | object | `{ name, category, logoInitials }`. |
| `invoiceNumberMasked` | string | `INV-•••14`. |
| `amount` | money | fixed, or `null` if payer-defined. |
| `amountEditable` | bool | |
| `expiresAt` | string | |
| `eligibleAccountRefs` | string[] | accounts allowed to pay. |

**Errors**: `QR_UNRECOGNISED` ("That code isn't a QPay or bank code"), `QR_EXPIRED`,
`MERCHANT_BLOCKED`, `QPAY_UNAVAILABLE`.
Downstream: `svc.qpay.queryPayment` (G→S).

**Sensitive**
- The raw QR often embeds the **QPay invoice id / merchant id**; the client sends it once to
  resolve, and the gateway/QPay-connector map it to an **opaque `paymentRequestRef`**. The raw
  QPay invoice id is **OMITTED** from the response and **not logged** at the gateway.
- `raw` input is logged only as a hash + `kind`.

---

#### `qpay.payment.execute`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Pay 146'200₮", toast on success.
**Payload**: `{ "paymentRequestRef": "<str>", "fromAccountRef": "<str>", "amount": money }` (`amount` required only when `amountEditable`).
**Success `data`**: `{ "paymentRef", "status": "PAID" | "PROCESSING", "merchantName", "paidAmount": money, "receiptRef", "newBalanceMasked" }`.
**Errors**: `INSUFFICIENT_FUNDS` ("Not enough in that account"), `QPAY_INVOICE_EXPIRED`,
`QPAY_ALREADY_PAID` (`CONFLICT`), `AMOUNT_MISMATCH` ("The amount changed — rescan"),
`QPAY_DECLINED` (generic), `LIMIT_EXCEEDED`.

**Sensitive**
- Client never handles the QPay invoice/payment id — only `paymentRequestRef` / `paymentRef`
  (opaque). The QPay-connector holds the mapping.
- Money fields not logged. Idempotency key not correlated to amount in logs.
- The QPay callback (`qpay.webhook.payment`) is the source of truth for final status;
  `PROCESSING` resolves via that webhook + `transfer.status.get`-style polling on `paymentRef`.

---

#### `qpay.receiveQr.get`
**Dir** C→G · **Auth** session · Reference: "My QR", "Let someone scan this to pay you".
**Payload**: `{ "amount": money | null, "reference": "<str|null>", "ttlMinutes": 30 }`.
**Success `data`**: `{ "qrPayload": "<string to render>", "receiveRef", "expiresAt", "amount": money|null }`.
**Sensitive**
- `qrPayload` encodes a **tokenised** handle to the user's account (a QPay merchant-style
  invoice), **not** the raw IBAN. So scanning it cannot reveal the account number.
- `reference` free text → not logged.

---

#### `qpay.webhook.payment`  *(external webhook → gateway)*
**Dir** W→G · **Auth** signed — QPay's HMAC signature in `X-RB-Request-Signature`, `X-RB-Service: qpay-connector`. **Idempotency** dedupe `{provider:"qpay", qpayPaymentId}` 30 d.
Webhook-intake function: QPay notifies of `paid` / `expired` / `refunded` / `failed` for an
invoice RightBank created (bill pay, scan-to-pay, receive-QR).

**Payload**
| field | location | type | notes |
|---|---|---|---|
| `providerEventId` | plain | string | QPay event id — dedupe. |
| `eventType` | plain | enum | `payment.paid` \| `payment.expired` \| `payment.refunded` \| `payment.failed`. |
| `qpayInvoiceId` | `payload.secure` | string | Raw QPay id — encrypted to the QPay-connector. |
| `qpayPaymentId` | `payload.secure` | string | Raw QPay id — encrypted. |
| `amount` | `payload.secure` | money | |
| `paidAt` | plain | string | |
| `merchantCode` | plain | string | RightBank merchant/sub-merchant code (safe). |

**Success `data`**: `{ "accepted": true }` (200; QPay expects a bare ack, retries on non-2xx).
**Errors**: `WEBHOOK_SIGNATURE_INVALID` (401), `WEBHOOK_INVOICE_UNKNOWN` (200 + logged),
`WEBHOOK_REPLAY` (200 + ignored).

**Sensitive**
- `qpayInvoiceId` / `qpayPaymentId` / `amount` → **ENCRYPT** (JWE to the QPay-connector). The
  gateway routes on `eventType` + `merchantCode` + `providerEventId` and **must not** log the
  secure block. The connector maps the QPay ids → internal `paymentRef` → `userRef` and emits
  a domain event; the raw QPay ids never leave the connector.
- Signature verification happens **before** any body parsing/logging.

---

#### `atm.cashInQr.get`
**Dir** C→G · **Auth** session · Reference: "Show your QR at any RightBank cash-in ATM to deposit notes."
**Payload**: `{ "toAccountRef": "<str>", "ttlMinutes": 10 }`.
**Success `data`**: `{ "qrPayload": "<str>", "expiresAt", "toAccountMasked" }`.
**Sensitive**: `qrPayload` is a short-lived tokenised deposit handle → no raw account number encoded. Not logged.

---

#### `svc.qpay.createInvoice` / `svc.qpay.queryPayment` *(gateway → service)*
**Dir** G→S · **Auth** s2s · The billing/scan services call the QPay-connector.
**`createInvoice` Payload**: `{ "internalRef", "amount", "callbackUrl", "merchantSubCode", "description" }` → **`data`**: `secure { "qpayInvoiceId", "qrPayload", "deeplinks" }`.
**`queryPayment` Payload**: `{ "internalRef" }` → **`data`**: `{ "status", "amount", "paidAt" }` (raw QPay ids stay in the connector).
**Sensitive**: raw QPay identifiers confined to the connector; callers use `internalRef`.

---

### Top-ups

---

#### `topup.account.execute`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: hero card "＋ Money", "top-up Everyday", toast "Top-up requested".
**Payload**: `{ "toAccountRef", "fromAccountRef" | "fromCardRef", "amount": money, "quoteRef": "<str|null>" }`.
**Success `data`**: `{ "topupRef", "status": "done" | "processing", "amount": money, "newBalanceMasked" }`.
**Errors**: `INSUFFICIENT_FUNDS`, `SOURCE_NOT_ELIGIBLE`, `LIMIT_EXCEEDED`.
**Sensitive**: money not logged; internal-only transfer between the user's own instruments.

---

#### `topup.mobile.execute`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Mobile top-up" (also redeemable with points — see `rewards.redeem`).
**Payload**: `secure { "msisdn": "<number to top up>" }`, plain `{ "fromAccountRef" | "payWithPoints": bool, "carrier": "<enum>", "amount": money }`.
**Success `data`**: `{ "topupRef", "status", "msisdnMasked": "****1234", "amount": money }`.
**Errors**: `CARRIER_UNSUPPORTED`, `MSISDN_INVALID`, `INSUFFICIENT_FUNDS`, `INSUFFICIENT_POINTS`.
**Sensitive**
- `msisdn` → **ENCRYPT** (JWE); response returns masked only. May be a third party's number →
  not logged.

---

### Cards

---

#### `cards.list`
**Dir** C→G · **Auth** session · Reference: card carousel — brand mark, `•••• •••• •••• 8841`, CARDHOLDER, EXPIRES, CVV `•••`, `⏳ 28 DAYS` badge; Physical Visa Platinum / Physical Mastercard Gold / Virtual.
**Payload**: `{}`.
**Success `data`**
| field | type | notes |
|---|---|---|
| `cards[].cardRef` | string | opaque per-user handle. |
| `cards[].panLast4` | string | "8841". |
| `cards[].panMasked` | string | "•••• •••• •••• 8841". |
| `cards[].brand` | enum | `visa` \| `mastercard`. |
| `cards[].product` | string | "Visa Platinum". |
| `cards[].form` | enum | `physical` \| `virtual`. |
| `cards[].status` | enum | `active` \| `frozen` \| `expired` \| `blocked` \| `closed`. |
| `cards[].expiryMonthYearMasked` | string | "••/••" unless revealed; or `expiryCountdownDays`. |
| `cards[].cardholderName` | string | as embossed (the user's own name). |
| `cards[].linkedAccountRef` | string | |
| `cards[].walletProvisioned` | object | `{ apple:bool, google:bool }`. |

**Sensitive**
- **Full PAN / CVV / full expiry → OMIT** from this (and every) list/read. Only `panLast4` /
  `panMasked` and (optionally) an expiry countdown. Revealing full details requires
  `cards.details.reveal` + step-up.
- `cardRef` opaque → no enumeration.
- `cardholderName` is the user's own name → PII → not logged.

---

#### `cards.get`
**Dir** C→G · **Auth** session · **Payload**: `{ "cardRef" }` · **`data`**: list fields **plus** `issuedAt`, `renewalDueAt`, `controls` (see `cards.controls.get`), `pinSetAt`, `feeSchedule`.
**Sensitive**: no full PAN/CVV. Same as `cards.list`.

---

#### `cards.details.reveal`
**Dir** C→G · **Auth** session + **step-up (faceid | txn_password | otp)** · **Idempotency** n/a (read) · **Rate limit** 5/min/user, 20/day/card.
Reference: "Show card details" ⇄ "Hide card details" — reveals PAN/CVV/expiry.
**Payload**: `{ "cardRef": "<str>" }` (the step-up action token is bound to this `cardRef`).
**Success `data`** — returned **inside `data.secure`** (JWE encrypted to the *client's* ephemeral public key, posted in the request):
```
data.secure = JWE({ pan, cvv, expiry, cardholderName }, ttlHintSec: 60)
```
Plus plain `{ "revealId", "expiresInSec": 60 }`.
**Errors**: `CARD_NOT_ACTIVE`, `STEP_UP_TOKEN_INVALID`, `REVEAL_RATE_LIMITED`, `CARD_PROCESSOR_UNAVAILABLE`.
Downstream: `svc.cardProcessor.reveal` (G→S).

**Sensitive**
- **PAN, CVV, expiry** → **ENCRYPT end-to-end**: the card processor encrypts the values to the
  client's ephemeral key; the gateway relays ciphertext and **cannot see the PAN**. Never
  logged anywhere; not written to disk on the client; UI auto-hides after `expiresInSec` and
  the client discards the key.
- `revealId` is an opaque audit handle (an audit event is recorded: who/when/which card).
- No caching, no CDN, `Cache-Control: no-store` end to end.

---

#### `cards.freeze.set`
**Dir** C→G · **Auth** session · **Idempotency** required.
Reference: "❄️ Freeze card" / "Card frozen" / "Card unfrozen".
**Payload**: `{ "cardRef", "frozen": bool }`.
**Success `data`**: `{ "cardRef", "status": "frozen" | "active" }`.
**Errors**: `CARD_CLOSED`, `CARD_BLOCKED` (cannot unfreeze a stolen-blocked card).
**Sensitive**: none new. Loggable (`cardRef` + new status).

---

#### `cards.pin.reissue`
**Dir** C→G · **Auth** session + **step-up (otp)** · **Idempotency** required.
Reference: "Get a new PIN (1'000₮)", "New PIN and I-PIN", "Issuing a new card needs a one-time code.", "You are about to be issued a new PIN and I-PIN", "Your new PIN has been issued".
**Payload**: `{ "cardRef", "delivery": "in_app_reveal" | "sms" | "branch" }`.
**Success `data`**:
- `delivery:in_app_reveal` → `data.secure` = JWE({ pin, iPin }) to the client ephemeral key, `expiresInSec: 60`.
- `delivery:sms`/`branch` → `{ "status": "issued", "channel": "sms" }` (no PIN in the response).
Plus plain `{ "reissueRef", "fee": money }`.
**Errors**: `CARD_NOT_ACTIVE`, `PIN_REISSUE_COOLDOWN`, `INSUFFICIENT_FUNDS_FOR_FEE`.

**Sensitive**
- **PIN, I-PIN** → **ENCRYPT end-to-end** (as `cards.details.reveal`) or delivered by SMS from
  the processor's boundary; **never** in plaintext through the gateway, never logged, never in
  analytics. Constant-time handling. Auto-hide + key discard on the client.

---

#### `cards.controls.get` / `cards.controls.update`
**Dir** C→G · **Auth** `get`: session · `update`: session + step-up · **Idempotency** (update) required.
Reference: "Online payments", "ATM withdrawals", "Payments abroad" toggles; "International card payments", "Foreign merchants and ATMs".
**`get` `data`**: `{ "cardRef", "controls": { "online": bool, "atm": bool, "abroad": bool, "contactless": bool, "ecommerce": bool } }`.
**`update` Payload**: `{ "cardRef", "controls": { <subset> } }` → **`data`**: full resolved `controls`.
**Sensitive**: none. Loggable.
**Standing-rule note:** persistent config → step-up + confirmation notification on change.

---

#### `cards.order`
**Dir** C→G · **Auth** session + **step-up (otp)** · **Idempotency** required.
Reference: "＋ New card", "Order a card", "Visa Platinum · Mastercard Gold", physical/virtual, "Issuing a new card needs a one-time code."
**Payload**
| field | location | type | req | rules |
|---|---|---|---|---|
| `form` | plain | enum | yes | `physical` \| `virtual`. |
| `product` | plain | enum | yes | `visa_platinum` \| `mastercard_gold`. |
| `linkedAccountRef` | plain | string | yes | |
| `cardholderName` | plain | string | yes | Defaults to the profile legal name. |
| `deliveryMethod` | plain | enum | phys. | `branch` \| `courier`. |
| `deliveryAddress` | `payload.secure` | object | cond. | `courier` only — `{ line1, line2, district, city, phone }`. JWE to the card service. |
| `branchId` | plain | string | cond. | `branch` delivery. |

**Success `data`**: `{ "orderRef", "status": "processing", "fee": money, "estimatedReadyDate", "trackingRef", "virtualCardRef": "<str|null>" }`.
**Errors**: `CARD_LIMIT_REACHED`, `ACCOUNT_INELIGIBLE`, `ADDRESS_INVALID`, `INSUFFICIENT_FUNDS_FOR_FEE`.

**Sensitive**
- `deliveryAddress` + contact `phone` → **ENCRYPT** (JWE to the card service). Gateway routes
  on `form`/`product`/`branchId` only; address never logged, never returned to reads (only a
  masked "delivering to … Ulaanbaatar").
- New virtual card details are **not** returned here — the client must call
  `cards.details.reveal`.

---

#### `cards.delivery.set`
**Dir** C→G · **Auth** session · **Idempotency** required.
Reference: "Choose delivery", "At a branch" / courier, "How to receive it".
**Payload**: `{ "orderRef", "method": "branch" | "courier", "branchId": "<str|null>", "address": <in secure, courier only> }`.
**Success `data`**: `{ "orderRef", "method", "addressMasked": "…, Ulaanbaatar" | null, "branchName": "<str|null>" }`.
**Sensitive**: `address` → **ENCRYPT**; response masked only.

---

#### `cards.tracking.get`
**Dir** C→G · **Auth** session · Reference: "Track my card", timeline Ordered → Card office → Production → Branch → Ready; "The card office has received it.", "Assigned once the card is prepared", empty "No card order in progress".
**Payload**: `{ "trackingRef": "<str>" }` or `{ "orderRef": "<str>" }`.
**Success `data`**: `{ "status", "steps": [ { "key", "label", "at", "done" } ], "collectionBranchName": "<str|null>", "readyForCollection": bool }`.
**Sensitive**: no raw address; branch name is public. Loggable except timestamps of delivery.

---

#### `cards.renewal.prepare`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Expires this month", "auto-prepare", "Choose delivery".
**Payload**: `{ "cardRef", "deliveryMethod": "branch" | "courier", "branchId": "<str|null>", "address": <in secure, courier> }`.
**Success `data`**: `{ "renewalOrderRef", "status", "estimatedReadyDate", "trackingRef" }`.
**Sensitive**: `address` → **ENCRYPT**.

---

#### `cards.replace`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "🔁 Replace card", "Choose another card".
**Payload**: `{ "cardRef", "reason": "damaged" | "not_received" | "other", "deliveryMethod", "branchId" | "address(secure)" }`.
**Success `data`**: `{ "replacementOrderRef", "oldCardStatus": "active" | "blocked", "trackingRef", "fee": money }`.
**Sensitive**: `address` → **ENCRYPT**.

---

#### `cards.reportLostStolen`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "🚨 Report lost or stolen", "I lost my card", "Block this card" ("Blocks the card permanently"), "Card blocked · replacement ordered".
**Payload**: `{ "cardRef", "kind": "lost" | "stolen", "lastKnownUse": "<free text|null>", "orderReplacement": bool, "deliveryMethod": "<enum|null>", "branchId" | "address(secure)" }`.
**Success `data`**: `{ "cardRef", "status": "blocked", "replacementOrderRef": "<str|null>", "disputeGuidance": "<localised>" }`.
**Errors**: `CARD_ALREADY_BLOCKED` (`CONFLICT`, idempotent-friendly).
**Sensitive**
- `lastKnownUse` free text may contain location/PII → **ENCRYPT** to the card/fraud service;
  not logged.
- Action is **irreversible** (permanent block) → step-up + explicit confirm in UI + audit event.

---

#### `cards.close`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "🗑 Close card" / "Delete virtual card" ("This permanently blocks card ·••• …"), toasts "Card closure requested" / "Virtual card deleted".
**Payload**: `{ "cardRef", "confirm": true, "reason": "<enum>" }`.
**Success `data`**: `{ "cardRef", "status": "closed" }`.
**Errors**: `CARD_HAS_PENDING_AUTH` (must wait for holds to clear), `LAST_CARD_ON_ACCOUNT` [OPEN QUESTION whether the bank blocks this].
**Sensitive**: none new. Irreversible → step-up + confirm + audit.

---

#### `cards.wallet.provision`
**Dir** C→G · **Auth** session + **step-up (otp)** · **Idempotency** required.
Reference: "Add to digital wallet", "Add to Wallet", "Apple Wallet" / "Google Wallet" / "G PAY", "Card added to wallet".
**Payload**: `{ "cardRef", "walletType": "apple" | "google", "deviceProvisioningData": "<opaque nonce/cert from the OS wallet SDK>" }`.
**Success `data`**: `data.secure` = JWE to the client ephemeral key containing the **encrypted
provisioning payload** the OS wallet API expects (`activationData`, `encryptedPassData`,
`ephemeralPublicKey` for Apple; equivalent OPC for Google). Plus plain `{ "provisionRef", "status" }`.
Downstream: `svc.cardProcessor.lifecycle` (G→S) → network tokenisation.
**Errors**: `WALLET_TYPE_UNSUPPORTED`, `CARD_NOT_ACTIVE`, `DEVICE_NOT_ELIGIBLE`, `PROVISIONING_DECLINED`.

**Sensitive**
- The provisioning payload contains a **network token / device PAN-equivalent** → **ENCRYPT
  end-to-end** to the client; the gateway never sees a usable PAN. Not logged. `no-store`.

---

#### `cards.authHolds.list`
**Dir** C→G · **Auth** session · Reference: "Authorisation holds (484'200₮ · 3)", "merchant asks us to hold the amount", "merchant cancelled and the hold stayed".
**Payload**: `{ "cardRef": "<str|null>" }`.
**Success `data`**: `holds[]` — `{ holdRef, merchant, amount: money, placedAt, expiresAt, status }`, `totalHeld: money`, `count`.
**Sensitive**: `merchant` behaviour-revealing → not logged. money → not logged.

---

#### `cards.activity.list`
**Dir** C→G · **Auth** session · Reference: "📃 Activity" (recent card txns), empty "No activity on this card yet."
**Payload**: `{ "cardRef", "cursor": "<str|null>", "limit": 25 }`.
**Success `data`**: same item shape as `transactions.list` filtered to that card, `nextCursor`.
**Sensitive**: as `transactions.list`.

---

#### `svc.cardProcessor.reveal` / `svc.cardProcessor.lifecycle` *(gateway → service)*
**Dir** G→S · **Auth** s2s (mTLS to the processor connector) · The **only** components that
touch full PAN/CVV/PIN. They return values **already encrypted to the client's ephemeral key**
(reveal) or as processor lifecycle acks (freeze/close/renew/provision). PCI scope is confined
here; the gateway is out of PCI CDE because it only relays ciphertext.

---

#### `cards.webhook.lifecycle`  *(external webhook → gateway)*
**Dir** W→G · **Auth** signed (processor HMAC) · **Idempotency** dedupe `{provider, providerEventId}` 30 d.
Processor events: `card.activated`, `card.expired`, `card.blocked_by_issuer`,
`card.fraud_flag`, `pin.set`, `production.shipped`.
**Payload**: `plain { providerEventId, eventType }`, `secure { processorCardId, details }` (encrypted to the processor connector).
**Success `data`**: `{ "accepted": true }`.
**Sensitive**
- `processorCardId` → **ENCRYPT** to the connector; gateway routes on `eventType` only. The
  connector maps to `cardRef`/`userRef` and emits a domain event + notification.

---

### Deposits & savings

---

#### `deposits.list`
**Dir** C→G · **Auth** session · Reference: term-deposit cards (rate, principal, +interest, "% of term", `＋ Top up`), child savings ("2 children", avatars), daily-saving streak ("🔥 47 DAY STREAK"), savings goals summary; `＋ Open a deposit`.
**Payload**: `{}`.
**Success `data`**: `{ "termDeposits": [ { depositRef, name, principal: money, rate, accruedInterest: money, openedAt, maturesAt, termProgressPct, earlyClosurePenalty } ], "childSavings": { … see savings.child.get }, "streak": { … see savings.dailyStreak.get }, "goalsSummary": { totalSaved: money, goalCount } }`.
**Sensitive**: money fields not logged. `name` user-chosen (may hint at purpose — "House deposit") → not logged.

---

#### `deposits.get`
**Dir** C→G · **Auth** session · **Payload**: `{ "depositRef" }` · **`data`**: full deposit incl. `interestPaymentSchedule[]`, `sourceAccountRef`, `renewalInstruction`, `certificateDownloadTicket`.
**Sensitive**: certificate contains identity + amount → download ticket, off-gateway.

---

#### `deposits.open`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Open deposit", "A term deposit with a name on it", "🏦 Deposit · 12.8% fixed", `${f}-month term deposit`.
**Payload**: `{ "fromAccountRef", "name": "<1–40>", "principal": money, "termMonths": int, "maturityInstruction": "payout" | "renew_principal" | "renew_all" }`.
**Success `data`**: `{ "depositRef", "name", "principal": money, "rate", "maturesAt", "status": "active" }`.
**Errors**: `INSUFFICIENT_FUNDS`, `PRINCIPAL_BELOW_MIN`, `TERM_UNSUPPORTED`, `DEPOSIT_LIMIT_REACHED`.
**Sensitive**: money not logged.

---

#### `deposits.topup`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "＋ Top up", "Top up deposit", "Add to deposit".
**Payload**: `{ "depositRef", "fromAccountRef", "amount": money }`.
**Success `data`**: `{ "depositRef", "newPrincipal": money, "status" }`.
**Errors**: `DEPOSIT_TOPUP_NOT_ALLOWED` (fixed-term product), `INSUFFICIENT_FUNDS`.
**Sensitive**: money not logged.

---

#### `deposits.close`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Closing this deposit before …", "Early closure requires branch confirmation".
**Payload**: `{ "depositRef", "toAccountRef", "confirmPenalty": true }`.
**Success `data`**: `{ "depositRef", "status": "closed" | "pending_branch", "penalty": money, "netPaidOut": money }`.
**Errors**: `EARLY_CLOSURE_NEEDS_BRANCH` (returns `status: pending_branch`), `ALREADY_CLOSED`.
**Sensitive**: money not logged.

---

#### `savings.goals.list` / `savings.goals.get`
**Dir** C→G · **Auth** session · Reference: "Savings goals", "New savings goal", "Rent, Holiday, Business…".
**`list` `data`**: `goals[]` — `{ goalRef, name, target: money, saved: money, progressPct, targetDate, autoContribution }`.
**`get` `data`**: adds `contributions[]` (recent), `linkedAccountRef`.
**Sensitive**: `name` may hint at life events → not logged. money not logged.

---

#### `savings.goals.create`
**Dir** C→G · **Auth** session · **Idempotency** required.
Reference: "Create goal", "Goal name", "New savings goal".
**Payload**: `{ "name": "<1–40>", "target": money, "targetDate": "<date|null>", "linkedAccountRef", "autoContribution": { "amount": money, "cadence": "weekly|monthly" } | null }`.
**Success `data`**: `{ "goalRef", "name", "target": money, "saved": { "value": "0.00", "currency": "MNT" } }`.
**Sensitive**: `name` not logged.

---

#### `savings.goals.contribute`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
**Payload**: `{ "goalRef", "fromAccountRef", "amount": money }`.
**Success `data`**: `{ "goalRef", "saved": money, "progressPct" }`.
**Errors**: `INSUFFICIENT_FUNDS`, `GOAL_COMPLETED`.
**Sensitive**: money not logged.

---

#### `savings.goals.delete`
**Dir** C→G · **Auth** session · **Payload**: `{ "goalRef", "returnToAccountRef" }` · **`data`**: `{ "deleted": true, "returned": money }`. **Sensitive**: money not logged.

---

#### `savings.dailyStreak.get`
**Dir** C→G · **Auth** session · Reference: "🔥 47 DAY STREAK", "Daily saving · ", "-day streak · never ends".
**Payload**: `{}`.
**Success `data`**: `{ "streakDays": 47, "todaySaved": bool, "suggestedAmount": money, "linkedAccountRef", "totalSavedThisStreak": money }`.
**Sensitive**: money not logged.

---

#### `savings.dailyStreak.saveToday`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required — **key must encode the date** so a same-day retry is a no-op, not a double save.
Reference: "Save today's 10'000₮".
**Payload**: `{ "amount": money, "fromAccountRef", "date": "<YYYY-MM-DD>" }`.
**Success `data`**: `{ "streakDays": 48, "savedAmount": money, "todaySaved": true }`.
**Errors**: `ALREADY_SAVED_TODAY` (`CONFLICT` → treat as success client-side), `INSUFFICIENT_FUNDS`.
**Sensitive**: money not logged.

---

#### `savings.child.get`
**Dir** C→G · **Auth** session · Reference: "Child savings", "2 children", avatars.
**Payload**: `{}`.
**Success `data`**: `{ "children": [ { "childRef", "givenNameMasked": "B••••", "avatarMonogram": "BE", "balance": money, "ageBand": "6-9" } ], "combinedBalance": money }`.
**Sensitive**
- A **child's name / DOB** is highly sensitive PII (minor) → return **masked given name +
  monogram + age band** only; full name/DOB never client-visible; not logged.

---

### Loans & credit

---

#### `loans.list`
**Dir** C→G · **Auth** session · Reference: "Your loans" / "ACTIVE LOANS" — 🏠 Mortgage / 🚗 Car loan / 🛋 Consumer loan: rate, remaining, "% repaid", next payment; "1 OVERDUE".
**Payload**: `{}`.
**Success `data`**: `loans[]` — `{ loanRef, kind: "mortgage|car|consumer", label, rate, principalOriginal: money, remaining: money, repaidPct, nextPaymentDate, nextPaymentAmount: money, status: "current|late|overdue", daysLate, holidayEligible: bool }`, `overdueCount`.
**Sensitive**: money not logged; loan existence/kind is sensitive financial data → not logged.

---

#### `loans.get`
**Dir** C→G · **Auth** session · **Payload**: `{ "loanRef" }` · **`data`**: adds `amortisation[]` (upcoming), `interestRateType`, `collateralSummaryMasked`, `originatedAt`, `payoffAmountToday: money`, `contractDownloadTicket`.
**Sensitive**: `collateralSummary` (property/vehicle) → **MASK**; contract via download ticket.

---

#### `loans.upcoming.get`
**Dir** C→G · **Auth** session · Reference: "Upcoming payments" card ("ACTION NEEDED", total, "1 OVERDUE").
**Payload**: `{ "horizonDays": 30 }`.
**Success `data`**: `{ "items": [ { "loanRef", "label", "dueDate", "amount": money, "status" } ], "totalDue": money, "overdueCount", "actionNeeded": bool }`.
**Sensitive**: money not logged.

---

#### `loans.repay`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Repay", "Loan payment", "Prepay ", "Count prepayments", overdue "Pay now".
**Payload**: `{ "loanRef", "fromAccountRef", "amount": money, "allocation": "scheduled" | "prepayment", "quoteRef": "<str|null>" }`.
**Success `data`**: `{ "repaymentRef", "status": "done", "amountPaid": money, "newRemaining": money, "nextPaymentDate", "pointsImpact": "<localised note>" }`.
**Errors**: `INSUFFICIENT_FUNDS`, `AMOUNT_EXCEEDS_PAYOFF`, `LOAN_CLOSED`.
**Sensitive**: money not logged. `pointsImpact` from catalog ("Payment overdue — no points this month" etc.).

---

#### `loans.prepay.quote`
**Dir** C→G · **Auth** session · Reference: "Early repayment quote requested", "Repay early", "or sooner if you repay."
**Payload**: `{ "loanRef", "asOfDate": "<date>", "amount": money | "full" }`.
**Success `data`**: `{ "quoteRef", "payoffAmount": money, "principalPortion": money, "interestPortion": money, "earlyRepaymentFee": money, "newMaturityDate", "expiresAt" }`.
**Sensitive**: money not logged.

---

#### `loans.prepay.execute`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
**Payload**: `{ "quoteRef", "fromAccountRef" }`.
**Success `data`**: `{ "repaymentRef", "status": "done" | "pending_branch", "amountPaid": money, "loanStatus": "current" | "closed" }`.
**Errors**: `QUOTE_EXPIRED`, `INSUFFICIENT_FUNDS`, `EARLY_CLOSURE_NEEDS_BRANCH`.
**Sensitive**: money not logged.

---

#### `loans.holiday.eligibility`
**Dir** C→G · **Auth** session · Reference: "Payment holiday", "Holiday limit reached this year".
**Payload**: `{ "loanRef" }`.
**Success `data`**: `{ "eligible": bool, "reason": "<localised|null>", "maxMonths": int, "usedThisYear": int, "impact": "<localised>" }`.
**Sensitive**: none new.

---

#### `loans.holiday.request`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
**Payload**: `{ "loanRef", "months": int, "reason": "<enum>" }`.
**Success `data`**: `{ "holidayRef", "status": "approved" | "needs_review", "resumesOn", "revisedMaturityDate" }`.
**Errors**: `HOLIDAY_LIMIT_REACHED` ("Holiday limit reached this year"), `LOAN_INELIGIBLE`, `LOAN_IN_ARREARS`.
**Sensitive**: `reason` enum only (no free-text hardship narrative in the client payload; if collected, → **ENCRYPT**). Persistent change → step-up + notification.

---

#### `loans.offers.check`
**Dir** C→G · **Auth** session · **Rate limit** 5/day/user. Reference: "Check my loan offers", "Loan eligibility check started", "Loan payment"/"Mortgage or salary loan in good standing".
**Payload**: `{ "purpose": "personal" | "auto" | "mortgage" | "unspecified", "requestedAmount": money | null }`.
**Success `data`**: `{ "checkRef", "status": "processing" | "ready", "offers": [ { "product", "maxAmount": money, "indicativeRate", "termMonths", "expiresAt" } ], "softCheckOnly": true }`.
**Sensitive**
- This is a **soft** eligibility check — the response must state it does not affect credit
  score. Any bureau pull is a separate consented step. `requestedAmount` money → not logged.
- **Not personalised financial advice** — offers are product parameters, not recommendations.

---

#### `credit.score.get`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required (billable).
Reference: "📊 CreditScore by BurenScore · fee 3'000₮", "CreditScore by BurenScore".
**Payload**: `{ "consent": true }`.
**Success `data`**: `{ "score": 742, "band": "good", "asOf": "<date>", "fee": money, "factors": [ { "label", "impact": "positive|negative" } ], "reportAvailable": true }`.
**Errors**: `CONSENT_REQUIRED`, `INSUFFICIENT_FUNDS_FOR_FEE`, `BUREAU_UNAVAILABLE`, `NO_CREDIT_FILE`.
**Sensitive**
- The score + factors are **sensitive financial data** → not logged; TLS only; excluded from
  analytics. Explicit **consent** required and recorded (audit event) before any bureau call.
- The bureau request/response (which carries the **register number**) happens service-side
  only; the register number is **OMITTED** from every client payload.

---

#### `credit.report.request`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Your complete BurenScore report — every loan, payment…".
**Payload**: `{ "consent": true, "format": "pdf" }`.
**Success `data`**: `{ "documentRef", "status": "generating" | "ready", "downloadTicket", "expiresInSec": 120, "fee": money }`.
**Sensitive**
- The full report contains **every credit account, address history, register number** → stored
  encrypted; retrieved only via single-use `downloadTicket` on a signed download endpoint;
  bytes never through `/api/gateway`; temp copy auto-purged.

---

#### `overdraft.status.get` / `overdraft.explain`
**Dir** C→G · **Auth** session · Reference: "Overdraft", "Instant overdraft", "Your overdraft is active", "Explain my overdraft", "Of the overdraft fee".
**`status` `data`**: `{ "active": bool, "limit": money, "used": money, "available": money, "feeModel": "<localised>", "linkedAccountRef" }`.
**`explain` `data`**: `{ "sections": [ { "title", "body" } ] }` (static educational content).
**Sensitive**: money not logged. `explain` is static — fully loggable.

---

#### `overdraft.activate`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: "Activate overdraft", "500'000₮ · paid out instantly", toast confirmations.
**Payload**: `{ "linkedAccountRef", "requestedLimit": money, "acceptedTermsVersion": int }`.
**Success `data`**: `{ "overdraftRef", "status": "active" | "review", "approvedLimit": money, "apr", "feeSchedule" }`.
**Errors**: `OVERDRAFT_NOT_ELIGIBLE`, `TERMS_VERSION_STALE`, `LIMIT_ABOVE_MAX`.
**Sensitive**: money not logged. Credit product → step-up + terms acceptance recorded.

---

### Rewards

---

#### `rewards.summary.get`
**Dir** C→G · **Auth** session · Reference: big points number `340'229`, **PLATINUM** tier, "Earned this month" (Balances / Fees / App use), "1'000 points = 1'000₮", "One point is worth", "Point value".
**Payload**: `{}`.
**Success `data`**: `{ "pointsBalance": 340229, "tier": "platinum", "tierProgress": { "current": "platinum", "next": null, "progressPct": 100 }, "pointValueMnt": "1.00", "earnedThisMonth": { "total": 12040, "byBucket": { "balances": 8000, "fees": 3040, "appUse": 1000 } }, "bonusThisMonth": 0 }`.
**Sensitive**: points ≈ a proxy for balances/behaviour → treat like money: **not logged**.

---

#### `rewards.earnHistory.list`
**Dir** C→G · **Auth** session · Reference: long itemised earn list per account & fee.
**Payload**: `{ "month": "<YYYY-MM|null>", "cursor": "<str|null>", "limit": 30 }`.
**Success `data`**: `entries[]` — `{ entryRef, at, source: "balance|fee|bill|app_use|bonus", label, accountRef?, points, note }`, `nextCursor`.
**Sensitive**: `accountRef` opaque; behaviour-revealing → not logged.

---

#### `rewards.catalog.get`
**Dir** C→G · **Auth** session · Reference: "Spend your points" — cash back, mobile top-up, coffee/cinema vouchers; "Not enough points yet"; "1'000 points = 1'000₮".
**Payload**: `{}`.
**Success `data`**: `items[]` — `{ rewardId, kind: "cashback|mobile_topup|voucher", title, pointsCost, cashValue: money, partner, stock: "in_stock|low|out", minTier }`.
**Sensitive**: none (catalog). Loggable.

---

#### `rewards.redeem`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
Reference: redeem for cashback / mobile top-up / vouchers; "Not enough points yet".
**Payload**: `{ "rewardId", "quantity": 1, "deliverToAccountRef": "<cashback>", "deliverToMsisdn": "<in secure, mobile_topup>", "deliverToEmailMasked?": "<voucher>" }`.
**Success `data`**: `{ "redemptionRef", "status": "done" | "processing", "pointsSpent", "pointsBalance", "voucherCode?": "<in data.secure>", "creditedAmount?": money }`.
**Errors**: `INSUFFICIENT_POINTS` ("Not enough points yet"), `TIER_TOO_LOW`, `REWARD_OUT_OF_STOCK`.
**Sensitive**
- `deliverToMsisdn` → **ENCRYPT** (JWE); response masked.
- `voucherCode` → a bearer value → returned **inside `data.secure`** (client ephemeral key),
  not logged, shown once.

---

#### `rewards.benefits.list`
**Dir** C→G · **Auth** session · Reference: "Your benefits" ACTIVE/LOCKED, tiers.
**Payload**: `{}` · **`data`**: `benefits[]` — `{ benefitId, title, description, state: "active|locked", unlockTier }`.
**Sensitive**: none. Loggable.

---

### Subscriptions

---

#### `subscriptions.list`
**Dir** C→G · **Auth** session · Reference: "Subscriptions", "Recurring on your cards", "E-commerce and subscriptions".
**Payload**: `{ "status": "active" | "all" }`.
**Success `data`**: `subs[]` — `{ subRef, merchant, category, amount: money, cadence, nextChargeDate, cardRefMasked, status: "active|cancelled|paused", firstSeen }`, `monthlyTotal: money`.
**Sensitive**: `merchant` behaviour-revealing (streaming, dating, health apps) → **not logged**; money → not logged.

---

#### `subscriptions.get`
**Dir** C→G · **Auth** session · **Payload**: `{ "subRef" }` · **`data`**: adds `chargeHistory[]`, `merchantContact`, `cancelInstructions`.
**Sensitive**: as above.

---

#### `subscriptions.cancel`
**Dir** C→G · **Auth** session + step-up · **Idempotency** required.
**Payload**: `{ "subRef", "method": "block_future_charges" | "notify_merchant", "reason": "<enum|null>" }`.
**Success `data`**: `{ "subRef", "status": "cancelled" | "pending", "effectiveFrom" }`.
**Sensitive**: none new. `block_future_charges` sets a persistent card rule → step-up + notification.

---

#### `subscriptions.rescan`
**Dir** C→G · **Auth** session · **Rate limit** 6/day/user. Re-analyses recurring card payments.
**Payload**: `{}` · **`data`**: `{ "detected": int, "new": int, "updatedAt" }`.
**Sensitive**: none in payload; server-side analysis of the user's own txns.

---

### Notifications

---

#### `notifications.list`
**Dir** C→G · **Auth** session · Reference: "🔔 NOTIFICATIONS · 4 NEW", "View", list, "Mark all as read", empty "No new notifications".
**Payload**: `{ "cursor": "<str|null>", "limit": 25, "filter": "all" | "unread" }`.
**Success `data`**: `items[]` — `{ notifRef, type: "payment|security|bill|offer|system", title, body, at, read: bool, deepLink }`, `unreadCount`, `nextCursor`.
**Sensitive**
- `body` may embed amounts / merchant / masked account → services must **pre-mask** before
  storing a notification (`"−•••'200 ₮ at Nomin"`). Not logged at the gateway.
- `deepLink` uses opaque refs only, never raw ids.

---

#### `notifications.markRead`
**Dir** C→G · **Auth** session · **Payload**: `{ "notifRefs": ["<str>", …] }` (1–100) · **`data`**: `{ "unreadCount" }`. **Sensitive**: none.

---

#### `notifications.markAllRead`
**Dir** C→G · **Auth** session · **Payload**: `{ "before": "<ISO|null>" }` · **`data`**: `{ "unreadCount": 0 }`. **Sensitive**: none.

---

#### `notifications.preferences.get` / `notifications.preferences.update`
**Dir** C→G · **Auth** session · Reference: "Notifications" settings; "SMS notification on/off".
**`get` `data`**: `{ "channels": { "push": bool, "sms": bool, "email": bool }, "topics": { "payments": bool, "security": true, "bills": bool, "offers": bool, "rewards": bool } }` (`security` forced-on).
**`update` Payload**: subset · **`data`**: full resolved object.
**Sensitive**: none. Loggable. (`security` topic cannot be disabled.)

---

### Support & reference data

---

#### `helpy.session.start`
**Dir** C→G · **Auth** session · Reference: "Helpy", "Ask Helpy…", "Erdene, I am Helpy. Ask me anything about your…".
**Payload**: `{ "context": "home" | "loans" | "cards" | "transfer" | null }`.
**Success `data`**: `{ "helpySessionRef", "greeting": "<localised>", "suggestedPrompts": ["…"] }`.
**Sensitive**: none in payload. Session ref opaque.

---

#### `helpy.message.send`
**Dir** C→G · **Auth** session · **Rate limit** 20/min, 300/day/user. Input + output moderated.
**Payload**: `{ "helpySessionRef", "text": "<1–2000 chars>", "attachments": [] }`.
**Success `data`**: `{ "messageRef", "reply": "<assistant text>", "actions": [ { "kind": "open_deeplink" | "prefill_transfer" | "escalate_to_human", "params": { <opaque refs> } } ], "escalation": { "available": bool } }`.
**Errors**: `HELPY_UNAVAILABLE`, `HELPY_CONTENT_BLOCKED`, `HELPY_RATE_LIMITED`.
**Sensitive**
- `text` is **user free-text → may contain anything** (account numbers, PII, complaints). It
  is **not logged** at the gateway; the assistant service redacts obvious secrets (PAN/OTP
  patterns) before any model call and before storing transcript history.
- The model/agent runs **inside the trusted boundary**; it is given only masked account data
  and opaque refs, never full PAN/IBAN/register number.
- `actions[].params` carry opaque refs only — Helpy can *prefill* a transfer but never
  *execute* one without the normal step-up + `*.execute` function.
- [OPEN QUESTION] whether transcripts are retained and for how long; whether a 3rd-party LLM is
  used (if so, a data-processing boundary + redaction contract is required).

---

#### `helpy.history.get`
**Dir** C→G · **Auth** session · **Payload**: `{ "helpySessionRef", "cursor": "<str|null>" }` · **`data`**: `messages[]` — `{ messageRef, role: "user|assistant", text, at }`, `nextCursor`.
**Sensitive**: transcript may contain user-typed PII → not logged; TLS only.

---

#### `support.contact.get`
**Dir** C→G · **Auth** session · Reference: "Call 24/7 (+976 7000 1234)", "1800-1888", "7000 1234 · info@tuntun.mn", "Chat with us", "Branches & ATMs".
**Payload**: `{}` · **`data`**: `{ "phone24x7": "+97670001234", "cardHotline": "1800-1888", "email": "info@rightbank.mn", "chatAvailable": bool, "hours": "<localised>" }`.
**Sensitive**: none (public bank contact info). Loggable.

---

#### `branches.list`
**Dir** C→G · **Auth** session · Reference: "Branches & ATMs", "12 branches in Ulaanbaatar", "Opening map".
**Payload**: `{ "near": { "lat": <num>, "lng": <num> } | null, "kind": "branch" | "atm" | "all", "query": "<str|null>" }`.
**Success `data`**: `locations[]` — `{ locationRef, kind, name, address, lat, lng, hours, services: ["cash_in","fx", …], distanceM }`.
**Sensitive**
- The user's `near` coordinates are **precise-location PII** → sent only when the user grants
  location; **not logged** (or logged only coarsened to ~1 km); never stored against the user
  profile; never placed in a query string (it isn't — single POST body).

---

#### `referenceData.banks.list`
**Dir** C→G · **Auth** session · Reference: external bank brand colors — Khan `#00529B`, State `#00843D`, TDB `#123274`, Golomt `#F58220`, Xac `#FFC20E`.
**Payload**: `{}` · **`data`**: `banks[]` — `{ bankCode, name, swiftBic, brandColor, instantEligible: bool, ibanPrefix }`.
**Sensitive**: none (public directory). Cacheable, loggable.

---

### Bank admin (back office — NOT shipped to customers)

> The reference shows a "Bank admin" section explicitly labelled *"Back office. Not shipped to
> customers."* These functions exist for completeness of the prototype; in production they live
> behind a **separate staff identity provider** and must never be reachable with a customer
> session token.

---

#### `admin.rewardConfig.get`
**Dir** C→G · **Auth** **admin session** (staff IdP; `FORBIDDEN` for any customer token) · Reference: "Reward configuration", margin / SWIFT / card-share sliders, "billCap", `C.fee.swiftShare`, `C.margin.deposit`, `C.fee.billCap`.
**Payload**: `{}`.
**Success `data`**: `{ "margin": { "deposit": <num>, … }, "fee": { "swiftShare": <num>, "billCap": <num>, "billPoints": <num> }, "cardShare": <num>, "publishedAt", "version" }`.
**Sensitive**
- This is **commercial/vendor economics** (merchant fee shares, SWIFT fee split, settlement
  margins) → **must never be returned to a customer-facing client**. Gateway enforces the
  staff-audience claim on the token and strips the `fn` from the customer catalog.

---

#### `admin.rewardConfig.update`
**Dir** C→G · **Auth** admin session + **dual-control** [OPEN QUESTION on exact approval flow] · **Idempotency** required · **Rate limit** 10/h/admin.
Reference: toasts "Reward rates published", "Reward configuration".
**Payload**: `{ "changes": { "fee.swiftShare": <num>, … }, "effectiveAt": "<ISO>", "changeNote": "<str>" }`.
**Success `data`**: `{ "version", "status": "pending_second_approval" | "published", "publishedAt" }`.
**Errors**: `FORBIDDEN`, `VALUE_OUT_OF_RANGE`, `SECOND_APPROVAL_REQUIRED`, `CONFIG_VERSION_CONFLICT`.
**Sensitive**
- Vendor economics as above. Every change is written to an **immutable audit log** (who, when,
  old→new, `changeNote`). The audit log is not exposed to any customer function.

---

## 9. Sensitive data summary

Handling key — **MASK**: redacted form to client, full value stays in the trusted service.
**ENCRYPT**: carried in `payload.secure` / `data.secure` (JWE), opaque to the gateway,
decrypted only in the owning service. **OMIT**: never present in any client-facing payload;
stripped at the gateway or never assembled. **E2E**: encrypted to the client's own ephemeral
key; even the gateway cannot read it.

| Field / data | Appears in (functions) | Handling | Notes |
|---|---|---|---|
| Internet-banking **password** | `auth.login.password` | **ENCRYPT** (→ auth svc) | Argon2id at rest; never logged/echoed; identical error for bad user vs bad password. |
| **Transaction password** | `auth.stepup.verify` | **ENCRYPT** (→ auth svc) | Hash-only; constant-time compare. |
| **App passcode** (current/new) | `security.passcode.change`, step-up | **ENCRYPT** (→ auth svc) | Hash-only. Keypad entry never leaves device except as `secure`. |
| **OTP code** | `auth.otp.verify`, `auth.stepup.verify`, onboarding, card OTP flows | **ENCRYPT** (→ auth svc) | Code never in any response; `otpRef` handle only; 5-try cap. |
| **Face ID / biometric template** | (device only) | never transits | Only a WebAuthn signature + public key server-side. |
| **Access / refresh tokens** | all auth responses, `auth.session.refresh` | credential — TLS-only, Keychain, **not logged** | Refresh token single-use + rotating; reuse revokes chain. |
| **Step-up action token** | header on every step-up fn | credential — short TTL, single-use, scope-bound | Not logged with payload hash. |
| **Push token** (APNs/FCM) | `push.device.register/unregister` | secret handle — encrypt at rest, **not logged** | Rotates on reinstall. |
| **Phone number (msisdn)** — customer | `auth.otp.send`, `profile.*`, `onboarding.profile.submit`, login history | **MASK** to client (`****1234`); full value server-side | Full value only inside auth/profile/SMS boundary. |
| **Phone number** — third party (payee, top-up target) | `transfer.phone.execute`, `topup.mobile.execute`, `rewards.redeem` | **ENCRYPT** in request; **MASK** in response | Generic not-found (no enumeration). |
| **National register number (РД)** | `auth.emongolia.webhook`, `onboarding.emongolia.confirm`, `svc.emongolia.exchangeCode`, `svc.kyc.*`, `credit.*`, SWIFT sender details | **OMIT** from all client payloads (masked `УБ96••••••` only); **ENCRYPT** service-to-service | Regulated ID; only KYC/credit/SWIFT services hold it. |
| **Legal name (Cyrillic)** | KYC/DAN functions, `profile.get` (masked), documents | **MASK** to client; **ENCRYPT** s2s | Client sees initials / `✓ verified` flag. Own embossed card name is shown to the owner only. |
| **Date of birth** | KYC/DAN functions | **OMIT** from client payloads | Held by KYC service only. |
| **Child's name / DOB** | `savings.child.get`, `deposits.list` | **MASK** (given-name initial + monogram + age band); full → **OMIT** | Minor's PII — strictest. |
| **Email address** | `profile.*`, `onboarding.profile.submit`, voucher delivery | **MASK** (`e•••@g•••`); **ENCRYPT** on write | — |
| **Home / delivery address** | `cards.order`, `cards.delivery.set`, `cards.renewal.prepare`, `cards.replace`, `accounts.reference.request` (addressee) | **ENCRYPT** in request; **MASK** in response (`…, Ulaanbaatar`) | Never returned in full to any read. |
| **Precise geolocation** | `branches.list`, `security.loginHistory.list` (server-derived) | **MASK** (city-level to client); coarsen/`OMIT` in logs | `near` sent only with user consent; never stored on profile. |
| **IP address** | login history, trusted devices (server-side) | **OMIT** from client payloads | Fraud use only, server-side. |
| **Full card PAN** | `cards.details.reveal`, `cards.order` (new virtual — via reveal), `cards.wallet.provision` | **E2E** encrypt to client key; **OMIT** everywhere else | Gateway out of PCI CDE; `no-store`; auto-hide. |
| **Card CVV** | `cards.details.reveal` | **E2E** | Never stored, never logged. |
| **Full card expiry** | `cards.details.reveal` | **E2E** (list shows countdown/`••/••`) | — |
| **Card PIN / I-PIN** | `cards.pin.reissue` | **E2E** or SMS-from-processor; **OMIT** from gateway plaintext | Constant-time; auto-hide. |
| **Wallet provisioning payload / network token** | `cards.wallet.provision` | **E2E** to client | PAN-equivalent; gateway relays ciphertext only. |
| **Card `panLast4` / `panMasked`** | `cards.list/get`, `subscriptions.list`, tx detail | **MASK** (allowed to client) | Safe display value. |
| **Own account IBAN (full)** | `accounts.get`, `accounts.open` (owner only) | returned to owner only; **MASK** elsewhere; **not logged** | List views mask it. |
| **Account IBAN (masked)** | `accounts.list`, beneficiaries, tx detail | **MASK** | `MN32 0000 ••• 0127`. |
| **Beneficiary IBAN + name** (third party) | `transfer.beneficiaries.save`, `transfer.*.execute`, `transfer.swift.*` | **ENCRYPT** in request; **MASK** in any response | Gateway routes on `fromAccountRef`/`amount` without decrypting. |
| **`transfer.iban.resolve` input IBAN** | `transfer.iban.resolve` | **not logged**; response returns **masked** payee name only | Rate-limited; anti-enumeration. |
| **`accountRef` / `cardRef` / `loanRef` / `txnRef` / `beneficiaryRef` / `invoiceRef` / `goalRef` / `depositRef`** | pervasive | opaque per-user handle (safe to log & route) | Non-sequential (ULID/HMAC); replaces enumerable internal ids. |
| **Ledger primary keys / internal account ids** | (internal only) | **OMIT** — never leave the ledger service | Client always uses `*Ref` handles. |
| **QPay invoice id / payment id** | `qpay.*`, `bills.*`, `qpay.webhook.payment`, `svc.qpay.*` | **OMIT** from client payloads (masked `INV-•••14`); **ENCRYPT** s2s | Only the QPay-connector maps raw ids ↔ `paymentRef`; gateway never logs them. |
| **Amounts / balances / points** | every money function | **not logged** at gateway; balances returned **masked** in mutation responses | Money never serialised to logs; idempotency key not correlated to amount. |
| **Transaction merchant / category / reference text** | `transactions.*`, `analytics.*`, `cards.activity/authHolds`, `subscriptions.*`, notifications | **not logged**; TLS-only; excluded from analytics | Behaviour-revealing (health, religion, etc.). |
| **Free-text fields** (`reference`, `lastKnownUse`, `addressee`, `changeNote`, search `query`, Helpy `text`) | transfers, `cards.reportLostStolen`, `transactions.search`, `bills.search`, `helpy.message.send`, admin | **ENCRYPT** where it targets a service (transfer/card); otherwise **not logged**; secret-pattern redaction before storage | May contain arbitrary PII. |
| **KYC document images (ID front/back, selfie)** | `onboarding.kyc.*` | uploaded out-of-band to a write-only pre-signed URL; **URL OMITTED** from reads; encrypted at rest; retention-limited | Biometric/PII; auto-delete per policy ([OPEN QUESTION] retention). |
| **Login-screen custom photo** | `profile.loginPicture.*` | private per-user bucket; served pre-auth via short-lived signed URL; raw URL **OMIT**; purge previous on replace | May show a face. |
| **Liveness / face-geometry signals** | `onboarding.kyc.selfie.submit` | **ENCRYPT** (→ KYC svc); deleted with selfie; client sees coarse status | Biometric-derived. |
| **Credit score / BurenScore report** | `credit.score.get`, `credit.report.request` | body **not logged**; report bytes via `downloadTicket` off-gateway; consent recorded | Sensitive financial; bureau call (with register no.) is service-side only. |
| **Loan existence / kind / collateral** | `loans.*` | **not logged**; `collateralSummary` **MASK** | Sensitive financial. |
| **DAN auth code / `state`** | `auth.emongolia.*`, `onboarding.emongolia.confirm` | code **ENCRYPT**, single-use; `state` opaque, logged only hashed | — |
| **Voucher / redemption codes** | `rewards.redeem` | **E2E** in `data.secure`; shown once; **not logged** | Bearer value. |
| **Generated document bytes** (statement, reference letter, certificate, contract, invoice PDF) | `accounts.*`, `loans.get`, `bills.get`, `credit.report.request` | retrieved via single-use short-TTL `downloadTicket` on a signed endpoint; **never through `/api/gateway`**; temp copy auto-purged | Contain full identity + amounts. |
| **Vendor economics** (merchant fee share, SWIFT fee split, settlement margin, card share, bill cap) | `admin.rewardConfig.*` | **OMIT** from customer catalog entirely; staff-only; audited | `swiftShare`, `margin.deposit`, `billCap`, `cardShare`, `billPoints`. |
| **Provider raw identifiers & signatures** (QPay, DAN, card processor event ids) | `*.webhook.*` | signature verified pre-parse; raw ids **ENCRYPT** to the connector; gateway routes on `eventType`/`merchantCode` only | Dedupe on `{provider, providerEventId}`. |
| **`traceId`** | every error response | opaque; maps to full server context **not** returned to client | Safe for the user to quote to support. |

### Gateway log/visibility rule (summary)

- **Gateway MAY log:** `fn`, `requestId`, `traceId`, `ts`, `ok`, `error.code`, latency, response
  size, `X-RB-Client`, `X-RB-Device-Id`, `X-RB-Locale`, all `*Ref` opaque handles, masked
  display strings, rate-bucket keys (hashed), webhook `eventType` + `merchantCode` +
  `providerEventId`.
- **Gateway MUST NOT log / cannot see:** `Authorization` value, `X-RB-Action-Token`,
  `payload.secure` / `data.secure` (no key), request/response bodies of any function with a
  flagged field (logged as `"<redacted: N bytes>"`), amounts/balances/points, raw PAN/CVV/PIN,
  raw IBAN/msisdn/register number/address/email, merchant/category/reference free-text, raw
  provider identifiers.
- **Gateway routes on ciphertext:** for money moves it dispatches on `fn` + `fromAccountRef`
  (opaque) + `quoteRef` + `amount` *presence* + step-up token validity, and forwards
  `payload.secure` to the owning service **without decrypting**.

---

## 10. Open questions

1. **Function-name placement.** This spec routes on `fn` **in the JSON body**. If the platform
   team prefers a header (`X-RB-Fn`), everything else is unchanged — pick one and lock it.
2. **KYC document retention.** The brief mentions a 14-day auto-delete for uploaded photos, but
   ID documents / selfies usually carry a regulatory minimum retention. What is the required
   period, and does auto-delete apply to the login-screen photo (assumed yes, purge-on-replace)?
3. **Helpy / AI assistant.** Is an external LLM used? If so, a data-processing agreement +
   pre-send redaction contract is required, and transcript retention must be defined.
4. **Admin `rewardConfig.update` approval.** The prototype has a single "publish" action. Does
   production require dual-control / maker-checker? Assumed yes; flow unspecified.
5. **`transactions.search`** — is search served purely from the core system, or is there an
   external search index? If external, raw queries must not reach it (hash/tokenise).
6. **Sub-view transport** (from `migration-progress.md` §9) — which flows are full screens vs
   bottom-sheets doesn't change the API, but confirm whether any flow needs a *server-driven*
   step list (e.g. onboarding) vs a client-fixed one. This spec assumes `onboarding.start`
   returns the step list; others are client-fixed.
7. **`cards.close` last-card rule** — does the bank forbid closing the only card on an account?
8. **Statement / certificate fees** — the reference shows a 30,000₮ reference-letter fee and a
   3,000₮ credit-score fee; are statements/certificates always free or sometimes billable?
   Affects whether `accounts.statement.generate` needs an idempotency key universally (spec
   assumes yes, to be safe).
9. **Receive-QR / cash-in-ATM QR** — confirm these are QPay merchant-style tokens (assumed) and
   not a raw-IBAN QR, which would change the sensitive-data handling.
10. **E-Mongolia callback** — does DAN deliver the result via server-to-server webhook, browser
    redirect, or both? Spec supports both (`auth.emongolia.webhook` + `state` on the deep link).
11. **Offers carousel** (`Home`) — is there an `offers.list` function, or are offers baked into
    `session.bootstrap` / a CMS payload? Not specified; add `content.offers.list` if dynamic.
12. **Notifications** — is there a `notifications.webhook.*` intake for externally-originated
    alerts, or are all notifications emitted by internal domain events (assumed the latter)?
