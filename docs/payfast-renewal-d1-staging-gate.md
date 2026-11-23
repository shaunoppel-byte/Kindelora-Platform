# PayFast renewal — D1 staging release gate (Issue #806)

**Status: NO-GO.** SQLite CI is not proof of Cloudflare D1 transaction behaviour. No production renewal execution or charging may be enabled based on this document.

## Environment isolation

1. Provision a **separate non-production D1 database** and non-production Worker/Pages environment. Never reuse production D1 identifiers, tokens, or customer records.
2. Apply the baseline `migrations/0001_plus_persistence.sql`, then `migrations/20261123_plus_payfast_recurring_linkage.sql` and `migrations/20261123_plus_payfast_renewal_atomic_guard.sql` to staging only.
3. Use synthetic customers, orders, subscription IDs and provider tokens. No real PayFast credentials, transactions or callbacks.
4. Capture staging database identifier, migration checksums, Wrangler version, UTC test timestamp and execution logs in Issue #806; redact tokens and secrets.

## Required transactional checks

Use the SQL statements in `prepareAtomicPayFastRenewal(...).proposedStatements` **only** in a controlled staging test harness; the production composer must remain inert (`execute:false`, `statements:[]`, `grantEntitlement:false`). Execute all statements as a **single D1 `db.batch(...)`**. Do not run the individual statements separately.

- Valid paid initial order, matching persisted recurring token, merchant reference, amount, customer and subscription: exactly one renewal event, exactly one subscription period advancement, guard table empty.
- Replay the same provider transaction: batch must fail, no second event, period unchanged, guard empty.
- Each mismatch must fail atomically with unchanged ledger and entitlement: missing/wrong token, pending initial order, cancelled subscription, changed previous period, wrong amount, provider ID previously used by initial payment, order reassigned to another customer, subscription reassigned to another customer.
- Verify that **every rejected batch** leaves the event count, subscription period and guard table unchanged. Capture before/after SELECT snapshots and exception messages.
- Concurrent same-provider-event submissions: at most one committed event and one period extension; verify actual D1 semantics and record both outcomes.

## Provider identity gate

The current `authenticateLivePayFastItn` returns an authenticated payment envelope **without an independently verified recurring subscription token**. That envelope alone cannot satisfy `verifyPersistedPayFastRenewalLink`. Before activation, establish PayFast's documented recurring notification fields and independently authenticate the subscription token, merchant reference, provider transaction, settlement amount, and customer/subscription linkage. Never trust a client-supplied `verified:true` object.

## Promotion criteria

Require: staging D1 evidence for all cases above; provider-authenticated recurring identity; negative/replay/concurrency E2E evidence; verified settlement currency/amount and first-period-versus-next-period billing; CI green; operator sign-off. Only then consider a separately reviewed, explicitly enabled production executor. **Do not enable live charging or grant PLUS from this design-only code.**
