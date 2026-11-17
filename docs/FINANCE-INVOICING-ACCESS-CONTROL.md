# Payments, invoices and owner-only finance ledger — implementation contract

Status: DESIGN APPROVED IN PRINCIPLE / NOT LIVE. Applies to KINDELORA first; reusable per business under Oppel Enterprises. This document contains NO customer records, bank data or credentials. Paid checkout remains disabled under #359.

## Event-driven flow (never trust the browser redirect)
1. Create an internal order with unique immutable ID, business/legal-entity ID, customer ID/email, itemised price/currency/tax snapshot, and `pending` state.
2. Initiate PayFast checkout only when merchant credentials and secure backend are configured. Never put merchant secrets in frontend code or GitHub.
3. Receive PayFast server notification (ITN) on a dedicated backend endpoint. Verify signature/passphrase, merchant ID, exact amount/currency/order ID, payment status and provider-origin verification using PayFast's current documented method. Apply replay protection and idempotency on provider transaction ID; verify independently before marking `paid`. Browser return/cancel URLs are informational only.
4. Atomically record a confirmed payment and issue **one** uniquely numbered invoice per settled payment (or use a compliant receipt/tax-invoice sequence according to accountant's advice). Save an immutable invoice snapshot and PDF in private storage; never public static Pages, repository, or public bucket. Do not silently overwrite invoices.
5. Queue a transactional email to the customer's verified order email, attaching PDF or using a short-lived authenticated download link. Email failure must not reverse a confirmed payment; retry idempotently with delivery state and error metadata.
6. Display an authenticated, owner-scoped **Download invoice** link on the customer's order page after successful verification. Authorise each request server-side; never rely on a guessable invoice URL.
7. Capture fees, gross, refunds, net settlements and settlement date separately. Match PayFast settlement reports to bank credits and record reconciliation status and differences. Refunds/credit notes reference original invoice and never erase historical records.

## Required invoice fields
Invoice number and issue date; legal seller name and verified registration/address/contact details; VAT number **only if registered and verified**; customer name and supplied billing details; product/service description; quantity; currency; unit price; discounts; tax basis/rate/amount; subtotal; total; payment date; PayFast reference; internal order ID; invoice status; credit-note linkage. Confirm applicable South African tax-invoice requirements, currency conversion, VAT registration status and retention period with an accountant before issuing live tax invoices. Never represent a business as VAT registered without confirmation.

## Private storage (zero-cost-first, subject to provider quotas)
Cloudflare Worker backend + D1 for relational transaction metadata, audit and RBAC; private R2 bucket for PDFs **only if available within approved zero-cost allowance** (otherwise encrypted private object storage under an approved free tier; no public GitHub storage). Durable delivery queue can initially be a D1 outbox processed by a scheduled Worker, avoiding a paid queue. Email provider must be configured for transactional sending with approved free-tier limits and SPF/DKIM/DMARC; do not promise delivery until provider verified.

Suggested entities:
- `businesses(id, legal_name, registration_number, vat_number_nullable, invoice_prefix, next_invoice_sequence)`
- `customers(id, business_id, email, name, billing_address_nullable)`
- `orders(id, business_id, customer_id, status, currency, amount_minor, tax_snapshot_json, created_at)`
- `payments(id, order_id, provider, provider_payment_id UNIQUE, amount_minor, currency, status, confirmed_at, gross_minor, fee_minor, refund_minor)`
- `invoices(id, business_id, order_id, payment_id UNIQUE, invoice_number UNIQUE, issued_at, amount_minor, currency, private_object_key, sha256, status)`
- `credit_notes(id, invoice_id, credit_number UNIQUE, amount_minor, reason, issued_at)`
- `settlements(id, business_id, provider_settlement_id UNIQUE, bank_reference, settlement_date, gross_minor, fees_minor, net_minor, reconciled_at_nullable)`
- `email_outbox(id, invoice_id, recipient, template, status, attempt_count, last_error_redacted, next_attempt_at)`
- `staff_users(id, identity_provider_subject UNIQUE, status)`
- `role_grants(id, business_id, staff_user_id, role, granted_by, granted_at, revoked_at_nullable)`
- `audit_log(id, actor_id, business_id, action, target_type, target_id, timestamp, request_id, metadata_redacted)`

Store amounts in **integer minor units** with explicit currency and rounding rules. Encrypt sensitive fields where appropriate; apply backup, retention, and POPIA minimisation/access controls. Never store full payment-card data. Do not log customer billing details or signed invoice links.

## Owner-controlled roles
- **Owner:** full cross-business financial access; invite/revoke staff; grant roles; download/export; cannot delete immutable audit history.
- **Finance administrator:** invoices, payment reports, reconciliation and credit notes for explicitly granted businesses; cannot grant roles.
- **Bookkeeper:** read/export invoices, settlements and bank reconciliation, annotate matches; no refunds, no staff management.
- **Support:** search limited order/payment status and resend invoice through a controlled endpoint; no bank reports, full invoice exports or tax settings.
- **Auditor:** time-bound, read-only access to explicitly assigned businesses; every export logged.
- **Customer:** only own confirmed invoices via authenticated session, not staff privileges.

All permissions checked **server-side per business and resource**. Default deny. Owner invitations require authenticated owner action, MFA where supported, explicit business scope, expiry and revocation. Audit login, permission changes, invoice views/downloads, exports, refunds and reconciliation edits. No shared admin password or client-controlled role flags.

## Release gates
- Real PayFast merchant verification; documented and independently verified ITN; test invalid signature, amount mismatch, replay, duplicate events, out-of-order status, refund and failed payment.
- Invoice numbering atomic under concurrency; exact arithmetic; legally reviewed invoice fields; invoice generation, private PDF access, email retry, customer download and owner RBAC E2E.
- Multi-business data isolation, cross-customer access denial, staff role escalation denial, signed-link expiry, backup/restore and audit integrity.
- Reconciliation: PayFast transaction -> fees/settlement -> bank statement, including partial refunds and chargebacks.
- Explicit founder sign-off and green CI/production evidence before enabling any payment or invoice email.

**Current state:** No real payment, invoice email, private ledger, staff portal or downloadable invoice is claimed operational. Do not collect financial data or enable checkout until implemented and tested.

## Founder-approved director identity decision — 17 November 2026

- **Exactly two initial Director identities**, one per director. Each signs in with their **own private, individually verified email address** and self-created password. Neither director uses `oppelenterprises@gmail.com` as a shared login or as the other's password-recovery mailbox.
- `oppelenterprises@gmail.com` remains the **corporate notification inbox**, not a login credential, password reset destination or authentication bypass.
- Both directors receive Group-wide read access to all five business workspaces; privileged writes, role grants, refunds, financial exports and changes to payout configuration require explicit server-side policy, MFA step-up where appropriate and durable audit logging. Equal visibility does not mean unreviewed money movement.
- Use a trusted identity provider or a carefully audited server-side identity implementation; enforce phishing-resistant passkeys/WebAuthn or authenticator MFA, secure session cookies, CSRF protection, rate limits, email verification, reauthentication for high-risk actions and immediate session revocation on credential change.
- Password recovery sends a **single-use, short-lived token** only to the requesting director's verified private inbox. Store only a hash of the reset token; do not disclose whether an email is registered. Reset revokes existing sessions and sends security notifications. Recovery must not silently bypass mandatory MFA: require an independently verified second factor or a documented high-assurance recovery procedure.
- Founder invitation/onboarding must **not** hard-code or commit either private email, password, reset token, MFA secret or API key to GitHub, the public prototype or logs. Provision identities only through the authenticated private identity administration flow, with the director choosing their own secret.
- Keep the public `finance-design-preview.html` synthetic and clearly labelled; the future production finance origin, sensitive routes and APIs must fail closed without valid authenticated sessions and authorisation. A cosmetic login page is not a security boundary.
- **Implementation status:** Approved architecture and requirements only; director accounts, identity provider, password reset email, MFA, private financial portal and production authentication are **not yet provisioned or tested**. Never claim they are live.
