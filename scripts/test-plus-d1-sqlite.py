#!/usr/bin/env python3
"""Offline SQLite execution of dormant D1 migration; no Cloudflare/PayFast calls."""
import sqlite3
from pathlib import Path

sql = Path("migrations/0001_plus_persistence.sql").read_text()
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript(sql)
db.execute("INSERT INTO plus_customers (id, identity_subject) VALUES (?,?)", ("customer-1", "identity-1"))
db.execute("INSERT INTO plus_customers (id, identity_subject) VALUES (?,?)", ("customer-2", "identity-2"))
db.execute("INSERT INTO plus_orders (id,customer_id,brand,amount_minor,currency) VALUES (?,?,?,?,?)",
           ("order-1","customer-1","KIN",1200,"ZAR"))
db.execute("INSERT INTO plus_payment_events (id,order_id,provider,provider_event_reference,event_type,verified_at) VALUES (?,?,?,?,?,?)",
           ("event-1","order-1","PayFast","provider-ref-1","complete","2026-11-18T00:00:00Z"))
db.execute("INSERT INTO plus_subscriptions (id,customer_id,brand,status,current_period_end) VALUES (?,?,?,?,?)",
           ("sub-1","customer-1","KIN","active","2026-12-18T00:00:00Z"))

def reject(sql, params, label):
    try:
        db.execute(sql, params)
    except sqlite3.IntegrityError:
        return
    raise AssertionError(f"Constraint not enforced: {label}")

reject("INSERT INTO plus_customers(id,identity_subject) VALUES (?,?)", ("customer-3","identity-1"), "identity uniqueness")
reject("INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency) VALUES (?,?,?,?,?)",
       ("orphan","missing","KIN",1200,"ZAR"), "foreign key")
reject("INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency) VALUES (?,?,?,?,?)",
       ("cross-brand","customer-1","VEL",1200,"ZAR"), "brand isolation")
reject("INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency) VALUES (?,?,?,?,?)",
       ("negative","customer-1","KIN",0,"ZAR"), "positive amount")
reject("INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency) VALUES (?,?,?,?,?)",
       ("currency","customer-1","KIN",1200,"USD"), "currency restriction")
reject("INSERT INTO plus_payment_events(id,order_id,provider,provider_event_reference,event_type,verified_at) VALUES (?,?,?,?,?,?)",
       ("event-2","order-1","PayFast","provider-ref-1","complete","2026-11-18T00:00:00Z"), "event replay")
reject("INSERT INTO plus_subscriptions(id,customer_id,brand,status,current_period_end) VALUES (?,?,?,?,?)",
       ("sub-invalid","customer-2","KIN","unknown","2026-12-18"), "subscription state")
assert db.execute("SELECT count(*) FROM plus_orders").fetchone()[0] == 1
assert db.execute("SELECT count(*) FROM plus_payment_events").fetchone()[0] == 1
print("PASS: dormant D1 migration executes in SQLite memory and rejects invalid identities, orders, event replay and subscription states")
