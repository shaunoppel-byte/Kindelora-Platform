-- REVIEW-ONLY ALTERNATIVE: single-statement atomic sandbox ledger.
-- NOT a production migration; never execute on production until reviewed.
-- A BEFORE INSERT trigger checks that a trusted order is pending and matches
-- the provider-confirmed amount. An AFTER INSERT trigger marks the order paid
-- within the SAME SQLite statement/transaction; any trigger failure rolls back
-- the entire insert. Unique constraints prevent replay and order reuse.
CREATE TABLE IF NOT EXISTS payfast_atomic_orders(
 reference TEXT PRIMARY KEY NOT NULL,
 member_id TEXT NOT NULL,
 plan TEXT NOT NULL CHECK(plan IN ('monthly','annual')),
 zar_minor INTEGER NOT NULL CHECK(zar_minor>0),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled','expired')),
 paid_at TEXT
);
CREATE TABLE IF NOT EXISTS payfast_atomic_transactions(
 provider_id TEXT PRIMARY KEY NOT NULL,
 reference TEXT NOT NULL UNIQUE REFERENCES payfast_atomic_orders(reference),
 zar_minor INTEGER NOT NULL CHECK(zar_minor>0),
 status TEXT NOT NULL CHECK(status='COMPLETE')
);
CREATE TRIGGER IF NOT EXISTS payfast_atomic_before_insert
BEFORE INSERT ON payfast_atomic_transactions
BEGIN
 SELECT CASE WHEN NOT EXISTS(
  SELECT 1 FROM payfast_atomic_orders
  WHERE reference=NEW.reference AND status='pending' AND zar_minor=NEW.zar_minor
 ) THEN RAISE(ABORT,'order_not_pending_or_amount_mismatch') END;
END;
CREATE TRIGGER IF NOT EXISTS payfast_atomic_after_insert
AFTER INSERT ON payfast_atomic_transactions
BEGIN
 UPDATE payfast_atomic_orders SET status='paid',paid_at=CURRENT_TIMESTAMP
 WHERE reference=NEW.reference AND status='pending' AND zar_minor=NEW.zar_minor;
 SELECT CASE WHEN changes()!=1 THEN RAISE(ABORT,'order_update_failed') END;
END;
-- Only trusted server-side code may INSERT after independent PayFast verification.
-- The trigger cannot validate signature, merchant, provider, member or quote.
-- This design grants NO entitlements and does not implement recurring billing.
