# KINDELORA PayFast / PLUS D1 deployment gate (P0)

**Current state:** checkout remains disabled. Merging a migration does not deploy it.
The repository root currently has no `wrangler.toml`, `wrangler.json`, `wrangler.jsonc`, or `package.json` (verified on main 2026-11-21). Do not infer which Cloudflare Pages project or D1 database is active.

## Required operator verification before any write
1. In Cloudflare dashboard, confirm the exact Pages project and its production environment, the `DB` binding type and D1 database ID. Never post secrets or database credentials to issues/logs.
2. Verify the current production D1 tables, foreign-key behavior, migration history, backups and member registration/login health. Existing `members` and `member_sessions` must not be recreated or reset.
3. Check actual production `GET /api/plus/schema-readiness` with an authenticated member session; a 200 only indicates schema columns, **not** PayFast readiness. Do not use this as a checkout go-live switch.
4. Take a restorable backup / export and test restore procedure. Review `db/migrations/0001_plus_payfast_sandbox.sql` against live schema, especially `members(id)` FK and table/index/trigger collisions.
5. Only then execute the reviewed migration against the **verified target database** using the Cloudflare-supported D1 migration mechanism. Record execution evidence, schema integrity, and zero impact to member authentication. Never invoke migration from a public endpoint.
6. Repeat schema inspection and test login, registration, recovery and logout. Test sandbox ledger writes only with synthetic test records, never live customer charges.
7. Separately implement and verify real PayFast ITN signature, source and server confirmation, merchant and order matching, settlement currency/amount, replay handling, atomic ledger and PLUS entitlement activation. Then run sandbox end-to-end and a founder-authorized small real transaction.
8. Keep `functions/api/plus/checkout.js` returning HTTP 503 until all gates pass. Never interpret `schema_present` as `checkoutReady`.

## Explicit no-go conditions
- Unknown or unverified Cloudflare Pages project / D1 binding / merchant capability
- No proven backup/restore or unreviewed live schema changes
- Missing authenticated PayFast ITN verification, replay prevention, subscription lifecycle, reconciliation or test evidence
- Any member login/registration regression or any failing CI check

**Prices:** USD 8.99 monthly and USD 89.99 annually. USD public display does not establish PayFast USD settlement support; verify merchant-specific capability and server-controlled FX quote before a real charge.
