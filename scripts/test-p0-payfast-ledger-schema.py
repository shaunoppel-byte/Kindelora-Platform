import sqlite3
from pathlib import Path
schema=Path('schema/payfast_sandbox_ledger_draft.sql').read_text()
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript(schema)
db.execute("INSERT INTO payfast_sandbox_orders(order_reference,member_id,plan,usd_minor,zar_minor,fx_reference,quote_expires_at) VALUES (?,?,?,?,?,?,?)",('order_12345678','member_test','monthly',899,17890,'fx_reference_123','2026-11-21T08:00:00Z'))
db.execute("INSERT INTO payfast_sandbox_orders(order_reference,member_id,plan,usd_minor,zar_minor,fx_reference,quote_expires_at) VALUES (?,?,?,?,?,?,?)",('order_87654321','member_test','annual',8999,178900,'fx_reference_124','2026-11-21T08:00:00Z'))
db.execute("INSERT INTO payfast_sandbox_transactions(provider_transaction_id,order_reference,paid_zar_minor,status) VALUES (?,?,?,?)",('provider_12345678','order_12345678',17890,'COMPLETE'))
def must_fail(sql,params):
 try: db.execute(sql,params)
 except sqlite3.IntegrityError: return
 raise AssertionError('constraint unexpectedly allowed invalid ledger write')
insert="INSERT INTO payfast_sandbox_transactions(provider_transaction_id,order_reference,paid_zar_minor,status) VALUES (?,?,?,?)"
must_fail(insert,('provider_12345678','order_87654321',178900,'COMPLETE'))
must_fail(insert,('provider_87654321','order_12345678',17890,'COMPLETE'))
must_fail(insert,('provider_87654321','missing_order',17890,'COMPLETE'))
must_fail(insert,('provider_87654321','order_87654321',0,'COMPLETE'))
must_fail(insert,('provider_87654321','order_87654321',178900,'PENDING'))
must_fail("INSERT INTO payfast_sandbox_orders(order_reference,member_id,plan,usd_minor,zar_minor,fx_reference,quote_expires_at) VALUES (?,?,?,?,?,?,?)",('bad_order','member_test','monthly',0,17890,'fx_reference_125','2026-11-21T08:00:00Z'))
assert db.execute("SELECT COUNT(*) FROM payfast_sandbox_transactions").fetchone()[0]==1
print('PASS: SQLite sandbox ledger rejects duplicate transaction/order, unknown order and invalid values')
