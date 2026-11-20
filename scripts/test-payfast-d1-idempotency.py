#!/usr/bin/env python3
"""Offline SQLite contract for the dormant PLUS payment schema; no live D1 access."""
import sqlite3
from pathlib import Path

schema = Path("migrations/0001_plus_persistence.sql").read_text()
db = sqlite3.connect(":memory:")
db.executescript(schema)
db.execute("INSERT INTO plus_customers(id,identity_subject) VALUES('c1','test-subject')")
db.execute("INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency) VALUES('o1','c1','KIN',15900,'ZAR')")

def record_paid(event_id):
    # The caller MUST authenticate PayFast and match the exact merchant/order/amount
    # before invoking this transaction. This test is NOT an ITN endpoint or validator.
    try:
        with db:
            changed = db.execute("UPDATE plus_orders SET status='paid',updated_at=datetime('now') WHERE id='o1' AND status='pending'").rowcount
            if changed != 1:
                return False
            db.execute("INSERT INTO plus_payment_events(id,order_id,provider,provider_event_reference,event_type,verified_at) VALUES(?, 'o1','PayFast',?,'COMPLETE',datetime('now'))", (event_id,event_id))
        return True
    except sqlite3.IntegrityError:
        return False

assert record_paid('evt1') is True
assert record_paid('evt1') is False
assert record_paid('evt2') is False
assert db.execute("SELECT status FROM plus_orders WHERE id='o1'").fetchone()[0] == 'paid'
assert db.execute("SELECT COUNT(*) FROM plus_payment_events").fetchone()[0] == 1
for status in ('pending', 'cancelled', 'failed', 'refunded'):
    db.execute("UPDATE plus_orders SET status=? WHERE id='o1'", (status,))
    if status != 'pending':
        assert record_paid('evt-'+status) is False
assert db.execute("SELECT COUNT(*) FROM plus_payment_events").fetchone()[0] == 1
print("Offline D1/SQLite payment-state idempotency contract: PASS")
