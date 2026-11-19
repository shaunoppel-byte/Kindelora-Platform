-- Future public registration: only hashed single-use verification tokens.
-- Apply only alongside a reviewed, rate-limited verification request and delivery flow.
CREATE TABLE IF NOT EXISTS member_email_verifications (
 token_hash TEXT PRIMARY KEY NOT NULL,
 email_normalized TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 consumed_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS member_email_verifications_email_idx ON member_email_verifications(email_normalized,expires_at);
