# KINDELORA launch gate — 5 November 2026

## Public release
- [ ] Cloudflare deployment of latest main succeeds, current production alias resolves latest commit.
- [ ] Check desktop, Android Chrome/Samsung Internet, iOS Safari; 320px and 375px screens; keyboard navigation and contrast.
- [ ] Test all anchors, need/theme buttons, message cycling, copy feedback, annual/monthly preview, offline refresh and PWA installation.
- [ ] Confirm privacy notice, terms, contact channel, brand ownership, content moderation/escalation and support response procedure before paid operations.
- [ ] Verify performance, console errors, no third-party trackers, no personal-data capture.
- [ ] Confirm previous Cloudflare production deployment remains accessible for rollback.

## Payments: hard stop until verified
- Do not insert a checkout URL until founder completes merchant verification, provider acceptance, business identity and settlement details.
- Hosted checkout only. Never collect or store card numbers on KINDELORA.
- Confirm currencies, international acceptance, FX, tax, fees, refunds, chargebacks, cancellation and recurring-payment rules.
- Verify server-side signed provider callbacks, idempotency, durable customer/entitlement records, payment failure handling and cancellation.
- Test success, decline, duplicate callback, failed renewal, refund and cancellation end-to-end in sandbox, then controlled real transaction.
- Do not promise live membership or take payment for unavailable Plus features.

## AI agents: hard stop until verified
- Editorial agent: generate candidate messages offline, run novelty/quality/safety checks, human approve before publish.
- Guest experience agent: current client-side rules-based message selection; do not claim it is a live AI assistant.
- QA agent: automated content, accessibility, navigation, security and PWA tests in GitHub Actions.
- Operations agent: monitor CI and Cloudflare releases, alert founder, retain rollback path.
- Future live AI: require secure server-side provider integration, rate limits, budget caps, safety moderation, privacy notices, abuse handling and live tests. Never expose provider keys in browser.

## Measurement and continuous improvement
Track voluntarily submitted usefulness feedback only after privacy-safe consent and data-handling are implemented. Measure helpfulness, content originality, return visits, accessibility, task success, reliability and subscription satisfaction. Do not invent scores; record test evidence and dated baselines.
