#!/usr/bin/env python3
"""Offline fresh D1 schema contract. Does not touch production."""
from pathlib import Path
import sqlite3

db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
for file in ("0001_member_identity.sql","0002_member_verified_email.sql","0003_member_verification_claim_nonce.sql"):
    db.executescript((Path(__file__).resolve().parents[1]/"migrations"/file).read_text())
required={
"members":{"id","email_normalized","password_salt","password_hash","email_verified_at","disabled_at"},
"member_sessions":{"token_hash","member_id","expires_at"},
"member_login_limits":{"key_hash","failures","locked_until"},
"member_invitations":{"token_hash","email_normalized","expires_at","consumed_at"},
"member_email_verifications":{"token_hash","email_normalized","password_salt","password_hash","expires_at","consumed_at","consumed_nonce"},
"member_registration_limits":{"key_hash","attempts","window_started_at","blocked_until"}
}
for table,columns in required.items():
    present={row[1] for row in db.execute(f"PRAGMA table_info({table})")}
    assert columns <= present,(table,columns-present)
db.execute("INSERT INTO member_email_verifications(token_hash,email_normalized,password_salt,password_hash,expires_at) VALUES(?,?,?,?,?)",("token1","a@example.com","salt","hash","2099-01-01"))
db.execute("UPDATE member_email_verifications SET consumed_nonce=? WHERE token_hash=?",("claim1","token1"))
assert db.execute("SELECT consumed_nonce FROM member_email_verifications WHERE token_hash='token1'").fetchone()[0]=="claim1"
try:
    db.execute("INSERT INTO member_email_verifications(token_hash,email_normalized,password_salt,password_hash,expires_at,consumed_nonce) VALUES(?,?,?,?,?,?)",("token2","b@example.com","salt","hash","2099-01-01","claim1"))
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Verification claim nonce must be unique")
print("PASS: authoritative member schema, verification columns and replay nonce constraints")
