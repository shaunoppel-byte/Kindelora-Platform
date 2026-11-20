-- P0 member password recovery: additive, isolated schema only.
-- Apply to production D1 ONLY after review, backup and explicit migration verification.
-- No changes to existing members, registration, sessions or payment records.
CREATE TABLE IF NOT EXISTS member_password_resets (
 token_hash TEXT PRIMARY KEY NOT NULL,
 member_id TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 consumed_at TEXT,
 consumed_nonce TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(member_id) REFERENCES members(id)
);
CREATE INDEX IF NOT EXISTS idx_member_password_resets_member ON member_password_resets(member_id);
CREATE INDEX IF NOT EXISTS idx_member_password_resets_expiry ON member_password_resets(expires_at);
CREATE TABLE IF NOT EXISTS member_password_reset_limits (
 key_hash TEXT PRIMARY KEY NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0,
 window_started_at TEXT NOT NULL,
 blocked_until TEXT
);
