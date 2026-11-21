-- KINDELORA P0: additive PayFast SANDBOX ledger schema only.
-- Apply manually to the VERIFIED production D1 database after capturing a Time Travel bookmark.
-- Never modify existing membership, registration, or authentication tables.
-- This migration creates no live payment authorization or PLUS entitlements.
CREATE TABLE IF NOT EXISTS payfast_sandbox_orders (
  order_reference TEXT PRIMARY KEY NOT NULL,
  member_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly','annual')),
  usd_minor INTEGER NOT NULL CHECK (usd_minor > 0),
  zar_minor INTEGER NOT NULL CHECK (zar_minor > 0),
  fx_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at TEXT
);
CREATE TABLE IF NOT EXISTS payfast_sandbox_fx_quotes (
  quote_reference TEXT PRIMARY KEY NOT NULL,
  order_reference TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly','annual')),
  usd_minor INTEGER NOT NULL CHECK (usd_minor > 0),
  zar_minor INTEGER NOT NULL CHECK (zar_minor > 0),
  settlement_currency TEXT NOT NULL CHECK (settlement_currency = 'ZAR'),
  environment TEXT NOT NULL CHECK (environment = 'sandbox'),
  source TEXT NOT NULL CHECK (source = 'server_verified'),
  expires_at_ms INTEGER NOT NULL,
  FOREIGN KEY (order_reference) REFERENCES payfast_sandbox_orders(order_reference)
);
CREATE TABLE IF NOT EXISTS payfast_sandbox_transactions (
  provider_transaction_id TEXT PRIMARY KEY NOT NULL,
  order_reference TEXT NOT NULL UNIQUE,
  paid_zar_minor INTEGER NOT NULL CHECK (paid_zar_minor > 0),
  status TEXT NOT NULL CHECK (status = 'COMPLETE'),
  FOREIGN KEY (order_reference) REFERENCES payfast_sandbox_orders(order_reference)
);
