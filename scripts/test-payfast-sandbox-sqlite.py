#!/usr/bin/env python3
"""Execute the actual sandbox D1-compatible SQLite schema locally; no remote DB access."""
import sqlite3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE members (id TEXT PRIMARY KEY)")
db.execute("INSERT INTO members(id) VALUES (?)",("member_12345678",))
db.executescript((root/"db/payfast-sandbox-schema.sql").read_text())
order=("order_12345678","member_12345678","monthly",899,17000,"fx_12345678")
db.execute("INSERT INTO payfast_sandbox_orders(order_reference,member_id,plan,usd_minor,zar_minor,fx_reference,status) VALUES(?,?,?,?,?,?,'pending')",order)
db.execute("INSERT INTO payfast_sandbox_transactions(provider_transaction_id,order_reference,paid_zar_minor,status) VALUES(?,?,?,'COMPLETE')",("tx_12345678",order[0],17000))
db.execute("UPDATE payfast_sandbox_orders SET status='paid',paid_at=CURRENT_TIMESTAMP WHERE order_reference=? AND status='pending' AND zar_minor=?",(order[0],17000))
assert db.execute("SELECT status FROM payfast_sandbox_orders WHERE order_reference=?",(order[0],)).fetchone()[0]=="paid"
def rejects(sql,args):
 try:
  db.execute(sql,args)
 except sqlite3.IntegrityError:
  return
 raise AssertionError("Expected database constraint rejection")
rejects("INSERT INTO payfast_sandbox_transactions(provider_transaction_id,order_reference,paid_zar_minor,status) VALUES(?,?,?,'COMPLETE')",("tx_12345678","order_12345678",17000))
rejects("INSERT INTO payfast_sandbox_transactions(provider_transaction_id,order_reference,paid_zar_minor,status) VALUES(?,?,?,'COMPLETE')",("tx_other_12345678","order_12345678",17000))
rejects("INSERT INTO payfast_sandbox_orders(order_reference,member_id,plan,usd_minor,zar_minor,fx_reference,status) VALUES(?,?,?,?,?,?,'pending')",("order_other_12345678","member_12345678","monthly",1,17000,"fx_12345678"))
rejects("INSERT INTO payfast_sandbox_orders(order_reference,member_id,plan,usd_minor,zar_minor,fx_reference,status) VALUES(?,?,?,?,?,?,'pending')",("order_other_12345678","missing_member","monthly",899,17000,"fx_12345678"))
assert db.execute("UPDATE payfast_sandbox_orders SET status='paid' WHERE order_reference=? AND status='pending'",(order[0],)).rowcount==0
print("PASS: sandbox schema executes; valid pending->paid; replay, duplicate order, wrong price, missing member and double transition blocked")
