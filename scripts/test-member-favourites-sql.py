import sqlite3
from pathlib import Path
db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE members(id TEXT PRIMARY KEY)")
db.executemany("INSERT INTO members VALUES (?)",[("a",),("b",)])
db.executescript(Path("schema/member-favourites-staged.sql").read_text())
insert="INSERT OR IGNORE INTO member_favourites(member_id,kind,content,created_at) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM member_favourites WHERE member_id=?)<100"
def save(member,content):
    db.execute(insert,(member,"messages",content,"2026-11-27",member))
save("a","same")
save("a","same")
save("b","same")
assert db.execute("SELECT COUNT(*) FROM member_favourites").fetchone()[0]==2
for i in range(110): save("a",str(i))
assert db.execute("SELECT COUNT(*) FROM member_favourites WHERE member_id='a'").fetchone()[0]==100
db.execute("DELETE FROM member_favourites WHERE member_id=? AND kind=? AND content=?",("a","messages","same"))
assert db.execute("SELECT COUNT(*) FROM member_favourites WHERE member_id='b'").fetchone()[0]==1
try:
    save("unknown","test")
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("foreign key not enforced")
db.execute("DELETE FROM members WHERE id='a'")
assert db.execute("SELECT COUNT(*) FROM member_favourites WHERE member_id='a'").fetchone()[0]==0
assert not db.execute("PRAGMA foreign_key_check").fetchall()
print("PASS: actual SQLite schema, duplicates, account isolation, 100-item cap, foreign keys and cascade")
