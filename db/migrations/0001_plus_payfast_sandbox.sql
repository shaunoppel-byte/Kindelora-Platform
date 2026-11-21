-- REVIEW REQUIRED: D1 additive schema migration for KINDELORA PLUS + PayFast sandbox ledger.
-- DO NOT deploy until actual Cloudflare D1 binding, backups, migration state and
-- PayFast sandbox configuration are verified. This does NOT enable checkout.
-- Requires pre-existing members table from the deployed member-auth schema.
-- Run once using reviewed wrangler D1 migration workflow, not from HTTP routes.
-- Dormant PLUS entitlement tables used by functions/_lib/plus-entitlement.js.
-- These definitions do not activate any subscription and are not auto-deployed.
-- identity_subject MUST be derived from server-verified member identity.
CREATE TABLE IF NOT EXISTS plus_customers (
 id TEXT PRIMARY KEY,
 identity_subject TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS plus_subscriptions (
 id TEXT PRIMARY KEY,
 customer_id TEXT NOT NULL REFERENCES plus_customers(id),
 brand TEXT NOT NULL CHECK(brand='KIN'),
 status TEXT NOT NULL CHECK(status IN ('pending','active','past_due','cancelled','expired','refunded')),
 current_period_end TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS plus_subscriptions_customer_idx ON plus_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS plus_subscriptions_entitlement_idx ON plus_subscriptions(brand,status,current_period_end);

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

-- Enforce ledger integrity in SQLite/D1, not only in JavaScript.
-- The transaction INSERT must target exactly one pending order at the quoted amount.
CREATE TRIGGER IF NOT EXISTS payfast_sandbox_transaction_pending_order
BEFORE INSERT ON payfast_sandbox_transactions
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM payfast_sandbox_orders
  WHERE order_reference=NEW.order_reference
    AND status='pending'
    AND zar_minor=NEW.paid_zar_minor
 ) THEN RAISE(ABORT,'sandbox_order_not_pending_or_amount_mismatch') END;
END;
-- A paid state is valid only if its matching completed transaction is recorded.
CREATE TRIGGER IF NOT EXISTS payfast_sandbox_paid_requires_transaction
BEFORE UPDATE OF status ON payfast_sandbox_orders
WHEN NEW.status='paid' AND OLD.status='pending'
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM payfast_sandbox_transactions
  WHERE order_reference=NEW.order_reference
    AND paid_zar_minor=NEW.zar_minor AND status='COMPLETE'
 ) THEN RAISE(ABORT,'sandbox_paid_without_matching_transaction') END;
END;

