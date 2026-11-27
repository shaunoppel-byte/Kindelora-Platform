-- Additive schema; apply to isolated staging before production.
CREATE TABLE IF NOT EXISTS member_favourites (
 member_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('messages','affirmations')),
 content TEXT NOT NULL CHECK(length(content) BETWEEN 1 AND 4000),
 created_at TEXT NOT NULL,
 PRIMARY KEY(member_id,kind,content),
 FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE CASCADE
);
