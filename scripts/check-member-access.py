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
assert "verifyPlusEntitlement" in entitlement and "verifiedIdentitySubject:user.id" in entitlement
assert 'verified.reason==="unavailable"' in entitlement and "status" not in entitlement
plus=Path("functions/_lib/plus-entitlement.js").read_text()
assert "plus_subscriptions" in plus and "s.status = 'active'" in plus
assert "s.current_period_end > ?2" in plus and "c.identity_subject = ?1" in plus
assert "s.brand = 'KIN'" in plus and "entitled:false" in plus
print("PASS: invitation registration, login hashing/lockout, logout revocation and verified-ID subscription gates")
