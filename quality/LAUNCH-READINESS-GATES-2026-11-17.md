# KINDELORA launch gate — evidence checklist (17 November 2026)

Status: **NO-GO**. This file is a release control, not evidence of completed tests or deployment.

## P0 requirements
- [ ] Verify Cloudflare Pages production is Git-connected to this repository and the latest SHA is deployed. README currently states Direct Upload production is retained; GitHub main commits may **not** be live.
- [ ] Verify Cloudflare Pages Functions middleware is actually executed in production; unauthenticated premium page and audio requests must return 401/403 and no premium bytes. Verify fail-closed behaviour if Functions allowance is exhausted.
- [ ] Inventory and protect all premium static assets, JSON, API, audio, downloads and archives; middleware currently protects **only two known paths**. No premium bytes may be present in public HTML or other public static assets.
- [ ] Implement verified server-side identity and PLUS entitlements, including PayFast ITN signature, replay/amount/currency verification, cancellation/refund/expiry and failed payment handling.
- [ ] Run guest/free/paid/expired/cancelled/refunded E2E matrix with HTTP status/body evidence, direct URL, mobile, incognito, cached/offline and logout checks.
- [ ] Run complete GitHub Actions CI and review results, plus production smoke tests and rollback rehearsal.
- [ ] Validate affirmation unique IDs and distinct image binaries, license/provenance, responsive contrast and image availability for all 400.
- [ ] Reconcile public message catalogue 3,000 declared entries with independent editorial approval and actual deployed counts.
- [ ] Verify approved Monday text, MP3, archive, scheduling and access; NO publication without Sunday 20:00 SAST GO.
- [ ] Verify PayFast-required policies, pricing/VAT, contact details, refund/cancellation/delivery terms on live site; merchant account verification is external.
- [ ] Verify actual approved brand-film MP4, links, mobile layout, accessibility, PWA offline and privacy/POPIA.

## Known blockers
- GitHub issues: #359, #341, #339, #348, #268, #264, #267, #195, #131, #350, #357, #246, #265, #266.
- The README documents a **Direct Upload** Cloudflare deployment. A GitHub commit alone is not proof of deployment.
- Current `functions/_middleware.js` is a temporary fail-closed deny for Monday HTML and one MP3; it is **not** a completed membership implementation.
- Source `motivational-monday.html` currently contains the full message and references an MP3; source confidentiality requires removing premium bytes from publicly deployed static artifacts or protecting all routes before publishing.

## Release decision
Keep paid PLUS launch **NO-GO** until evidence-backed P0 gates pass. Do not close #359 prematurely.
