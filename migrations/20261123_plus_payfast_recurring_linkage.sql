-- KINDELORA PLUS recurring PayFast linkage foundation (issue #806).
-- ADDITIVE SCHEMA ONLY. Never enable live checkout or run against production
-- before Cloudflare D1 staging migration, backup, and verified provider E2E.
-- No PayFast credentials, raw ITNs, or customer personal data are stored.
PRAGMA foreign_keys = ON;

-- A merchant checkout order may be paid once and then referenced by subsequent
-- provider renewal ITNs. The existing plus_orders status must NOT be reset.
CREATE TABLE IF NOT EXISTS plus_payfast_recurring_links (
  initial_order_id TEXT PRIMARY KEY NOT NULL REFERENCES plus_orders(id),
  subscription_id TEXT NOT NULL UNIQUE REFERENCES plus_subscriptions(id),
  customer_id TEXT NOT NULL REFERENCES plus_customers(id),
  plan_id TEXT NOT NULL CHECK(plan_id IN ('monthly','annual')),
  expected_zar_minor INTEGER NOT NULL CHECK(expected_zar_minor > 0),
  provider_subscription_token TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_plus_payfast_recurring_customer
  ON plus_payfast_recurring_links(customer_id);

-- Independent renewal ledger: every PayFast transaction is unique globally,
-- and every renewal belongs to a persisted subscription and initial order.
-- A pending entry must never itself grant or extend PLUS access.
CREATE TABLE IF NOT EXISTS plus_payfast_renewal_events (
  provider_transaction_id TEXT PRIMARY KEY NOT NULL,
  initial_order_id TEXT NOT NULL REFERENCES plus_payfast_recurring_links(initial_order_id),
  subscription_id TEXT NOT NULL REFERENCES plus_subscriptions(id),
  paid_zar_minor INTEGER NOT NULL CHECK(paid_zar_minor > 0),
  status TEXT NOT NULL CHECK(status IN ('pending','committed')),
  previous_period_end TEXT NOT NULL,
  new_period_end TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (new_period_end > previous_period_end)
);
CREATE INDEX IF NOT EXISTS idx_plus_payfast_renewals_subscription
  ON plus_payfast_renewal_events(subscription_id,verified_at);

-- This migration intentionally does NOT backfill or infer existing provider
-- tokens, change order status, activate billing, or modify registration.
