import sqlite3
from pathlib import Path
sql=Path("ops/payfast-production-commercial-schema.sql").read_text()
db=sqlite3.connect(":memory:")
db.executescript("CREATE TABLE members(id TEXT PRIMARY KEY); INSERT INTO members VALUES ('existing-member'); CREATE TABLE member_sessions(token_hash TEXT PRIMARY KEY); INSERT INTO member_sessions VALUES ('existing-session');")
for _ in range(2): db.executescript(sql)
assert db.execute("SELECT id FROM members").fetchall()==[("existing-member",)]
assert db.execute("SELECT token_hash FROM member_sessions").fetchall()==[("existing-session",)]
expected={"plus_customers","plus_orders","plus_payment_events","plus_subscriptions","plus_order_quotes","plus_payment_reconciliations","plus_payfast_recurring_links","plus_payfast_renewal_events","plus_payfast_renewal_atomic_guard"}
assert expected <= {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
for values in [(1,0),(2,1)]:
 try:
  db.execute("INSERT INTO plus_payfast_renewal_atomic_guard VALUES (?,?)",values)
 except sqlite3.IntegrityError: pass
 else: raise AssertionError("Invalid guard accepted")
assert not db.execute("PRAGMA foreign_key_check").fetchall()
print("PASS: commercial schema repeat execution, nine tables, synthetic member/session preservation, guard constraints and foreign keys")
