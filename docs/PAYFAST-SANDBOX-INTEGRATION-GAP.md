# P0 PayFast sandbox integration gap — 21 November 2026

The existing sandbox payment decision returns `accepted:true, grantEntitlement:true` after all independent checks pass. The existing sandbox ledger statement builder **requires** `decision.accepted===false` and `decision.grantEntitlement===false`, plus `decision.stage==='pending_atomic_commit'`. These objects are not directly compatible. This is intentional fail-closed behavior in the current offline components, **not** a working payment pipeline.

Before any live checkout:
1. Define and test a separate orchestration transition from verified payment to `pending_atomic_commit` that never accepts browser-supplied verification flags.
2. Bind merchant reference to a persisted authenticated order and server-owned settlement quote.
3. Verify ITN signature, merchant ID, server confirmation, transaction status and amount independently.
4. Execute an atomic D1 commit with unique provider transaction ID, exactly-one order transition, and subscription activation; test replay and rollback.
5. Confirm PayFast merchant credentials, recurring billing and currency/FX capabilities without publishing secrets.
6. Complete sandbox and controlled live end-to-end tests before removing checkout 503.

**Do not** weaken existing checkout guards or grant PLUS from a browser redirect.
