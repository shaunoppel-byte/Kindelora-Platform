# Editorial release gate: repeated reassurance in Batch 38

Date: 2026-11-08. Automated textual inspection; **not** independent human editorial approval.

## Scope and findings
- Main `message-catalogue.json`: declared count 3,000; parsed 3,000; 3,000 unique IDs and 3,000 unique normalized full texts.
- Main `content/message-library-v38.json`: 100 messages, all marked `editorial-review`.
- The following **identical sentence endings** each appear **20 times** in the 3,000-message public-catalogue source and **20 times** in Batch 38: 
  - “Small gestures can carry more meaning than they appear to.”
  - “You do not have to make the experience perfect for it to count.”
  - “There is room for patience while this experience unfolds.”
- These are distinct full texts, so exact-text uniqueness tests pass while repetitive templating remains undetected.

## Decision and corrective action
**Hold independent editorial release approval for affected Batch 38 messages.** Do not infer that the 3,000-message public source has passed human review from exact uniqueness alone. Rewrite and individually review repetitive endings against the full corpus before changing release metadata, public count guards or service-worker cache. Add sentence-fragment repetition checks to the checker, with thresholds and documented editorial exceptions, then rerun CI and independent contextual review. Do not alter existing public content automatically as part of this audit.

## Verification boundaries
Repository main content checked via GitHub API. Full 38-batch near-duplicate audit, independent human review, Cloudflare production state and CI on this new audit branch were **not** verified. No new message count or deployment is claimed. Rollback: revert this documentation-only commit.
