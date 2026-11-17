# KINDELORA pre-PayFast launch closure sprint — 17 Nov 2026

## Decision
Do **not** wait for merchant approval to test application logic. Run fully synthetic, isolated checkout/entitlement/invoicing scenarios offline; keep public PLUS checkout disabled. A synthetic success flag must never be accepted as production payment verification.

## Evidence created
- `scripts/fixtures/simulated-commerce.mjs`: deterministic, in-memory fake payment events, business-scoped invoice allocation, membership changes, refund/cancellation, idempotent outbox, audit.
- `scripts/test-simulated-commerce.mjs`: five-business synthetic lifecycle, amount mismatch, replay, cross-customer invoice denial, refund entitlement revocation, cancellation and retries.
- `.github/workflows/finance-preview-qa.yml`: CI trigger and run command. **Do not claim passing until workflow evidence is checked.**

## Workstreams / exit criteria
1. **P0 #267 catalogue integrity**: 400 unique IDs and stable text mapping, no duplicate titles/text; CI must fail on duplicate; verify deployed artefact.
2. **P0 #131, P1 #357 artwork**: inventory 400 real binaries; dimensions, hashes, perceptual duplicate clusters, visual/editorial approval and contrast/crop on mobile; do not mark candidate assets as approved.
3. **P0 #348, #341, #339 Monday/audio**: verify exact founder-approved script and narration binary, public teaser only, no paid bytes in static bundles/offline caches; full release only after real authenticated entitlement.
4. **P0 #195 brand film**: obtain approved MP4, test correct MIME, mobile player, captions, loading, fallback and Cloudflare deployment SHA. Do not replace with an unrelated video.
5. **P1 #246 legal**: confirm verified corporate name/reg, contact details, privacy, terms, refund, delivery and cancellation wording, subscription disclosures and merchant review.
6. **P0 #359 access**: anonymous/free/paid/expired/refunded/cancelled/forged sessions and media URL E2E. Simulated entitlement logic tests are not real identity-provider E2E.
7. **P0 #360 payment/finance**: build secure backend ITN validation, DB atomic invoice sequences, private PDFs, audit, reconciliation, real transactional email and staff authentication. Use simulator for business logic but real sandbox/merchant credentials and provider confirmation for integration gate.
8. **P1 device/performance/operations**: 360/390/412px, Android/iOS/desktop, PWA offline/cache/logout, WCAG keyboard and screen reader, performance budget, observability, backup/restore, rollback and incident response.

## Non-negotiable evidence per gate
Exact commit SHA; test command and output; CI run; deployed URL and version; pass/fail count; redacted browser/device screenshot where needed; accountable reviewer; known gaps; rollback commit. Do not infer production readiness from static GitHub commits or demo dashboards.

## Proposed split
- Public free launch may proceed after public-content, legal, mobile and deployment QA passes, with no exposed premium payload or paid checkout.
- Paid PLUS launch remains NO-GO until provider-verified payment + real identity/entitlement + finance and security gates pass.
