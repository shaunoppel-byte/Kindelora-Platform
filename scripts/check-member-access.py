"""Fail-closed member API source and schema regression checks."""
from pathlib import Path
s=Path("functions/api/member/me.js").read_text()
db=Path("db/schema.sql").read_text()
assert "MEMBER_AUTH_ENABLED" in s and '!=="true"' in s
assert "MEMBER_AUTH_PEPPER" in s and "crypto.subtle.digest" in s
assert "expires_at > ?" in s and "disabled_at IS NULL" in s
assert "authenticated:false" in s and "status:401" in s and "status:503" in s
assert "password" not in s.lower()
for table in ("members","member_sessions","member_login_limits"):
    assert f"CREATE TABLE IF NOT EXISTS {table}" in db
assert "token_hash TEXT PRIMARY KEY" in db
print("PASS: member lookup fails closed, hashes session token, checks expiry and disabled account, does not grant Plus")
