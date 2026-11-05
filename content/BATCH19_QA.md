# Batch 19 — editorial QA evidence (2026-11-05)

Source: `content/message-library-v19.json`

- **30 new records**, 6 distinct themes, 5 records per theme.
- **Unique within batch:** 30/30 IDs; 30/30 case-folded, punctuation-normalized texts.
- **Length:** 19–28 whitespace-delimited words; all within the configured 8–40-word constraint.
- **Status:** all `editorial-review`; no public catalogue changes.
- **Sensitive-topic review:** the medical-results theme intentionally avoids diagnoses, outcomes, or treatment instructions. It requires a human safeguarding review before release.
- **Manual editorial pass:** distinct situations and practical, non-coercive language were considered during drafting. This is **not** independent human review.
- **Corpus-wide exact duplicates:** covered by `scripts/check-message-library.py` in CI, pending completion for this commit.
- **Corpus-wide near-duplicates:** `scripts/audit-message-library.py` remains advisory and has **not** been run and reviewed against all 2,240 records in this execution.
- **Live deployment:** not attempted. Public catalogue remains 2,100 source records.
- **Rollback:** the content and QA commits can be reverted independently; no production release to roll back.

Release gate: **EDITORIAL ONLY** pending clean CI, corpus-wide semantic triage, named independent human approval, and a controlled release manifest.
