# KINDELORA PLUS — P0 launch evidence matrix

Updated: 18 November 2026. Tracking issues: #359 (paid-content isolation) and #362 (overall launch).

## Current decision: NO-GO for paid checkout

The public site is in **fail-closed preview mode**. Middleware returns 403 for PLUS/member/premium namespaces and checkout readiness reports `checkoutAvailable: false`. A successful GitHub Actions run proves only the specific automated assertions; it **does not** prove secure, functioning paid memberships or PayFast verification.

| Gate | Current evidence | Decision |
| --- | --- | --- |
| Protected PLUS routes deny anonymous requests | `scripts/check-premium-static-exposure.mjs` exercises Cloudflare middleware | Automated negative tests only |
| Encoded paths, methods, query strings, forged cookies/headers | Middleware regression assertions | Automated negative tests only |
| Offline precache and legacy cache isolation | Service-worker source checks | Automated checks; browser/device QA pending |
| Public Monday teaser excludes paid full text and audio | Static content assertions | Automated checks; production spot-check pending |
| Favourites and affirmation previews do not assert paid membership | Source assertions; UI is gated preview | No authenticated saving yet |
| Paid login and server-verified entitlement | No demonstrated authenticated paid session | **BLOCKED** |
| PayFast merchant approval, signed server-side payment notification, renewal/cancellation and refund flows | No independent production evidence | **BLOCKED** |
| Guest/free/paid browser E2E, direct URL, API, offline, logout and cache transitions | Not completed | **BLOCKED** |
| Artwork editorial approvals and unique premium images | Separate editorial evidence workflow | Verify separately before launch |

## Verified offline CI evidence — 18 November 2026

