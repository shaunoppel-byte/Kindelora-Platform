-- KINDELORA Plus D1 schema — preparation only; not yet deployed.
-- All IDs must be cryptographically random and generated server-side.
CREATE TABLE IF NOT EXISTS customers (
 id TEXT PRIMARY KEY,
 email_normalized TEXT NOT NULL UNIQUE,
 email_verified_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS plans (
 id TEXT PRIMARY KEY,
 display_name TEXT NOT NULL,
 currency TEXT NOT NULL,
 amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
 billing_frequency TEXT NOT NULL CHECK(billing_frequency IN ('monthly','annual')),
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1))
);
CREATE TABLE IF NOT EXISTS subscriptions (
 id TEXT PRIMARY KEY,
 customer_id TEXT NOT NULL REFERENCES customers(id),
 plan_id TEXT NOT NULL REFERENCES plans(id),
 provider TEXT NOT NULL CHECK(provider='payfast'),
 provider_subscription_token TEXT UNIQUE,
 status TEXT NOT NULL CHECK(status IN ('pending','active','past_due','cancelled','expired','refunded')),
 current_period_end TEXT,
 cancelled_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS subscriptions_customer_idx ON subscriptions(customer_id);
CREATE TABLE IF NOT EXISTS checkout_orders (
 id TEXT PRIMARY KEY,
 customer_id TEXT NOT NULL REFERENCES customers(id),
 plan_id TEXT NOT NULL REFERENCES plans(id),
 amount_minor INTEGER NOT NULL CHECK(amount_minor>0),
 currency TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending','paid','failed','cancelled','refunded')),
 provider_payment_id TEXT UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payment_events (
 id TEXT PRIMARY KEY,
 provider TEXT NOT NULL,
 provider_event_key TEXT NOT NULL,
 order_id TEXT REFERENCES checkout_orders(id),
 event_type TEXT NOT NULL,
 signature_verified INTEGER NOT NULL DEFAULT 0 CHECK(signature_verified IN (0,1)),
 received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(provider,provider_event_key)
);
-- No active paid plan is seeded until founder approves currency and actual charges.
