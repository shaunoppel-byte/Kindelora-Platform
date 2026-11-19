# P0 — KINDELORA Registration and PayFast Launch Blueprint
Status: **NO-GO** for public registration and real payments until the acceptance evidence below is verified.
Owner: Oppel Enterprises Group. Target: Cloudflare Pages/Functions + D1, PayFast, zero additional paid infrastructure.

## A. Public registration: implementation contract
1. Keep existing invitation-only flow for known verified invitees until a verified-email onboarding mechanism is deployed. Do not remove the invitation requirement without replacing its verification protection.
2. Implement a self-service registration initiation endpoint with generic responses, input length limits, per-IP/email rate limits and CAPTCHA/Turnstile as appropriate. Generate single-use, time-limited email verification tokens and store only hashes in D1. Deliver confirmation email using an approved sender (provider and free tier to be verified). Do not expose tokens in logs or client.
3. Activate member only after verification. Require 12+ character password, PBKDF2 or stronger, secure HttpOnly SameSite cookie, login throttling, CSRF/origin validation, password reset, session expiry and logout.
4. D1 migrations must be applied to the actual production DB and secrets set in Cloudflare, never GitHub. Check production readiness without exposing secrets.
5. End-to-end: new email -> verification -> registration -> login -> session renewal -> logout -> re-login; expired token, duplicate email, forged token, brute-force, cross-user and offline failure tests.

## B. PayFast: payment acceptance contract
1. Preserve founder-approved USD **display** prices: monthly $8.99, annual $89.99. Obtain actual PayFast recurring billing currency approval and exact charge amounts; do not infer FX conversion or assume USD settlement.
2. Verify merchant supports recurring payments and brand. Store merchant ID, key and passphrase only as Cloudflare secrets; implement signing compatible with Cloudflare Workers runtime (Node crypto module is not sufficient by itself).
3. Authenticated server creates random order ID, approved plan, immutable amount/currency, member identity and pending D1 order in a transaction. Never trust amount, identity or entitlement from browser.
4. Redirect only to approved PayFast sandbox/live hosted checkout. A return/success URL is never payment proof.
5. ITN endpoint: validate signature and passphrase, merchant ID, amount/currency, expected order, payment status and provider confirmation; reject forged/mismatched/replayed events. Persist unique event and order/subscription changes atomically and idempotently; do not store raw credentials or PII.
6. Entitlement only from server-side authenticated identity and verified, current subscription. Renewal, failure, refunds, cancellation at provider, paid-through expiry and webhook retries must be covered.
7. No customer charge until sandbox success, all negative tests, actual merchant/currency confirmation, approved policies, rollback, and explicit founder authorization.

## C. Required release evidence
| Gate | Acceptance evidence | Current |
| --- | --- | --- |
| Registration | Fresh unaffiliated email creates and verifies account in production | NOT VERIFIED |
| Login | Secure cookie, session expiry, throttling and logout tested in production | NOT VERIFIED |
| DB | Production D1 migrations/bindings and secret configuration confirmed | NOT VERIFIED |
| Currency | Provider-verified currency and approved recurring amount | NOT VERIFIED |
| Checkout | Sandbox signed order, redirect, verified ITN and order paid exactly once | NOT VERIFIED |
| Security | Forged/replayed/wrong amount/wrong merchant/cross-user rejected | NOT VERIFIED |
| Billing | Renewal, failure, cancellation, refund and paid-through access tested | NOT VERIFIED |
| Mobile | Android/iOS browsers and PWA flows tested, accessible | NOT VERIFIED |
| Production | Controlled live low-value transaction and rollback verified | NOT VERIFIED |

## D. Implementation sequencing
- **P0.1** Repair CI regression and verify account production smoke.
- **P0.2** Deliver public verified-email registration + password recovery with D1 and secrets.
- **P0.3** Implement Cloudflare-compatible PayFast signing, authenticated order creation, ITN verifier and atomic D1 event application behind disabled checkout.
- **P0.4** Implement provider subscription management, cancellation, renewal and refund flows.
- **P0.5** Complete sandbox/negative/mobile tests and controlled live acceptance; enable payment only after explicit approval.

**Non-negotiable:** GitHub merge and CI success do not prove Cloudflare configuration, PayFast merchant capability, a real successful transaction or production release readiness.
