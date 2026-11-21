-- Member-only occasion metadata. No contact details or identifiable child records.
CREATE TABLE IF NOT EXISTS member_special_moments (
 id TEXT PRIMARY KEY NOT NULL,
 member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
 occasion_type TEXT NOT NULL CHECK(occasion_type IN ('birthday','anniversary','other')),
 label TEXT NOT NULL CHECK(length(label) BETWEEN 1 AND 60),
 month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
 day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 31),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_member_special_moments_owner ON member_special_moments(member_id,month,day);
