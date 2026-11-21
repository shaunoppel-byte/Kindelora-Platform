import sqlite3, pathlib, time
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript("""CREATE TABLE payfast_sandbox_orders(order_reference TEXT PRIMARY KEY); INSERT INTO payfast_sandbox_orders VALUES('order_12345678');""")
migration=pathlib.Path('db/migrations/0002_payfast_sandbox_fx_quotes.sql').read_text()
db.executescript(migration); db.executescript(migration)
row=('quote_12345678','order_12345678','monthly',899,17000,'ZAR','sandbox','server_verified',int(time.time()*1000)+60000)
db.execute('INSERT INTO payfast_sandbox_fx_quotes(quote_reference,order_reference,plan,usd_minor,zar_minor,settlement_currency,environment,source,expires_at_ms) VALUES(?,?,?,?,?,?,?,?,?)',row)
for sql in ["UPDATE payfast_sandbox_fx_quotes SET zar_minor=1","DELETE FROM payfast_sandbox_fx_quotes"]:
 try: db.execute(sql);raise AssertionError('mutation succeeded')
 except sqlite3.IntegrityError: pass
try: db.execute("INSERT INTO payfast_sandbox_fx_quotes VALUES('q2','missing','monthly',899,100,'ZAR','sandbox','server_verified',999,'now')");raise AssertionError('orphan accepted')
except sqlite3.IntegrityError: pass
print('PASS: repeat-safe quote migration, immutable evidence, referential integrity')
