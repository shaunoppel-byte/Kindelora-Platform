# Issue #806 — isolated D1 Worker batch harness

Source: `staging/payfast-d1-worker-atomicity.js`. The exported `runStagingAtomicity(env.DB)` is deliberately **not wired to any production Pages route or deployed endpoint**. It requires an actual Cloudflare Worker D1 binding and executes `db.batch()` rather than HTTP SQL statements.

## Safety / execution gate
1. Bind **only** `kindelora-payfast-d1-staging` (UUID `2a619e39-fd80-49f5-8a88-e42d90a965fd`) to a separate staging-only Worker; never reuse production deployment configuration.
2. Before invoking, verify the Worker binding points to that UUID, confirm seven expected schema tables, and ensure the environment cannot charge PayFast or grant production entitlement.
3. Invoke once with a trusted staging-only runner. The harness creates unique prefixed fixture rows, asserts first renewal commit, asserts replay rejection and unchanged subscription state, then removes only fixture-owned rows.
4. Capture Worker run logs and D1 table counts in issue #806. Run rollback and concurrency scenarios separately; **this harness alone does not certify them**.
5. Do not activate charging or edit registration based on this harness.

The renewal composer remains inert (`ready:false`, `execute:false`, `grantEntitlement:false`). The harness explicitly extracts `proposedStatements` for **staging simulation only**, using synthetic provider identifiers; this is not PayFast authentication or a real payment.
