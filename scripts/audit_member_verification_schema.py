#!/usr/bin/env python3
"""Read-only D1/SQLite schema audit and conditional migration generator.

Usage:
  python3 scripts/audit_member_verification_schema.py /path/to/exported.sqlite
  python3 scripts/audit_member_verification_schema.py /path/to/exported.sqlite --emit-repair

NEVER runs a mutation. Review generated ALTER statements and back up production
before executing any approved repair. Do not upload customer data to GitHub.
"""
import argparse
import sqlite3
import sys

p=argparse.ArgumentParser()
p.add_argument("database")
p.add_argument("--emit-repair",action="store_true")
a=p.parse_args()
db=sqlite3.connect(f"file:{a.database}?mode=ro",uri=True)
def cols(table):
    return {row[1] for row in db.execute(f"PRAGMA table_info({table})")}
def exists(table):
    return bool(db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",(table,)).fetchone())
required={
 "members":{"id","email_normalized","password_salt","password_hash","email_verified_at"},
 "member_sessions":{"token_hash","member_id","expires_at"},
 "member_login_limits":{"key_hash","failures","locked_until"},
 "member_email_verifications":{"token_hash","email_normalized","password_salt","password_hash","expires_at","consumed_at","consumed_nonce"},
 "member_registration_limits":{"key_hash","attempts","window_started_at","blocked_until"}
}
missing={}
for table,needed in required.items():
    absent=sorted(needed-cols(table)) if exists(table) else sorted(needed)
    if absent: missing[table]=absent
    print(f"{table}: {'MISSING '+','.join(absent) if absent else 'OK'}")
if a.emit_repair:
    print("\n-- REVIEW ONLY. Back up production; do not run automatically.")
    for column in ("password_salt","password_hash"):
        if exists("member_email_verifications") and column not in cols("member_email_verifications"):
            print(f"ALTER TABLE member_email_verifications ADD COLUMN {column} TEXT;")
    if exists("member_email_verifications") and "consumed_nonce" not in cols("member_email_verifications"):
        print("ALTER TABLE member_email_verifications ADD COLUMN consumed_nonce TEXT;")
    print("-- Existing pending records without password fields cannot be activated; expire them safely.")
sys.exit(1 if missing else 0)
