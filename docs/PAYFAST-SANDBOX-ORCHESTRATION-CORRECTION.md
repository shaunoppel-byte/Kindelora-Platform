# PayFast sandbox decision-to-ledger integration: verified architecture

## Correction to earlier gap analysis

The standalone `evaluateSandboxPayment` result is **not** intended to be passed directly into `sandboxLedgerAtomicStatements`. The existing `evaluateSandboxItnOffline` orchestrator in `functions/_lib/payfast-sandbox-itn-orchestrator.js` already performs the necessary transition: after envelope parsing, merchant/order validation, independently verified signature/source/server/quote/member checks and replay classification, it returns `stage:'pending_atomic_commit', accepted:false, grantEntitlement:false`. This is the expected input shape for `sandboxLedgerAtomicStatements`.

Thus the direct-call incompatibility documented in `PAYFAST-SANDBOX-INTEGRATION-GAP.md` is **not** a missing transition; it is a misuse of the intended API. The direct-call regression test may remain as a negative guard, but it must not be cited as evidence that orchestration is missing.

## Actual P0 gaps before enabling checkout

1. No public authenticated order creation or PayFast checkout initiation; `/api/plus/checkout` intentionally returns HTTP 503.
2. Offline orchestrator accepts upstream verification booleans; a production handler must compute these independently from authenticated PayFast ITN, merchant configuration, server confirmation, trusted stored order and quote. Browser input cannot supply them.
3. The ledger helper only constructs statements. No D1 `batch` commit, verification of exactly-one order transition, idempotency under concurrency, or subscription activation is wired into a public verified handler.
4. No confirmed production merchant credentials/currency settlement and recurring billing end-to-end verification.

Do not grant PLUS based on a success redirect or on `evaluateSandboxPayment(...).grantEntitlement` alone. Do not alter the current checkout 503 until all safeguards and live tests pass.
