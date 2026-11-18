#!/usr/bin/env python3
"""Offline membership entitlement query contract against the real D1 SQLite schema.
No D1 deployment, authentication, payment gateway, network or live memberships.
"""
import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript(Path("migrations/0001_plus_persistence.sql").read_text())

def customer(id):
    db.execute("INSERT INTO plus_customers(id,identity_subject) VALUES (?,?)", (id, "identity-"+id))

def subscription(id, owner, status, end):
    db.execute("""INSERT INTO plus_subscriptions(id,customer_id,brand,status,current_period_end)
                  VALUES (?,?,?,?,?)""", (id,owner,"KIN",status,end))

def entitled(owner, at):
    # Fail closed: only a server-resolved customer ID, active state and unexpired
    # subscription qualify. The caller must authenticate identity before this query.
    if not owner or not at:
        return False
    return db.execute("""SELECT EXISTS(
        SELECT 1 FROM plus_subscriptions
        WHERE customer_id=? AND brand='KIN' AND status='active'
          AND current_period_end > ?
    )""", (owner,at)).fetchone()[0] == 1

for id in ("alice","bob","charlie"):
    customer(id)
subscription("alice-expired","alice","expired","2026-11-17T00:00:00Z")
subscription("alice-active","alice","active","2026-12-01T00:00:00Z")
subscription("bob-cancelled","bob","cancelled","2026-12-01T00:00:00Z")
subscription("bob-past-due","bob","past_due","2026-12-01T00:00:00Z")
subscription("charlie-expired","charlie","active","2026-11-18T00:00:00Z")
now="2026-11-18T00:00:00Z"
assert entitled("alice",now)
for owner in ("bob","charlie","unknown","",None):
    assert not entitled(owner,now), owner
assert not entitled("alice",None)
assert not entitled("alice","2026-12-01T00:00:00Z"), "end time must be exclusive"
# Refund/cancellation of one order must not revoke a separate active subscription;
# revoking the actual active subscription must deny immediately.
db.execute("UPDATE plus_subscriptions SET status='cancelled' WHERE id='alice-active'")
assert not entitled("alice",now)
subscription("alice-renewed","alice","active","2027-01-01T00:00:00Z")
assert entitled("alice",now)
db.execute("UPDATE plus_subscriptions SET status='expired' WHERE id='alice-renewed'")
assert not entitled("alice",now)
print("PASS: SQLite PLUS entitlement isolates customers, rejects expired/cancelled/past-due, and respects renewal/revocation")
