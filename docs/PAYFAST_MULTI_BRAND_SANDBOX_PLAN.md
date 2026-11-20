# PayFast multi-brand integration plan — sandbox-first / production NO-GO

Status: DESIGN ONLY. This document does not authorize production checkout or real charges.

## Official documentation
- Hosted checkout and ITN: https://developers.payfast.co.za/docs
- Recurring Billing API: https://developers.payfast.co.za/api
- Sandbox: https://sandbox.payfast.co.za

## Architecture
- Reusable server-side adapter for KINDELORA, KINDRA, VELORA, and Oppel Enterprises, with strict per-brand configuration and distinct order IDs.
- Cloudflare Pages Functions/Workers for server-authoritative order creation and signing; D1 for immutable order facts, provider event IDs, and entitlements.
- Browser uses PayFast hosted checkout; never accept card data or a payment-success claim from browser return URLs.
- No live credentials or passphrases in repository, public JS, logs, mobile app or test fixtures.
- Default fail closed: existing `functions/api/plus/checkout.js` GET/POST 503 must remain in place until separately reviewed release.

## PayFast-specific protocol
- Hosted checkout: POST https://sandbox.payfast.co.za/eng/process in sandbox; https://www.payfast.co.za/eng/process in live. Follow *documented field order* for signature canonicalization, URL-encode correctly, add passphrase, MD5 as PayFast requires.
- REST API: https://api.payfast.co.za/subscriptions/{token}/{action}; sandbox uses `?testing=true` where documented. REST signatures use *alphabetically sorted* variables and signed headers, not hosted-checkout order.
- Recurring subscriptions require passphrase and `subscription_type=1`; capture subscription token from verified ITN. Check recurring merchant permissions.
- ITN: independently validate signature, PayFast source, server-to-server validation and exact order amount/currency/merchant; never grant entitlements from redirect, unsigned callback or unverified notification. Do not treat IP headers or referrer alone as authenticity.
- Never respond success before durable verification and idempotent processing; use bounded retries and safe reconciliation.

## Currency and merchant questions (P0 commercial)
- Founder-approved KINDELORA display pricing: USD 8.99/month and USD 89.99/year. Existing D1 `plus_orders.currency` only permits ZAR. PayFast's classic recurring API uses ZAR cents.
- Obtain PayFast written confirmation on multi-brand merchant account usage, recurring API permissions, USD presentment/settlement, and applicable fees.
- Until confirmed: NO checkout. If ZAR settlement is required, design server-owned FX quote with timestamp, source, expiry, rounding, customer-visible ZAR total, and fixed/variable recurring policy approved before implementation.
- Do not silently charge an invented conversion or silently change recurring amounts.

## Implementation sequence (separate small PRs)
1. Pure signature/canonicalization library and known PayFast test vectors; test Unicode, spaces, empty values, duplicate keys, wrong ordering, and passphrase handling. No endpoint exposure.
2. Server-side brand catalog and signed checkout-intent preparation with fake credentials in offline tests. Authenticate customer, enforce pricing, anti-CSRF, and unique order ID.
3. Mock ITN validator and state machine: signature/source/server validation, exact order matching, duplicate/replay resistance, database atomicity, out-of-order and failure handling.
4. Subscription entitlements: grant only on verified COMPLETE, renewals extend period once, cancellation blocks future renewal while preserving paid-through access per policy, failed payment/past_due and refunds revoke or reconcile as policy requires.
5. Sandbox checkout/ITN/recurring integration with test-only credentials and explicit logs free of PII. Sandbox does not simulate every live failure; use negative mocked tests.
6. Independent production merchant/credential verification, deployment config, FX policy, security review, CI, E2E and release approval. Only then propose enabling checkout in a distinct guarded PR.

## Required test matrix
- Hosted signature parity and REST signature parity with official fixtures.
- Sandbox one-off, monthly and annual setup; verified ITN token capture.
- Signature tampering, spoofed source, server verification unavailable, incorrect merchant, amount, currency, order ID.
- Duplicate and reordered ITNs, parallel processing, stale/unknown events, idempotency, DB rollback.
- Renewal success/failure, cancellation, card update, subscription pause/resume, refund/chargeback and expiry.
- Unauthenticated checkout, price manipulation, cross-brand order access, token leakage, CSRF and rate limiting.
- Zero-cost configuration guard, no live charges, checkout 503 before release, no secrets in CI artifacts.

## Release decision
**NO-GO** until verified PayFast merchant and recurring capability, currency/settlement policy, successful mocked + sandbox E2E, secure ITN verification, D1 migration review, and KINDELORA registration readiness. No production payments are to be attempted during development.
