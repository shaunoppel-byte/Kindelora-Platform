# KINDELORA Plus — payment launch gate and implementation plan
Updated: 2026-11-19
Status: NOT ACCEPTING PAYMENTS. Oppel Enterprises Group PayFast merchant account verified and activated on 2026-11-19 (founder-supplied provider email). No verified PayFast webhook, live checkout, or authenticated entitlements are configured in this repository.

## Proposed plans
- Monthly: USD 8.99 (indicative, subject to provider currency and merchant settlement approval)
- Annual: USD 89.99 (indicative, approximately 16.6% less than twelve monthly payments)
- Free: core encouragement, device-local reflections and favourites, sharing.
- Plus: planned guided journeys, cross-device favourites, tailored content, opt-in delivery. Do not claim these work until built.

## PayFast-specific constraints to resolve
PayFast recurring subscription integration requires merchant ID/key and a security passphrase; recurring_amount is denominated in ZAR according to official documentation. A USD display price is NOT automatically a USD charge. Founder must approve ZAR pricing or confirm a compatible provider for actual USD billing. Credit card is the recurring-billing method documented by PayFast. No keys or passphrases in GitHub/browser.

## Secure implementation sequence
1. Merchant activation is confirmed for Oppel Enterprises Group. Confirm provider-approved per-brand use, applicable charges, recurring billing enablement and approved customer billing currency before checkout.
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

## Oppel Enterprises Group cross-brand payment standard (founder-approved 2026-11-19)
- One legal merchant integration foundation: Oppel Enterprises Group, subject to PayFast confirming permitted multi-brand use; never assume a brand is individually approved.
- Covered implementations: Oppel Enterprises consulting/one-off invoices; KINDELORA monthly/annual PLUS; VELORA creator/digital purchases and subscriptions where approved; KINDRA subscriptions subject to adult-safety and merchant acceptance; SOLELAB physical-goods orders. KINDRA public website is a separate frontend, not an independent merchant.
- Common customer journey: product/quote selection → final merchant identity, exact billing currency, total, taxes, recurrence and refund/cancellation disclosures → authenticated server-created order → PayFast-hosted payment → pending state → provider-verified notification → confirmed receipt/fulfilment or entitlement.
- Common security: no browser-side merchant secrets or card capture; server-generated fixed price catalogue and signatures; verify ITN signature, merchant identity, order, amount, provider source and server confirmation; persist idempotent events; no access granted from return URL; rate limits, audit, refunds and rollback.
- Brand separation: brand-scoped order IDs, customer records, tax/invoice references, products and fulfilment; prohibit cross-brand entitlement leakage. Shared merchant credentials must remain only in protected Cloudflare environment secrets, not GitHub or browser assets.
- Currency is a HARD BLOCKER: USD display prices are indicative until Rushjaan confirms supported billing and settlement currency, recurring capability, international card acceptance and fees. Never silently convert or charge a ZAR amount without clear customer disclosure and founder approval.
- Production gate per brand: verified provider capabilities, legal policies, D1 binding and migrations, authentication, sandbox ITN and lifecycle tests, independent security review, green CI, staged release, real limited transaction and rollback. Do not treat an account activation email as evidence of working checkout.
- Zero-cost objective: use existing GitHub Actions and Cloudflare free-tier infrastructure where technically sufficient; provider transaction fees and any service limits must be disclosed, not assumed zero.
