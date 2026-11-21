#!/usr/bin/env python3
import sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
base=(root/'db/schema.sql').read_text()
migration=(root/'db/migrations/0001_plus_payfast_sandbox.sql').read_text()
def connection():
 c=sqlite3.connect(':memory:')
 c.execute('PRAGMA foreign_keys=ON')
 # Existing member auth tables only, representing already provisioned D1.
 c.executescript("""CREATE TABLE members(id TEXT PRIMARY KEY,email_verified_at TEXT,disabled_at TEXT);
 CREATE TABLE member_sessions(token_hash TEXT PRIMARY KEY,member_id TEXT REFERENCES members(id),expires_at TEXT);""")
 return c
c=connection()
c.executescript(migration)
c.executescript(migration)
for table in ['plus_customers','plus_subscriptions','payfast_sandbox_orders','payfast_sandbox_transactions']:
 assert c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?",(table,)).fetchone()
for trigger in ['payfast_sandbox_transaction_pending_order','payfast_sandbox_paid_requires_transaction']:
 assert c.execute("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?",(trigger,)).fetchone()
c.execute("INSERT INTO members(id) VALUES('member_12345678')")
c.execute("INSERT INTO payfast_sandbox_orders(order_reference,member_id,plan,usd_minor,zar_minor,fx_reference) VALUES('order_12345678','member_12345678','monthly',899,17000,'quote_12345678')")
try:
 c.execute("UPDATE payfast_sandbox_orders SET status='paid' WHERE order_reference='order_12345678'")
 raise AssertionError('paid without transaction must fail')
except sqlite3.IntegrityError:pass
try:
 c.execute("INSERT INTO payfast_sandbox_transactions(provider_transaction_id,order_reference,paid_zar_minor,status) VALUES('tx_bad_123','order_12345678',16999,'COMPLETE')")
 raise AssertionError('amount mismatch must fail')
except sqlite3.IntegrityError:pass
c.execute("INSERT INTO payfast_sandbox_transactions(provider_transaction_id,order_reference,paid_zar_minor,status) VALUES('tx_good_123','order_12345678',17000,'COMPLETE')")
c.execute("UPDATE payfast_sandbox_orders SET status='paid' WHERE order_reference='order_12345678'")
assert c.execute("SELECT status FROM payfast_sandbox_orders WHERE order_reference='order_12345678'").fetchone()[0]=='paid'
print('PASS: additive D1 migration repeat-safe, schema/trigger integrity and pending-to-paid ledger')
