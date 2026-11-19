# KINDELORA P0 production registration — read-only audit and release gates

This document is for the existing Cloudflare Pages `kindelora` production D1 binding `DB`. **Do not run the obsolete `0002_member_email_verifications.sql` migration.** Do not publish secrets or personal data in screenshots.

## Verified founder console work (19 November 2026)
The founder manually executed and received success responses for six tables: `members`, `member_sessions`, `member_login_limits`, `member_invitations`, `member_email_verifications`, `member_registration_limits`. The founder also applied `consumed_nonce` and two email verification indexes. A read-only `sqlite_master` query confirmed all six table names. These observations do **not** prove the Pages binding points at that exact database or that production APIs are functioning.

## Read-only D1 schema verification
Run individually in the production D1 Console. These queries never mutate data.

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('members','member_sessions','member_login_limits','member_invitations','member_email_verifications','member_registration_limits') ORDER BY name;
```

```sql
PRAGMA table_info(member_email_verifications);
```

Required columns: `token_hash`, `email_normalized`, `password_salt`, `password_hash`, `expires_at`, `consumed_at`, `created_at`, `consumed_nonce`.

```sql
SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='member_email_verifications' ORDER BY name;
```

Confirm a unique, partial index on non-null `consumed_nonce` and a lookup index covering `email_normalized, expires_at`. Check the identity/session columns against `migrations/0001_member_identity.sql`.

## Production configuration gate
Confirm in **production**, not preview, and without exposing values:
- D1 binding named `DB` references the same database where the six tables were created.
- `MEMBER_AUTH_ENABLED` is the text value `true`.
- `MEMBER_AUTH_PEPPER` is an encrypted random secret of at least 32 characters; its exact value must remain stable once accounts exist.
- `RESEND_API_KEY` is an encrypted secret; `REGISTRATION_FROM_EMAIL` is the verified sender address.
- `TURNSTILE_SITE_KEY` is a public text value for the widget bound to `kindelora.pages.dev`.
- `TURNSTILE_SECRET_KEY` is encrypted and corresponds to that widget.
- **Security exception:** the initial Turnstile secret was visible in a conversation screenshot. Rotate and replace it before public registration GO. The founder deferred rotation; this is an unresolved release gate, not a completed task.
- `PUBLIC_REGISTRATION_ENABLED` remains absent or `false` until approved for a controlled production test.
- Confirm the deployment serving `/plus-account.html` contains the merged registration changes.

## Controlled E2E release gate
With approved test accounts, verify (1) disabled registration fails closed; (2) Turnstile missing/invalid token rejected; (3) valid registration produces Resend email; (4) email verification requires an explicit user click and succeeds once; (5) replay and expired tokens rejected; (6) login, logout and session expiry; (7) duplicate email enumeration resistance and rate limiting; (8) delivery failures do not strand tokens; (9) mobile flow; (10) no unintended PLUS entitlement.

Do not infer production success from GitHub CI or from the presence of tables alone. Do not enable PayFast checkout until separate merchant approval, currency/amount reconciliation, signed ITN, idempotency and entitlement gates pass.

**Status: NO-GO** until production configuration and controlled E2E evidence are reviewed.
