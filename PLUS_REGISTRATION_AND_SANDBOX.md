# KINDELORA Plus — Founder Registration & Sandbox Checklist
Updated 2026-11-04. No live checkout, charge, recurring billing, or entitlement is enabled.

## Founder: PayFast merchant setup
1. Register at https://registration.payfast.io/ as Company (registered legal entity) or Sole Trader (individual).
2. Verify email and upload required FICA, business, address and banking evidence using the PayFast portal.
3. After verification, enable recurring billing by creating a security passphrase under Settings > Developer Settings.
4. Independently create sandbox account at https://sandbox.payfast.co.za/; sandbox is separate from live.
5. Confirm settlement account, recurring billing eligibility, currency, international-card acceptance, refund and chargeback costs.
6. Never paste merchant credentials, identity numbers, documents or passphrases into chat, GitHub or website source.

## Engineering readiness
- Prepared: D1 schema in db/schema.sql; server-owned order/customer/subscription/event records; unique provider event keys.
- Not implemented: authenticated backend, session verification, PayFast signature, ITN validation, D1 binding, checkout, entitlements, account management.
- Required Cloudflare environment secrets (when implementation is reviewed): PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, PAYFAST_PASSPHRASE; never public env variables.
- Keep PLUS_ENABLED=false until sandbox end-to-end and founder approval.
- Payment notifications must validate provider signature, merchant ID, expected order/amount/currency, origin, replay/idempotency and confirmed status. Do not activate on redirect alone.
- Never put PayFast token or credentials in a client-side localStorage field.
- Do not expose account lookup by email without verified authentication.
- Ensure cancellation, refunds, privacy policy, recurring disclosures and customer support before launch.

## Currency decision
PayFast documents subscription recurring_amount in ZAR. The current USD 4.99 / USD 49.99 website values are illustrative, not confirmed charges. Approve ZAR price points or choose a verified USD-capable merchant provider before accepting payment.

## Acceptance gates
A. Sandbox checkout completed, notification verified, order marked paid once.
B. Replayed, invalid, mismatched amount, wrong merchant, and forged notifications rejected.
C. Cross-user entitlement denied, unauthenticated requests denied.
D. Renewal, payment failure, cancellation, refund and paid-through access tested.
E. Mobile + PWA flow tested, and Free remains usable with backend offline.
F. Production launch only after legal/merchant verification, live secrets, pricing approval, policies, rollback and founder authorization.
