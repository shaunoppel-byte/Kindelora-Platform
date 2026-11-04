# KINDELORA message-library release controls

## Current state
Five GitHub JSON editorial batches contain 1,000 draft messages across 83 themes.
These are source-controlled editorial assets, **not** a deployed D1 catalogue.
All records have status `editorial-review`; none is authorised for automatic public release.

## Editorial approval checklist
For each candidate: (1) confirm clear and natural wording, (2) test whether the message
acknowledges difficulty without false reassurance, (3) compare emotional takeaway
with other messages in its theme and across themes, (4) remove culturally narrow
assumptions or unsolicited advice, (5) check privacy and safeguarding implications,
(6) verify that the message feels helpful to its intended audience, (7) approve
the exact text and version with a named reviewer and date.

Use `python3 scripts/audit-message-library.py` to generate
`content/EDITORIAL_AUDIT.md` locally for lexical-overlap triage.
This detects some similarity but cannot replace semantic/human editorial review.

## Controlled release design (not yet implemented)
1. Preserve source drafts and publish only a separate explicit allowlist of approved IDs.
2. Build an approved static JSON export with schema validation; never serve the raw
   draft files as the app's message-selection source.
3. Map approved themes to existing four guest choices and daily needs; do not
   assume 83 themes are all suitable for a given mood.
4. Rotate without replacement within a category until its approved pool is exhausted.
   Avoid showing the same ID twice within a session and optionally keep a small
   privacy-conscious local history; provide reset and respect storage failures.
5. Keep a fallback to the existing hand-authored messages if the new feed is missing,
   empty, or invalid. No live AI call is necessary for basic message selection.
6. Release to a small internal preview first, test on mobile and desktop, then
   progressively enable public use with a one-step rollback to the previous pool.
7. Measure opt-in usefulness feedback in aggregate, without collecting sensitive
   emotional disclosures or personal identifiers unnecessarily.

## Production safeguards
- No automatic subscriptions, delivery or recipient messaging.
- No medical advice, diagnosis or promised outcomes.
- Review high-sensitivity messages with additional care.
- A successful CI run proves technical checks, not editorial perfection.
- Founder/editorial approval is required before moving any item out of
  `editorial-review` or enabling live rotation.
