# KINDELORA secure member access acceptance record — 2026-11-05

**Release decision: NO-GO for public member authentication.** Source implementation committed; production E2E validation incomplete. Never mark unexecuted cases PASS.

| ID | Test case | Result | Evidence / next step |
|---|---|---|---|
| AUTH-01 | Unconfigured member API rejects requests | PASS | Live GET /api/member/me returned HTTP 503; fail-closed behaviour |
| AUTH-02 | Password-based verified login source | PASS (static only) | PBKDF2 310,000 iterations, verified account requirement, 5-failure lockout, opaque server session token |
| AUTH-03 | Email-bound single-use invitation registration source | PASS (static only) | Invitation hash, email match, expiry and consumed flag; D1 atomic batch |
| AUTH-04 | Logout revokes server session | PASS (static only) | DELETE from member_sessions by hashed token |
| AUTH-05 | Plus entitlement checks verified subscription | PASS (static only) | Verified customer email, active subscription and paid-through period |
| AUTH-06 | GitHub syntax and security regression | PENDING | Check latest GitHub Actions run after current commit |
| AUTH-07 | D1 schema migration in Cloudflare | NOT TESTED | Requires binding/migration and environment setup |
| AUTH-08 | Real invitation issued and delivered securely | NOT IMPLEMENTED | No verified email delivery/issuer configured |
| AUTH-09 | Register -> login -> /me -> logout real browser | NOT TESTED | Requires live D1 and configured credentials |
| AUTH-10 | Wrong password, throttling, expired/forged cookie | NOT TESTED | Requires integration tests with seeded users |
| AUTH-11 | Cross-account isolation and privilege escalation | NOT TESTED | Requires two users and protected data |
| AUTH-12 | Payment-to-entitlement lifecycle | BLOCKED | Requires verified PayFast events, subscription persistence, renewal/refund/cancellation |
| AUTH-13 | Mobile/PWA login and recovery | NOT TESTED | Requires account UI, email verification and password recovery |

## Release blockers
1. Provision D1 binding DB and run schema migration in a nonproduction Cloudflare environment.
2. Provision MEMBER_AUTH_PEPPER securely and explicitly enable MEMBER_AUTH_ENABLED only in an isolated test environment.
3. Implement trusted invitation issuance and verified email delivery, plus password reset and account recovery.
4. Build user-facing register/sign-in/sign-out/account UI and protected member resources.
5. Execute end-to-end negative and positive tests, browser/mobile/PWA tests, security review and rollback rehearsal.
6. Connect verified PayFast subscription state to entitlements. Do not accept payments or advertise live paid membership before this gate.

The free website and message library are independent and should remain available.
