# KINDELORA launch gate — evidence checklist (17 November 2026)

Status: **NO-GO**. This file is a release control, not evidence of completed tests or deployment.

## P0 requirements
- [ ] Verify Cloudflare Pages production is Git-connected to this repository and the latest SHA is deployed. README currently states Direct Upload production is retained; GitHub main commits may **not** be live.
- [ ] Verify Cloudflare Pages Functions middleware is actually executed in production; unauthenticated premium page and audio requests must return 401/403 and no premium bytes. Verify fail-closed behaviour if Functions allowance is exhausted.
- [ ] Inventory and protect all premium static assets, JSON, API, audio, downloads and archives; middleware now blocks known premium namespace paths; exhaustive route inventory and production verification remain outstanding. No premium bytes may be present in public HTML or other public static assets.
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
- Current `functions/_middleware.js` permits the sanitised public Monday preview and denies known premium/media namespace routes. It is **not** a completed membership implementation.
- The full Monday message and public MP3 reference were removed from the current source, and the public preview was visually confirmed in a user screenshot. Production security still needs independent live HTTP checks, plus comprehensive paid entitlement tests.

## Production smoke test
- New read-only script: `scripts/smoke-production-premium.mjs`; workflow: `.github/workflows/production-premium-smoke.yml` (scheduled daily, manual dispatch). Source committed; do not mark passing until actual workflow run is green.
- The user supplied screenshots confirming a branded public Monday preview and a green local middleware regression workflow, but not all protected live HTTP routes.

## Release decision
Keep paid PLUS launch **NO-GO** until evidence-backed P0 gates pass. Do not close #359 prematurely.
