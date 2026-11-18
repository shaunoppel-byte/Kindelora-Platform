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
