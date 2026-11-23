-- Issue #806: staging-only prerequisite for initial recurring transaction guard.
-- Do not apply to production. Existing rows are never changed.
CREATE TABLE IF NOT EXISTS plus_payment_reconciliations (
 order_id TEXT PRIMARY KEY NOT NULL REFERENCES plus_orders(id),
 payment_reference TEXT NOT NULL UNIQUE,
 verified_at TEXT NOT NULL,
 verification_method TEXT NOT NULL,
 amount_minor INTEGER NOT NULL CHECK(amount_minor>0),
 currency TEXT NOT NULL CHECK(currency='ZAR')
);
