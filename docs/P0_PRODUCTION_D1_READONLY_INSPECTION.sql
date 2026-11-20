-- KINDELORA P0: Production D1 schema inspection (READ ONLY)
-- Execute each statement in Cloudflare D1 production SQL console.
-- Never run against a preview DB when investigating live registration.
-- No customer rows, email addresses, passwords, tokens or secret values are selected.
-- Copy only the column-name/type output and any SQL error text after redaction.
SELECT name FROM sqlite_master WHERE type='table' AND name IN
 ('members','member_sessions','member_login_limits',
  'member_email_verifications','member_registration_limits')
 ORDER BY name;
PRAGMA table_info('members');
PRAGMA table_info('member_email_verifications');
PRAGMA table_info('member_registration_limits');
PRAGMA table_info('member_sessions');
PRAGMA table_info('member_login_limits');
-- Expected verification columns:
-- token_hash,email_normalized,password_salt,password_hash,expires_at,
-- consumed_at,created_at,consumed_nonce
-- If password_salt or password_hash is missing, the legacy 0002 migration
-- may have been applied. Do NOT execute ALTER TABLE or drop data blindly.
-- Take a backup and review migration history and existing pending records.
