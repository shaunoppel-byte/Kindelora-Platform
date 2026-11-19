# P0 production D1 migration order — NO-GO until validated

Cloudflare's `_cf_KV` internal table is **not** a member schema. Production currently shows no member tables.

## Authoritative fresh-install order
1. `migrations/0001_member_identity.sql` (member identity, sessions, limits, legacy invitations)
2. `migrations/0002_member_verified_email.sql` (pending verification tokens and registration throttles)
3. `migrations/0003_member_verification_claim_nonce.sql` (one-time verification claim)
4. `migrations/0001_plus_persistence.sql` **only** when PLUS order persistence is needed and its currency policy has been reconciled with approved USD prices and PayFast processing.

**Do not run** `migrations/0002_member_email_verifications.sql` on a fresh install. It is an obsolete, incomplete predecessor with the same table name and fewer columns. It is retained for historical context, not production execution. Never apply either 0002 to a pre-existing verification table without first checking `PRAGMA table_info(member_email_verifications)` and safely planning an upgrade.

## Before production
- Back up any populated database and capture a Time Travel bookmark.
- Run `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;` to confirm the target schema. Do not drop any existing tables.
- Apply statements one migration at a time and verify `PRAGMA table_info(members);`, `PRAGMA table_info(member_email_verifications);`, and `PRAGMA table_info(member_registration_limits);`.
- Verify `DB` Pages binding points to the correct D1 database, and deploy after changes.
- Verify encrypted `MEMBER_AUTH_PEPPER` (32+ chars), `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, plus text `REGISTRATION_FROM_EMAIL` and `MEMBER_AUTH_ENABLED`. Never share or commit secret values.
- Leave `PUBLIC_REGISTRATION_ENABLED` absent/false until Turnstile, verified-email, recovery, concurrency and mobile E2E tests pass.
- Leave PayFast checkout disabled until merchant approval, signed ITN, idempotency, amount/currency and entitlement tests pass.

This migration establishes schema only; it does not activate public registration or payments.
