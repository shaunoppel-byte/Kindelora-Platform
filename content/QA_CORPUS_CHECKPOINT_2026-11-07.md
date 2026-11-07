# KINDELORA corpus-wide editorial QA checkpoint — 2026-11-07

Scope: public message-catalogue.json (2,100 messages) plus editorial batches v14–v31 (475 messages), as read from default branch on 2026-11-07. The public catalogue corresponds to the first 13 editorial batches under the repository's validation expectations. This report is advisory, not a release approval.

## Results
- Inspected: **2,575** messages; **288** themes; **31** editorial batches represented by public + unpublished data.
- Unique message IDs: **2,575 / 2,575**.
- Unique normalized text strings (lowercase, punctuation collapsed): **2,575 / 2,575**.
- Length range: **8–30 words**.
- Token-Dice overlap screen: **2 pairs** at >= 0.60 with at least three shared non-stopword tokens, against the entire inspected corpus. This is lexical screening, not a semantic or human editorial verdict.
- Configured sensitive-word screen: **37 messages flagged** (always/never, health/outcome, or self-harm terms). Flags require contextual human review and are not automatic violations.
- Public release remains **2,100** on default branch; **475** messages are editorial-only. No live Cloudflare release or green CI has been established.

## Similarity pairs requiring contextual review
1. **0.667** — `KDL-CELEBRATION-002` / `KDL-LOSS_AND_REMEMBRANCE-011` (both public).
2. **0.625** — `KDL-EVENING_REFLECTION-009` / `KDL-RECEIVING-UNEXPECTED-KINDNESS-003` (crosses public/editorial boundary).

## Release gates
1. Independently review both overlap pairs and the 37 sensitive-word flags in context, recording decisions and any revisions.
2. Perform semantic/paraphrase review beyond lexical Dice, including tone, inclusion and possible coercive/therapeutic implications.
3. Run the repository's validation and audit scripts in CI and confirm actual passing GitHub Actions checks.
4. Prepare a specific founder-approved release manifest and rollback SHA; verify public app guards, service-worker cache, PWA and live deployment separately.

**Release decision: NOT APPROVED FOR LIVE ROTATION.** No claim of human certification, passing CI or deployment is made by this automated checkpoint.
