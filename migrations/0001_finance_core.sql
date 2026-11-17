-- PRIVATE Cloudflare D1 finance database. Apply ONLY to a dedicated private finance DB.
-- This migration is not deployed by committing it.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS finance_businesses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (code IN ('OPE','KIN','VEL','KDR','SOL')),
  legal_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
);
INSERT OR IGNORE INTO finance_businesses (id,code,legal_name) VALUES
 ('oppel-enterprises','OPE','Oppel Enterprises'),
 ('kindelora','KIN','KINDELORA'),
 ('velora','VEL','VELORA'),
 ('kindra','KDR','KINDRA'),
 ('solelab','SOL','SOLELAB');
CREATE TABLE IF NOT EXISTS finance_invoice_counters (
  business_id TEXT NOT NULL REFERENCES finance_businesses(id),
  invoice_year INTEGER NOT NULL CHECK (invoice_year BETWEEN 2020 AND 9999),
  last_sequence INTEGER NOT NULL DEFAULT 0 CHECK (last_sequence BETWEEN 0 AND 999999999),
  PRIMARY KEY (business_id, invoice_year)
);
CREATE TABLE IF NOT EXISTS finance_orders (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES finance_businesses(id),
  customer_id TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (length(currency)=3),
  total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled','refunded','disputed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS finance_payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES finance_orders(id),
  provider TEXT NOT NULL CHECK (provider='PayFast'),
  provider_payment_id TEXT NOT NULL UNIQUE,
  amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL CHECK (length(currency)=3),
  status TEXT NOT NULL CHECK (status IN ('verified','refunded','disputed')),
  verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS finance_invoices (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES finance_businesses(id),
  order_id TEXT NOT NULL REFERENCES finance_orders(id),
  payment_id TEXT NOT NULL UNIQUE REFERENCES finance_payments(id),
  invoice_year INTEGER NOT NULL,
  invoice_sequence INTEGER NOT NULL CHECK (invoice_sequence BETWEEN 1 AND 999999999),
  invoice_number TEXT NOT NULL UNIQUE,
  private_object_key TEXT UNIQUE,
  total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
  currency TEXT NOT NULL CHECK (length(currency)=3),
  issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (business_id, invoice_year, invoice_sequence)
);
CREATE TABLE IF NOT EXISTS finance_staff (
  subject TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled'))
);
CREATE TABLE IF NOT EXISTS finance_role_grants (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES finance_businesses(id),
  subject TEXT NOT NULL REFERENCES finance_staff(subject),
  role TEXT NOT NULL CHECK (role IN ('owner','finance_admin','bookkeeper','support','auditor')),
  granted_by TEXT NOT NULL,
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  UNIQUE (business_id,subject,role)
);
CREATE TABLE IF NOT EXISTS finance_audit_log (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES finance_businesses(id),
  actor_subject TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata_redacted TEXT
);
CREATE TABLE IF NOT EXISTS finance_email_outbox (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL UNIQUE REFERENCES finance_invoices(id),
  recipient_email TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','sent','retry','failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  last_error_redacted TEXT
);
CREATE INDEX IF NOT EXISTS idx_finance_orders_business ON finance_orders(business_id,created_at);
CREATE INDEX IF NOT EXISTS idx_finance_invoice_business ON finance_invoices(business_id,issued_at);
CREATE INDEX IF NOT EXISTS idx_finance_role_active ON finance_role_grants(subject,business_id,revoked_at);
