#!/usr/bin/env python3
import sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
c=sqlite3.connect(':memory:')
c.execute('PRAGMA foreign_keys=ON')
c.executescript("CREATE TABLE members(id TEXT PRIMARY KEY); INSERT INTO members VALUES('member_12345678');")
c.executescript((root/'db/migrations/0001_plus_payfast_sandbox.sql').read_text())
c.execute("INSERT INTO payfast_sandbox_orders(order_reference,member_id,plan,usd_minor,zar_minor,fx_reference) VALUES('order_12345678','member_12345678','monthly',899,17000,'quote_12345678')")
c.execute("INSERT INTO payfast_sandbox_transactions(provider_transaction_id,order_reference,paid_zar_minor,status) VALUES('tx_12345678','order_12345678',17000,'COMPLETE')")
c.execute("UPDATE payfast_sandbox_orders SET status='paid' WHERE order_reference='order_12345678'")
for query in [
 "UPDATE payfast_sandbox_transactions SET paid_zar_minor=1 WHERE provider_transaction_id='tx_12345678'",
 "DELETE FROM payfast_sandbox_transactions WHERE provider_transaction_id='tx_12345678'",
 "UPDATE payfast_sandbox_orders SET zar_minor=1 WHERE order_reference='order_12345678'",
 "UPDATE payfast_sandbox_orders SET status='pending' WHERE order_reference='order_12345678'",
 "DELETE FROM payfast_sandbox_orders WHERE order_reference='order_12345678'"
]:
 try:
  c.execute(query)
  raise AssertionError('mutation was incorrectly accepted: '+query)
 except sqlite3.IntegrityError: pass
assert c.execute("SELECT status,zar_minor FROM payfast_sandbox_orders").fetchone()==('paid',17000)
assert c.execute("SELECT paid_zar_minor FROM payfast_sandbox_transactions").fetchone()==(17000,)
print('PASS: completed sandbox payment records are immutable and ledger integrity survives attempted tampering')
