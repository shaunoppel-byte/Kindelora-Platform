-- Commercial schema package; operator approval and verified backup required before production execution.

-- Source: 0001_plus_persistence.sql
-- KINDELORA PLUS: dormant Cloudflare D1 persistence foundation.
-- Schema only. No D1 binding, deployment, PayFast endpoint or checkout activation.
-- Store only server-generated IDs and verified payment facts; never PayFast secrets.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS plus_customers (
  id TEXT PRIMARY KEY NOT NULL,
  identity_subject TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS plus_orders (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES plus_customers(id),
  brand TEXT NOT NULL CHECK (brand = 'KIN'),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency = 'ZAR'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','cancelled','refunded')),
  payment_reference TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_plus_orders_customer_status ON plus_orders(customer_id,brand,status);
CREATE TABLE IF NOT EXISTS plus_payment_events (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL REFERENCES plus_orders(id),
  provider TEXT NOT NULL CHECK (provider = 'PayFast'),
  provider_event_reference TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- No raw notifications, passwords, signatures, passphrases or customer PII.
  CHECK (length(verified_at) > 0)
);
CREATE INDEX IF NOT EXISTS idx_plus_payment_events_order ON plus_payment_events(order_id);
CREATE TABLE IF NOT EXISTS plus_subscriptions (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES plus_customers(id),
  brand TEXT NOT NULL CHECK (brand = 'KIN'),
  status TEXT NOT NULL CHECK (status IN ('active','past_due','cancelled','expired')),
  current_period_end TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_plus_subscriptions_entitlement ON plus_subscriptions(customer_id,brand,status,current_period_end);


-- Source: 0006_plus_order_quotes.sql
-- P0 PayFast: persist customer-approved ZAR quote and recurring plan against
-- server-created order before redirecting to PayFast. Apply only after reviewing
-- production D1 migration history; this migration does not enable charging.
CREATE TABLE IF NOT EXISTS plus_order_quotes (
  order_id TEXT PRIMARY KEY NOT NULL REFERENCES plus_orders(id),
  plan_id TEXT NOT NULL CHECK(plan_id IN ('monthly','annual')),
  display_usd_minor INTEGER NOT NULL CHECK(
    (plan_id='monthly' AND display_usd_minor=899) OR
    (plan_id='annual' AND display_usd_minor=8999)
  ),
  settlement_zar_minor INTEGER NOT NULL CHECK(settlement_zar_minor>=500),
  fx_source TEXT NOT NULL CHECK(length(fx_source)>0),
  fx_rate_reference TEXT NOT NULL CHECK(length(fx_rate_reference)>0),
  quoted_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  accepted_at TEXT NOT NULL,
  CHECK(expires_at>quoted_at),
  CHECK(accepted_at>=quoted_at AND accepted_at<=expires_at)
);
CREATE INDEX IF NOT EXISTS idx_plus_order_quotes_expiry ON plus_order_quotes(expires_at);
-- A PayFast subscription token is sensitive; store a one-way fingerprint for
-- idempotency, not the token itself, until encrypted token storage is designed.
CREATE TABLE IF NOT EXISTS plus_payment_reconciliations (
  order_id TEXT PRIMARY KEY NOT NULL REFERENCES plus_orders(id),
  payment_reference TEXT NOT NULL UNIQUE,
  verified_at TEXT NOT NULL,
  verification_method TEXT NOT NULL CHECK(verification_method='payfast_itn_and_server_validation'),
  amount_minor INTEGER NOT NULL CHECK(amount_minor>=500),
  currency TEXT NOT NULL CHECK(currency='ZAR')
);


-- Source: 20261123_plus_payfast_recurring_linkage.sql
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


-- Source: 20261123_plus_payfast_renewal_atomic_guard.sql
-- Renewal atomicity guard: an INSERT into this one-row table succeeds only
-- when the immediately preceding UPDATE affected exactly one subscription.
-- Use inside a single D1 batch transaction; never run independently.
CREATE TABLE IF NOT EXISTS plus_payfast_renewal_atomic_guard (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  expected_changes INTEGER NOT NULL CHECK (expected_changes = 1)
);

