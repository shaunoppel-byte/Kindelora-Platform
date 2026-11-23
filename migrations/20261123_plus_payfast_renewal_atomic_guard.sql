-- Renewal atomicity guard: an INSERT into this one-row table succeeds only
-- when the immediately preceding UPDATE affected exactly one subscription.
-- Use inside a single D1 batch transaction; never run independently.
CREATE TABLE IF NOT EXISTS plus_payfast_renewal_atomic_guard (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  expected_changes INTEGER NOT NULL CHECK (expected_changes = 1)
);
