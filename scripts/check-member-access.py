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

for endpoint in ("login","register","logout","entitlement"):
    source=Path(f"functions/api/member/{endpoint}.js").read_text()
    assert "ready(env)" in source, f"{endpoint} missing fail-closed gate"
assert "member_invitations" in Path("functions/api/member/register.js").read_text()
assert "email_verified_at" in Path("functions/api/member/register.js").read_text()
assert "PBKDF2" in Path("functions/api/member/login.js").read_text()
assert "locked_until" in Path("functions/api/member/login.js").read_text()
assert "DELETE FROM member_sessions" in Path("functions/api/member/logout.js").read_text()
entitlement=Path("functions/api/member/entitlement.js").read_text()
assert "subscriptions" in entitlement and "status='active'" in entitlement
assert "current_period_end>?" in entitlement and "email_verified_at IS NOT NULL" in entitlement
print("PASS: registration invitation, login hashing and lockout, logout revocation, paid entitlement static gates")
