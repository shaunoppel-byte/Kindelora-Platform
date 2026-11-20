-- Add the atomic claim nonce required by verify-email and registration-config.
-- Apply once to existing D1 databases after inspecting PRAGMA table_info.
-- Do not run twice: SQLite ADD COLUMN is not idempotent.
ALTER TABLE member_email_verifications ADD COLUMN consumed_nonce TEXT;
