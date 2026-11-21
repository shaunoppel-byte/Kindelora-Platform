"""Offline SQLite security contract for review-only PayFast atomic ledger schema.
No payment provider calls, production D1, entitlements, or real money.
"""
import sqlite3
from pathlib import Path

def setup():
 db=sqlite3.connect(':memory:')
 db.execute('PRAGMA foreign_keys=ON')
 db.executescript(Path('schema/payfast_sandbox_atomic_trigger_draft.sql').read_text())
 db.execute("INSERT INTO payfast_atomic_orders(reference,member_id,plan,zar_minor,status) VALUES('order_1','member_1','monthly',17500,'pending')")
 db.execute("INSERT INTO payfast_atomic_orders(reference,member_id,plan,zar_minor,status) VALUES('order_2','member_2','annual',175000,'cancelled')")
 return db

def attempt(db, provider, order, amount):
 try:
  db.execute("INSERT INTO payfast_atomic_transactions(provider_id,reference,zar_minor,status) VALUES(?,?,?,'COMPLETE')",(provider,order,amount))
 except sqlite3.IntegrityError:
  return False
 return True

db=setup()
for provider,order,amount in [
 ('bad_amount','order_1',17499),
 ('cancelled','order_2',175000),
 ('unknown','missing_order',17500),
]:
 assert not attempt(db,provider,order,amount)
 assert db.execute('SELECT count(*) FROM payfast_atomic_transactions').fetchone()[0]==0
 assert db.execute("SELECT status FROM payfast_atomic_orders WHERE reference='order_1'").fetchone()[0]=='pending'

# Inject a database-side failure *after* transaction insertion and before
# order update. SQLite must roll back the original INSERT atomically.
db.executescript("""
CREATE TRIGGER synthetic_reject_paid BEFORE UPDATE OF status ON payfast_atomic_orders
WHEN NEW.status='paid'
BEGIN SELECT RAISE(ABORT,'synthetic_failure'); END;
""")
assert not attempt(db,'provider_failed','order_1',17500)
assert db.execute('SELECT count(*) FROM payfast_atomic_transactions').fetchone()[0]==0
assert db.execute("SELECT status FROM payfast_atomic_orders WHERE reference='order_1'").fetchone()[0]=='pending'
db.execute('DROP TRIGGER synthetic_reject_paid')
assert attempt(db,'provider_good','order_1',17500)
assert db.execute("SELECT status FROM payfast_atomic_orders WHERE reference='order_1'").fetchone()[0]=='paid'
assert not attempt(db,'provider_replay','order_1',17500)
assert not attempt(db,'provider_good','order_2',175000)
assert db.execute('SELECT count(*) FROM payfast_atomic_transactions').fetchone()[0]==1
assert db.execute("SELECT status FROM payfast_atomic_orders WHERE reference='order_2'").fetchone()[0]=='cancelled'
print('PASS: wrong amount, cancelled/missing order, replay and forced after-insert failure all fail closed without partial ledger rows')
