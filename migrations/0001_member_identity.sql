-- KINDELORA member identity: apply before verified-email migration 0002_member_verified_email.sql.
-- Production launch remains disabled until runtime secrets and end-to-end tests pass.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS members (
 id TEXT PRIMARY KEY NOT NULL,
 email_normalized TEXT NOT NULL UNIQUE,
 password_salt TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 email_verified_at TEXT,
 disabled_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_email ON members(email_normalized);
CREATE TABLE IF NOT EXISTS member_sessions (
 token_hash TEXT PRIMARY KEY NOT NULL,
 member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_member_sessions_member ON member_sessions(member_id,expires_at);
CREATE TABLE IF NOT EXISTS member_login_limits (
 key_hash TEXT PRIMARY KEY NOT NULL,
 failures INTEGER NOT NULL DEFAULT 0,
 locked_until TEXT
);
CREATE TABLE IF NOT EXISTS member_invitations (
 token_hash TEXT PRIMARY KEY NOT NULL,
 email_normalized TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 consumed_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