- [PR #363](https://github.com/shaunoppel-byte/Kindelora-Platform/pull/363) merged a finance preview assertion correction; its PR head recorded 12 successful workflows. This is not live billing evidence.
- [PR #364](https://github.com/shaunoppel-byte/Kindelora-Platform/pull/364) merged the offline PLUS payment fail-closed test, `scripts/test-plus-payment-fail-closed.mjs`.
- [PR #365](https://github.com/shaunoppel-byte/Kindelora-Platform/pull/365) merged the wiring of that test into the PLUS checkout release guard. Its PR head recorded 12 successful workflows. [Checkout guard run 44373402344](https://github.com/shaunoppel-byte/Kindelora-Platform/actions/runs/44373402344) explicitly shows both `node scripts/check-plus-checkout-guard.mjs` and `node scripts/test-plus-payment-fail-closed.mjs` succeeded.
- Latest inspected main merge SHA for PR #365: `d067433f09453491cae379613ccaa573ab9485b4`. These PR checks are not independent confirmation of post-merge production deployment or full live E2E.
- Existing `/api/plus/status` remains fail-closed: checkout and membership verification unavailable pending PayFast merchant verification. Do not activate payments or publish protected static assets.
- **Still missing:** verified merchant approval, secure PayFast notification handling and recurring lifecycle, authenticated PLUS entitlement, real guest/free/paid/cancelled/refunded browser tests, production release-SHA smoke, founder GO decision.

## Additional verified offline evidence — 18 November 2026

- [PR #367](https://github.com/shaunoppel-byte/Kindelora-Platform/pull/367) added synthetic commerce to the PLUS checkout guard. [Run 44374979762](https://github.com/shaunoppel-byte/Kindelora-Platform/actions/runs/44374979762) passed the checkout guard, fail-closed middleware and synthetic commerce steps.
- [PR #368](https://github.com/shaunoppel-byte/Kindelora-Platform/pull/368) fixed synthetic multi-order refund entitlement handling; [run 44378343978](https://github.com/shaunoppel-byte/Kindelora-Platform/actions/runs/44378343978) passed all three PLUS guard steps.
- [PR #369](https://github.com/shaunoppel-byte/Kindelora-Platform/pull/369) merged cross-brand synthetic entitlement isolation; [run 44379614728](https://github.com/shaunoppel-byte/Kindelora-Platform/actions/runs/44379614728) passed all three PLUS guard steps, with 12/12 PR workflows successful.
- [PR #370](https://github.com/shaunoppel-byte/Kindelora-Platform/pull/370) merged negative synthetic payment-state checks; [run 44380138766](https://github.com/shaunoppel-byte/Kindelora-Platform/actions/runs/44380138766) passed all three PLUS guard steps, with 12/12 PR workflows successful.
- [PR #371](https://github.com/shaunoppel-byte/Kindelora-Platform/pull/371) merged forged ITN/webhook/entitlement request denial tests; [run 44380472606](https://github.com/shaunoppel-byte/Kindelora-Platform/actions/runs/44380472606) passed all three PLUS guard steps, with 12/12 PR workflows successful. Latest inspected main merge SHA: `dc0bfca499be6e95a8ddc71536c045a7afe2ffaa`.
- These results are **PR-head offline tests**, not PayFast approval, verified production ITNs, deployed-site validation or live checkout evidence.

## PayFast integration implementation contract — pending merchant approval

The following is a **design and acceptance checklist**, not implemented or verified production capability:

1. **Merchant configuration:** confirm PayFast merchant verification and correct environment; store merchant identifiers, signing passphrase and API credentials only in restricted Cloudflare secrets, never in GitHub, public JavaScript, build artifacts, logs or browser storage. Keep sandbox and live configuration separate.
2. **Checkout initiation:** authenticate the customer on the server; create a unique server-side order with an immutable expected amount, currency, brand and customer identity. Browser-supplied amount, identity or success redirect must never grant PLUS.
3. **ITN verification:** receive server-to-server PayFast notification at a dedicated endpoint; validate authenticity using the provider's current documented verification requirements, including signature, expected merchant, amount/currency, order reference and server-to-server validation as applicable. Fail closed on missing or mismatched fields; do not assume an unverified form POST is authoritative.
4. **Idempotency and state:** persist order, payment event, subscription and audit state; enforce unique event/payment identifiers, safe retries and monotonic state transitions. Duplicate notifications must not double-bill, issue duplicate invoices or incorrectly change access.
5. **Entitlement:** compute paid access server-side from verified active subscription state scoped to the authenticated customer and KINDELORA brand. Verify every protected API/download request; never trust cookies, localStorage or user-supplied membership flags.
6. **Lifecycle:** independently test successful and failed payments, renewals, grace/expiry policy, cancellation, refunds, chargebacks and multiple concurrent orders. Ensure one refunded order does not revoke another independently valid paid entitlement.
7. **Data protection and operations:** minimize customer data; restrict secrets and logs, redact PII, document retention and POPIA controls; add alerting, recovery and reconciliation without paid infrastructure.
8. **Launch evidence:** record redacted sandbox/live ITN verification, replay/tamper rejection, persistence and browser E2E, Cloudflare deployed commit SHA and founder GO decision. Keep checkout disabled until every required gate is PASS.

## Mandatory end-to-end test plan

1. **Guest:** Open all public pages, protected routes, audio/image download URLs and API endpoints; confirm protected responses are 401/403 and no paid bytes appear in response bodies, browser storage or service-worker caches.
2. **Free signed-in account:** Repeat all guest checks; verify client-side edits to cookies, localStorage, query strings and request headers cannot grant paid access.
3. **Verified paid account (only after PayFast integration is approved):** Confirm server-side subscription entitlement, permitted content access, Favourites persistence, archive access, and no access to another account's data.
4. **Expired/cancelled/refunded account:** Confirm entitlement revocation, denied direct downloads and cache purging; verify billing status cannot be changed by client requests.
5. **Session transitions:** Test login, logout, token expiry, account switching, multiple tabs, fresh browser, private browsing, offline mode and service-worker updates.
6. **Payment:** Validate PayFast signatures and server-to-server confirmation, duplicate webhook idempotency, failed/abandoned payment, recurring payment and refund/cancellation outcomes. Never grant access from a browser redirect alone.
7. **Production:** Record HTTP status, response headers, redacted evidence, deployed commit SHA, browser/device, and date for each test. Do not store credentials or sensitive customer data in GitHub.

## Release rule

Keep checkout disabled and #359 open until all gates have recorded PASS evidence, PayFast merchant verification is confirmed, and an explicit founder go-live decision is recorded. No paid-content payload may be placed in publicly downloadable static assets.
