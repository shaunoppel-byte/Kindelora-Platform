# Source-grounded personal-data processing inventory — 2026-11-06

Evidence level: repository source inspection only. This is not proof of deployed configuration, data residency, contractual safeguards, encryption at rest or legal compliance. No production data was accessed.

## Observed processing and storage
Observed source: privacy.html describes browser-local reflections and notification preferences, not account sync; functions/api/member/register.js has invitation-gated email/password registration code; login.js derives PBKDF2 hashes; entitlement.js checks server-side active subscriptions; db/schema.sql prepares customer, order, subscription and payment event tables.

## Prioritised gaps
P0: reconcile notice with any future enabled backend; verify D1 migration, email invitation delivery, session tests, payment ITN and actual retention/deletion before public membership. No claim of live paid access.

## Validation still required
- Verify Cloudflare bindings, actual database migrations and deployed environment without disclosing secrets or accessing real user records.
- Identify responsible legal entity, Information Officer, all subprocessors and data processing agreements.
- Document purpose/lawful basis, exact fields, retention, backups, access rights, cross-border transfers and data-subject request procedure.
- Test privacy notice at collection, safe logging, deletion, account isolation, secure cookies and consent independently.
- Do not enable registration or paid checkout based on this source audit; obtain legal review and record end-to-end evidence.
