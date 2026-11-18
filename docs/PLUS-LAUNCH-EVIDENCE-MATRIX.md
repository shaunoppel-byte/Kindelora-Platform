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
