-- PayFast SANDBOX ledger tables. Apply through a reviewed D1 migration only.
-- This file is NOT automatically deployed; production checkout remains disabled.
-- Store only opaque references, never payment credentials or card data.
CREATE TABLE IF NOT EXISTS payfast_sandbox_orders (
 order_reference TEXT PRIMARY KEY,
 member_id TEXT NOT NULL REFERENCES members(id),
 plan TEXT NOT NULL CHECK(plan IN ('monthly','annual')),
 usd_minor INTEGER NOT NULL CHECK((plan='monthly' AND usd_minor=899) OR (plan='annual' AND usd_minor=8999)),
 zar_minor INTEGER NOT NULL CHECK(zar_minor>0),
 fx_reference TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','cancelled')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 paid_at TEXT
);
CREATE INDEX IF NOT EXISTS payfast_sandbox_orders_member_idx ON payfast_sandbox_orders(member_id);
CREATE TABLE IF NOT EXISTS payfast_sandbox_transactions (
 provider_transaction_id TEXT PRIMARY KEY,
 order_reference TEXT NOT NULL UNIQUE REFERENCES payfast_sandbox_orders(order_reference),
 paid_zar_minor INTEGER NOT NULL CHECK(paid_zar_minor>0),
 status TEXT NOT NULL CHECK(status='COMPLETE'),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
