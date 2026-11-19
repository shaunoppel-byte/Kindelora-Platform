-- One-time per-attempt claim ID prevents same-millisecond verification replays.
ALTER TABLE member_email_verifications ADD COLUMN consumed_nonce TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_email_verifications_consumed_nonce ON member_email_verifications(consumed_nonce) WHERE consumed_nonce IS NOT NULL;
