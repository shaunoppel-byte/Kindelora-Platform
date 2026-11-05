# Secure Member Access — Test Evidence and Acceptance Gate
Date: 2026-11-05
Status: **PARTIAL / NO-GO for member launch**

## Implemented
- `functions/api/member/me.js`: server-side D1 lookup of member sessions.
- Requires `MEMBER_AUTH_ENABLED=true`, D1 `DB` binding and `MEMBER_AUTH_PEPPER` to serve member data; otherwise HTTP 503.
- Requires 64-character hex session cookie; otherwise HTTP 401.
- Session cookie token is SHA-256 hashed with a server-only pepper before lookup.
- Session must be unexpired and member not disabled.
- Endpoint returns identity only; does not grant Plus payment entitlement.
- `db/schema.sql`: members, member_sessions and member_login_limits.
- `scripts/check-member-access.py`: static regression assertions; included in CI.

## Use-case evidence
| ID | Scenario | Status | Evidence |
|---|---|---|---|
| AUTH-01 | Missing member backend configuration denied | PASS (live negative test) | GET https://kindelora.pages.dev/api/member/me returned HTTP 503 on 2026-11-05 |
| AUTH-02 | Source requires server-only session validation | PASS (static) | D1 lookup checks token hash, expiry and disabled status |
| AUTH-03 | Unauthenticated cookie rejected when backend enabled | NOT TESTED | Needs deployed D1 binding and enabled test environment |
| AUTH-04 | Valid session signs in verified user | NOT TESTED | Secure login and issuance not implemented |
| AUTH-05 | Email verification and signup | FAIL / NOT IMPLEMENTED | Needs identity verification delivery |
| AUTH-06 | Brute-force throttling | NOT TESTED | DB table prepared, no login endpoint |
| AUTH-07 | Logout and session revocation | FAIL / NOT IMPLEMENTED | Needs session deletion endpoint |
| AUTH-08 | Cross-user access isolation | NOT TESTED | Needs two test accounts and protected member resources |
| AUTH-09 | Paid entitlement checks | FAIL / NOT IMPLEMENTED | Cannot be derived from login or cookie |
| AUTH-10 | CI security checks | PENDING | See latest GitHub Actions run for outcome |
| AUTH-11 | Mobile/PWA member login | NOT TESTED | Requires complete authentication flow |

## Remaining P0 tasks
1. Choose verified identity channel (email verification or secure invitation), without exposing secrets.
2. Implement rate-limited login and secure password or passkey flow, email verification, session issuance and revocation.
3. Deploy and migrate D1 in isolated test environment; provision strong pepper through Cloudflare secret storage.
4. Test expired/replayed/forged sessions, cookie security, cross-account isolation, CSRF and login throttling.
5. Implement and test server-enforced paid entitlements independently of authentication.
6. Complete real-device and hosted CI acceptance; only then enable production member sign-in.

Do not enable `MEMBER_AUTH_ENABLED` or announce working secure member login until these gates pass.
