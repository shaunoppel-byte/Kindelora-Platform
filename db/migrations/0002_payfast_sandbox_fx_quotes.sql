-- Additive sandbox FX quote ledger; creation must be server-authoritative.
-- Requires reviewed Cloudflare D1 migration; never auto-run from HTTP.
CREATE TABLE IF NOT EXISTS payfast_sandbox_fx_quotes (
 quote_reference TEXT PRIMARY KEY,
 order_reference TEXT NOT NULL UNIQUE REFERENCES payfast_sandbox_orders(order_reference),
 plan TEXT NOT NULL CHECK(plan IN ('monthly','annual')),
 usd_minor INTEGER NOT NULL CHECK((plan='monthly' AND usd_minor=899) OR (plan='annual' AND usd_minor=8999)),
 zar_minor INTEGER NOT NULL CHECK(zar_minor>0),
 settlement_currency TEXT NOT NULL CHECK(settlement_currency='ZAR'),
 environment TEXT NOT NULL CHECK(environment='sandbox'),
 source TEXT NOT NULL CHECK(source='server_verified'),
 expires_at_ms INTEGER NOT NULL CHECK(expires_at_ms>0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER IF NOT EXISTS payfast_sandbox_fx_quotes_immutable_update
BEFORE UPDATE ON payfast_sandbox_fx_quotes BEGIN SELECT RAISE(ABORT,'sandbox_fx_quote_immutable'); END;
CREATE TRIGGER IF NOT EXISTS payfast_sandbox_fx_quotes_immutable_delete
BEFORE DELETE ON payfast_sandbox_fx_quotes BEGIN SELECT RAISE(ABORT,'sandbox_fx_quote_immutable'); END;
