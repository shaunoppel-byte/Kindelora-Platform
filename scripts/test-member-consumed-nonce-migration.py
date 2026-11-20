#!/usr/bin/env python3
"""Offline migration compatibility check, without production D1 access."""
import sqlite3
from pathlib import Path
db=sqlite3.connect(':memory:')
db.executescript(Path('migrations/0002_member_verified_email.sql').read_text())
before={r[1] for r in db.execute('PRAGMA table_info(member_email_verifications)')}
assert 'consumed_nonce' not in before
db.executescript(Path('migrations/0003_member_verification_consumed_nonce.sql').read_text())
after={r[1] for r in db.execute('PRAGMA table_info(member_email_verifications)')}
required={'token_hash','email_normalized','password_salt','password_hash','expires_at','consumed_at','consumed_nonce'}
assert required <= after
db.execute("INSERT INTO member_email_verifications(token_hash,email_normalized,password_salt,password_hash,expires_at) VALUES('t','redacted@example.invalid','salt','hash','2099-01-01')")
assert db.execute("SELECT consumed_nonce FROM member_email_verifications WHERE token_hash='t'").fetchone()[0] is None
assert db.execute("UPDATE member_email_verifications SET consumed_nonce='nonce' WHERE token_hash='t' AND consumed_nonce IS NULL").rowcount==1
assert db.execute("UPDATE member_email_verifications SET consumed_nonce='other' WHERE token_hash='t' AND consumed_nonce IS NULL").rowcount==0
print('Member verification additive migration contract: PASS')
