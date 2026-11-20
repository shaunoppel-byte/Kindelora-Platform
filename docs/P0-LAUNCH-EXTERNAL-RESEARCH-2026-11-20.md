# P0 launch engineering: external evidence and verification gates (20 Nov 2026)

This is a research-backed investigation plan, **not** proof of live registration or payment. Production launch remains NO-GO until live E2E gates pass. Never put passwords, Resend API keys, PayFast passphrases, tokens, customer emails or card data in logs or tickets.

## Registration: highest-priority hypothesis

Source: https://developers.cloudflare.com/workers/platform/limits/

- Cloudflare Workers Free has a 10ms CPU limit per HTTP request; exceeding it can terminate execution with error 1102 and invocation outcome `exceededCpu`.
- Current `functions/api/member/registration-request.js` calls `crypto.subtle.deriveBits` with PBKDF2-SHA256, **310000 iterations**. `functions/api/member/login.js` repeats the same KDF.
- Earlier registration diagnostics reportedly stopped around `password_hash_started` / `registration_internal_error`. This is **suggestive, not conclusive**.
- Verify Cloudflare Pages Functions invocation CPU time, outcome, and final privacy-safe audit stage for one controlled test. Check whether the execution reaches `password_key_imported`, `password_hash_completed`, `verification_record_created`, and `provider_accepted`. Do not repeat signup attempts until rate-limit state is understood.
- If `exceededCpu` is confirmed, design a secure KDF/runtime remedy with explicit cost and security review; do **not** silently weaken password hashing or expose password material. Evaluate supported CPU allowance and runtime platform without assuming a paid plan is authorized.

## Email delivery (only after hashing and DB insert are proven)

Sources: https://resend.com/changelog/improved-logs-visibility ; https://resend.com/changelog/email-events-timeline ; https://resend.com/changelog/email-suppression-visibility

- Inspect Resend request status and message events (accepted, delivered, bounced, suppressed). API acceptance is not inbox delivery.
- Confirm sender domain verification and authentication; check whether `REGISTRATION_FROM_EMAIL` is authorized for the configured Resend account.
- Verify D1 migrations `0001_member_identity.sql`, `0002_member_verified_email.sql`, `0003_member_verification_claim_nonce.sql` and production bindings.
- Gate: real verification message received, token consumed once, member created, verified login succeeds, session cookie works.

## PayFast: official protocol and real-world failure modes

Official: https://developers.payfast.co.za/docs ; https://developers.payfast.co.za/docs/itn-instant-transaction-notification/ ; https://support.payfast.help/portal/en/kb/articles/common-causes-of-a-failed-integration-signature-mismatch-20-9-2022 ; https://support.payfast.help/portal/en/kb/articles/what-causes-the-itn-security-check-errors-20-9-2022

Community: https://stackoverflow.com/questions/51889825/payfast-not-redirecting-to-notify-url ; https://stackoverflow.com/questions/79501940/payfast-signature-python-generated-signature-does-not-match-submitted-signatu ; https://stackoverflow.com/questions/79768198/payfast-cancel-subscription-sandbox-mode-in-python

1. Generate PayFast custom-checkout signatures server-side using **documented field order**, nonempty trimmed values, correct URL encoding (uppercase escapes and '+' for spaces), passphrase, and lowercase MD5. Do not confuse with PayFast API signatures, which use alphabetized parameters.
2. Sandbox merchant credentials/passphrase must match the sandbox account; recurring subscriptions require a passphrase. `subscription_type=1`, monthly `frequency=3`, annual `frequency=6`, and `cycles=0` only if indefinite recurrence is intended and approved.
3. Preserve approved USD display prices **$8.99 monthly / $89.99 annually** while settling PayFast in **ZAR** using an auditable locked FX quote and minor-unit reconciliation. Never invent an FX rate or charge amount.
4. Create server-side pending order before checkout. Use unique `m_payment_id`, stable correlation and exact expected ZAR amount.
5. `notify_url` must be public HTTPS and respond without redirect or authentication challenge; verify PayFast source, signature, merchant, order, exact amount, status, and POST confirmation via `/eng/query/validate` as documented. Treat return/cancel URLs as display/navigation only.
6. Persist raw notification identifiers safely and enforce event idempotency and valid state transitions. Activate PLUS only after authenticated COMPLETE; replay, invalid signature, wrong amount, cancelled/failed/refunded events must not grant access.
7. Test initial sandbox subscription, recurring ITN, failure, cancellation, retry and replay. Distinguish provider-accepted callback from settled/verified payment. Preserve no-charge guard until evidence exists.
8. Before production switch, confirm PayFast merchant recurring-billing enablement and production credentials independently; do not reuse sandbox passphrase or endpoints.

## Evidence ledger required for GO

- Registration: runtime outcome and CPU time; D1 migration verification; Resend accepted/delivered event; verified account and login.
- Payments: signed sandbox checkout; verified ITN; reconciled ZAR order; correct PLUS entitlement; duplicate/rejected/cancelled behavior; cancellation policy.
- Until then retain deny-by-default `functions/_middleware.js` PLUS protection and `checkoutAvailable:false`.

No secrets, live charges, payment enablement, or weakened security are authorized by this research document.
