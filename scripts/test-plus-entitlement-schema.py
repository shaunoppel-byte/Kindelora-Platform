#!/usr/bin/env python3
import sqlite3
from pathlib import Path
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript((Path(__file__).resolve().parents[1]/'db/schema.sql').read_text())
query="""SELECT EXISTS (SELECT 1 FROM plus_subscriptions s JOIN plus_customers c ON c.id=s.customer_id WHERE c.identity_subject=?1 AND s.brand='KIN' AND s.status IN ('active','cancelled') AND s.current_period_end>?2) AS entitled"""
now='2026-11-21T10:00:00.000Z'
def entitled(subject):return db.execute(query,(subject,now)).fetchone()[0]
assert entitled('member_12345678')==0
db.execute("INSERT INTO plus_customers(id,identity_subject) VALUES('c1','member_12345678')")
db.execute("INSERT INTO plus_subscriptions(id,customer_id,brand,status,current_period_end) VALUES('s1','c1','KIN','pending','2026-12-21T10:00:00.000Z')")
assert entitled('member_12345678')==0
db.execute("UPDATE plus_subscriptions SET status='active' WHERE id='s1'")
assert entitled('member_12345678')==1
assert entitled('another_member')==0
db.execute("UPDATE plus_subscriptions SET status='cancelled' WHERE id='s1'")
assert entitled('member_12345678')==1
db.execute("UPDATE plus_subscriptions SET current_period_end='2026-11-20T10:00:00.000Z' WHERE id='s1'")
assert entitled('member_12345678')==0
db.execute("UPDATE plus_subscriptions SET status='refunded',current_period_end='2026-12-21T10:00:00.000Z' WHERE id='s1'")
assert entitled('member_12345678')==0
print('PASS: actual PLUS entitlement SQL executes, denies pending/expired/refunded/other member and permits active or unexpired cancelled')
