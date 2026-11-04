# KINDELORA Plus — payment launch gate and implementation plan
Date: 2026-11-04
Status: NOT ACCEPTING PAYMENTS. No merchant account, verified webhook, or authenticated entitlements are configured in this repository.

## Proposed plans
- Monthly: USD 4.99 (indicative, subject to provider currency and merchant settlement approval)
- Annual: USD 49.99 (indicative, 16.5% less than twelve monthly payments)
- Free: core encouragement, device-local reflections and favourites, sharing.
- Plus: planned guided journeys, cross-device favourites, tailored content, opt-in delivery. Do not claim these work until built.

## PayFast-specific constraints to resolve
PayFast recurring subscription integration requires merchant ID/key and a security passphrase; recurring_amount is denominated in ZAR according to official documentation. A USD display price is NOT automatically a USD charge. Founder must approve ZAR pricing or confirm a compatible provider for actual USD billing. Credit card is the recurring-billing method documented by PayFast. No keys or passphrases in GitHub/browser.

## Secure implementation sequence
1. Confirm legal merchant, active PayFast account, applicable charges, recurring billing enablement and approved customer billing currency.
2. Add Cloudflare Worker/Pages Functions API with server-side session authentication, rate limiting and verified customer email. No entitlement from a local cookie or URL query string.
3. Add persistent D1 tables for customers, subscriptions, orders, payment events and idempotency keys. Apply minimal retention and access controls.
4. Create checkout session/order server-side using fixed plan catalog, amount and currency. Generate PayFast signature server-side. Never trust browser-provided prices or plan IDs.
5. Handle PayFast ITN: validate signature, merchant ID, payment amount/currency, originating provider and provider confirmation; reject replay; persist raw event reference and reconcile subscription. Grant access only after verified COMPLETE notification.
6. Implement entitlement checks on every premium API request; prevent free visitors accessing Plus content merely by changing frontend state.
7. Build account page for status, billing history, cancellation and support. Cancellation must be confirmed by provider; update entitlements based on paid-through date.
8. Implement recurring payment failure, expiry, refund, chargeback, cancellation and recovery handling.
9. Add clear price/currency, tax applicability, renewal, cancellation, refund, privacy and support disclosures before checkout.
10. QA sandbox: valid/invalid signatures, replay, amount mismatch, duplicate ITN, declined payments, renewal, expiry, cancel, refund, concurrency, cross-account access, downtime and rollback. Then founder-approved limited production transaction.

## Release rules
- No payment CTA pointing to a fake checkout.
- No subscription marked active from return_url alone.
- No live charges without founder confirmation of provider, currency, pricing and fees.
- Free site must remain usable during provider downtime.
- Preserve rollback to the current static site.
