#!/usr/bin/env python3
"""Offline D1/SQLite verification one-time-claim contract; no production access."""
import sqlite3
from pathlib import Path
db=sqlite3.connect(':memory:')
db.executescript("""
CREATE TABLE members (id TEXT PRIMARY KEY,email_normalized TEXT UNIQUE NOT NULL,password_salt TEXT,password_hash TEXT,email_verified_at TEXT);
""")
db.executescript(Path('migrations/0002_member_verified_email.sql').read_text())
db.executescript(Path('migrations/0003_member_verification_consumed_nonce.sql').read_text())
db.execute("INSERT INTO member_email_verifications(token_hash,email_normalized,password_salt,password_hash,expires_at) VALUES ('token','test@example.invalid','salt','hash','2099-01-01T00:00:00Z')")
now='2026-11-20T12:00:00Z'
def verify(claim,member_id,token='token'):
    with db:
        changed=db.execute("""UPDATE member_email_verifications SET consumed_at=?,consumed_nonce=?
          WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?
          AND NOT EXISTS (SELECT 1 FROM members WHERE email_normalized=member_email_verifications.email_normalized)""",(now,claim,token,now)).rowcount
        inserted=db.execute("""INSERT INTO members(id,email_normalized,password_salt,password_hash,email_verified_at)
          SELECT ?,v.email_normalized,v.password_salt,v.password_hash,?
          FROM member_email_verifications v WHERE v.token_hash=? AND v.consumed_nonce=?
          AND NOT EXISTS (SELECT 1 FROM members m WHERE m.email_normalized=v.email_normalized)""",(member_id,now,token,claim)).rowcount
        return changed,inserted
assert verify('claim1','member1')==(1,1)
assert verify('claim2','member2')==(0,0)
assert verify('claim3','member3','wrong')==(0,0)
assert db.execute('SELECT COUNT(*) FROM members').fetchone()[0]==1
assert db.execute("SELECT consumed_nonce FROM member_email_verifications WHERE token_hash='token'").fetchone()[0]=='claim1'
db.execute("INSERT INTO member_email_verifications(token_hash,email_normalized,password_salt,password_hash,expires_at) VALUES ('expired','expired@example.invalid','salt','hash','2020-01-01')")
assert verify('claim4','member4','expired')==(0,0)
print('Email verification one-time claim contract: PASS')
