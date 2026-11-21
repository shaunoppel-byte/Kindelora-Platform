-- DRAFT SANDBOX LEDGER: NOT A DEPLOYMENT MIGRATION.
-- Do not apply until production D1 schema and rollout are reviewed.
-- No card data, passphrases, signatures or raw ITN payloads stored.
-- Store only trusted server-side quotes and verified payment metadata.
CREATE TABLE IF NOT EXISTS payfast_sandbox_orders (
 order_reference TEXT PRIMARY KEY NOT NULL,
 member_id TEXT NOT NULL,
 plan TEXT NOT NULL CHECK(plan IN ('monthly','annual')),
 usd_minor INTEGER NOT NULL CHECK(usd_minor IN (899,8999)),
 zar_minor INTEGER NOT NULL CHECK(zar_minor>0),
 fx_reference TEXT NOT NULL,
 quote_expires_at TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled','expired')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 paid_at TEXT
);
CREATE TABLE IF NOT EXISTS payfast_sandbox_transactions (
 provider_transaction_id TEXT PRIMARY KEY NOT NULL,
 order_reference TEXT NOT NULL UNIQUE REFERENCES payfast_sandbox_orders(order_reference),
 paid_zar_minor INTEGER NOT NULL CHECK(paid_zar_minor>0),
 status TEXT NOT NULL CHECK(status='COMPLETE'),
 verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS payfast_sandbox_orders_member_idx
 ON payfast_sandbox_orders(member_id,created_at);
-- A future handler MUST commit transaction insertion and paid status update
-- atomically and check changes==1. This schema alone grants NO entitlement.
