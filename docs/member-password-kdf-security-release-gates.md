# Member password KDF — security and migration release gates

Status: **NOT APPROVED FOR PRODUCTION**. Issue #454. PRs #461–#463 established diagnostic logging, a candidate and passing CI; none integrates the candidate into authentication.

## Verified implementation facts
- Public registration and invitation registration each use unversioned PBKDF2-HMAC-SHA256 at 310,000 iterations; the production Workers runtime failed during the public-registration derivation step.
- Login repeats the same unversioned 310,000-round derivation. Existing stored salts are unprefixed 64-character hex strings; their associated password hashes cannot be changed without knowing the member password.
- Candidate `functions/_lib/member-password-kdf-candidate.js` uses a `v2:` salt prefix and four sequential PBKDF2-HMAC-SHA256 operations of 100,000 iterations with stage-specific salts. This is **not** standard PBKDF2 with 400,000 iterations, and passing CI does not establish cryptographic suitability.

## Mandatory gates before production integration
1. **Security review:** independent evaluation of the multi-stage candidate, parameter choices, account enumeration, timing, rate limiting and CPU usage. Prefer a recognized, maintained password-hashing implementation that can be deployed in the zero-cost Workers environment. Do not claim OWASP equivalence from the sum of iterations.
2. **Legacy compatibility:** establish how many verified member accounts use the unversioned scheme (aggregate counts only; do not export hashes). Existing hashes must not be silently invalidated or rewritten. Provide a tested legacy verification method in an appropriate runtime, or a secure one-time password-reset flow with expiring, single-use, rate-limited tokens. Do not downgrade to weaker hashes to recover accounts.
3. **Shared implementation:** registration-request, invitation register and login must use a single reviewed derivation API with explicit version selection; verification and reset flows must preserve the selected version. No plaintext password storage, password logging or password transport to third-party services.
4. **Security regression:** test correct/wrong passwords, version detection, invalid salt, unknown accounts, lockouts, Turnstile, invite expiry, token expiry/replay, verification email delivery failures, and database rollback.
5. **Runtime and operational gates:** run the actual workerd probe, measure CPU and request latency under representative load, validate D1 migration and production configuration, confirm mail provider acceptance, then perform authorized end-to-end signup and login in production.
6. **Release controls:** keep PayFast checkout disabled until separate provider verification, currency, recurring billing and webhook authenticity tests pass. Preserve zero-cost budget controls.

## Rollout / rollback
- Deploy only after gates 1–5 pass; roll out versioned hashes for **new registrations** first while preserving a safe, tested route for existing accounts.
- Monitor only privacy-safe reason codes, HTTP status and aggregate rates. Do not log email, salts, passwords, hashes or tokens.
- Rollback must not strand accounts created with the new version; preserve compatible verification or disable new registration while keeping existing login available.

**Current decision: NO-GO.** This document is a release checklist, not a security sign-off.
