# Finance database and central portal — implementation/test status

Migration: `migrations/0001_finance_core.sql` is **committed only**, not applied to a production database. It establishes separate business IDs, per-business/year counters, payment idempotency key, globally unique invoice numbers, staff role grants and audit/outbox tables.

## Atomic invoice issuance (not implemented)
Use a **single transactional unit** after independently verifying PayFast ITN and matching order, amount and currency:
1. Insert verified provider transaction ID with a UNIQUE constraint. On duplicate, retrieve the original payment/invoice; do not create another.
2. Create or initialise the (business_id, invoice_year) counter row, then atomically increment with `UPDATE finance_invoice_counters SET last_sequence = last_sequence + 1 WHERE business_id = ? AND invoice_year = ? AND last_sequence < 999999999 RETURNING last_sequence`.
3. Build `CODE-YYYY-NNNNNN` using the trusted business mapping, insert invoice and outbox record. Commit all or none. Ensure the chosen Cloudflare D1 transaction/atomic batch semantics are verified before production.
4. Render the invoice to a **private** PDF object and send customer email only through an idempotent delivery process. Never place PDFs in public static assets.

**No invoice is validly issued by this migration alone.** Invoice numbers must not be allocated from client-side state, timestamps, random IDs or an unguarded SELECT MAX query.

## Central owner portal
A private portal must use server-side login, MFA, secure cookies, session expiry and per-business role grants. Current middleware deliberately denies all finance paths, even to the owner. Do not create a public finance dashboard or put credentials in GitHub. A hidden URL is not access control.

## Test cases required before enabling payments
- Concurrent successful payments for same business receive distinct increasing invoice numbers.
- First invoices for all five businesses have distinct prefixes and no global collisions.
- Replayed PayFast notification generates no second invoice or email.
- Invalid signature, mismatched amount/order/merchant and failed payments generate no invoice.
- Different-business and different-customer invoice fetches return 403; revocation takes effect.
- Customer email failure retries without a duplicate invoice; no PDF appears in public cache.
- Bank settlement net equals gross minus fees/refunds; mismatches remain unresolved for manual reconciliation.
- Accountant verifies VAT status, seller identity, legal invoice fields and numbering policy.

## Status
Database schema and invoice-number formatter are code artifacts; they are **not a functioning owner portal, live database, PayFast connection or invoicing system**. Keep checkout disabled until all integration and security gates pass.
