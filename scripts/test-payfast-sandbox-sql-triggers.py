#!/usr/bin/env python3
import sqlite3
from pathlib import Path
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.execute('CREATE TABLE members(id TEXT PRIMARY KEY)')
db.execute("INSERT INTO members(id) VALUES('member_12345678')")
db.executescript((Path(__file__).resolve().parents[1]/'db/payfast-sandbox-schema.sql').read_text())
def order(ref,amount=17000):
 db.execute("INSERT INTO payfast_sandbox_orders(order_reference,member_id,plan,usd_minor,zar_minor,fx_reference,status) VALUES(?,'member_12345678','monthly',899,?,'fx_12345678','pending')",(ref,amount))
def tx(ref,txid,amount=17000):
 db.execute("INSERT INTO payfast_sandbox_transactions(provider_transaction_id,order_reference,paid_zar_minor,status) VALUES(?,?,?,'COMPLETE')",(txid,ref,amount))
def rejects(fn):
 try:fn()
 except sqlite3.IntegrityError:return
 raise AssertionError('Expected SQL integrity failure')
order('order_12345678')
rejects(lambda:tx('order_12345678','tx_wrong_12345678',1))
rejects(lambda:db.execute("UPDATE payfast_sandbox_orders SET status='paid' WHERE order_reference='order_12345678'"))
tx('order_12345678','tx_valid_12345678')
db.execute("UPDATE payfast_sandbox_orders SET status='paid' WHERE order_reference='order_12345678'")
rejects(lambda:tx('order_12345678','tx_repeat_12345678'))
order('order_other_12345678')
db.execute("UPDATE payfast_sandbox_orders SET status='cancelled' WHERE order_reference='order_other_12345678'")
rejects(lambda:tx('order_other_12345678','tx_cancel_12345678'))
print('PASS: SQL triggers block wrong amount, unpaid->paid, paid replay, cancelled order; valid transaction then paid succeeds')
