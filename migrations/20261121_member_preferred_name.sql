-- Additive preferred name storage, isolated from authentication.
CREATE TABLE IF NOT EXISTS member_preferences (member_id TEXT PRIMARY KEY NOT NULL REFERENCES members(id) ON DELETE CASCADE, preferred_name TEXT NOT NULL CHECK(length(preferred_name) BETWEEN 1 AND 40), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
