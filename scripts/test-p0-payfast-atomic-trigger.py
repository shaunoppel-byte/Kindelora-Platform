import sqlite3
from pathlib import Path
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript(Path('schema/payfast_sandbox_atomic_trigger_draft.sql').read_text())
orders=[('order_a','member_a','monthly',17890,'pending'),('order_b','member_b','annual',178900,'pending'),('order_c','member_c','monthly',17890,'cancelled')]
db.executemany('INSERT INTO payfast_atomic_orders(reference,member_id,plan,zar_minor,status) VALUES (?,?,?,?,?)',orders)
insert="INSERT INTO payfast_atomic_transactions(provider_id,reference,zar_minor,status) VALUES (?,?,?,'COMPLETE')"
def reject(params):
 try: db.execute(insert,params)
 except sqlite3.IntegrityError: return
 raise AssertionError(f'unexpected acceptance: {params}')
reject(('pf_wrong_amount','order_a',17891))
reject(('pf_cancelled','order_c',17890))
reject(('pf_missing','order_missing',17890))
assert db.execute("SELECT COUNT(*) FROM payfast_atomic_transactions").fetchone()[0]==0
db.execute(insert,('pf_success','order_a',17890))
assert db.execute("SELECT status FROM payfast_atomic_orders WHERE reference='order_a'").fetchone()[0]=='paid'
assert db.execute("SELECT COUNT(*) FROM payfast_atomic_transactions").fetchone()[0]==1
reject(('pf_success','order_b',178900))
reject(('pf_duplicate_order','order_a',17890))
assert db.execute("SELECT status FROM payfast_atomic_orders WHERE reference='order_b'").fetchone()[0]=='pending'
assert db.execute("SELECT COUNT(*) FROM payfast_atomic_transactions").fetchone()[0]==1
print('PASS: one INSERT atomically records transaction and updates pending order; invalid/replay attempts leave no partial rows')
