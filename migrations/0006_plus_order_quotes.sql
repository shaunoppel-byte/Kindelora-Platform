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
