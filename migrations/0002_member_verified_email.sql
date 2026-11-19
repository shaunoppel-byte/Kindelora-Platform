-- Pending verified-email registrations; never store plaintext verification tokens.
CREATE TABLE IF NOT EXISTS member_email_verifications (token_hash TEXT PRIMARY KEY NOT NULL,email_normalized TEXT NOT NULL,password_salt TEXT NOT NULL,password_hash TEXT NOT NULL,expires_at TEXT NOT NULL,consumed_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS member_email_verifications_email_expiry_idx ON member_email_verifications(email_normalized,expires_at);
CREATE TABLE IF NOT EXISTS member_registration_limits (key_hash TEXT PRIMARY KEY NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,window_started_at TEXT NOT NULL,blocked_until TEXT);
