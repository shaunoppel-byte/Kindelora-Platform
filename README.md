# KINDELORA Platform

Kindness-first website and installable PWA.

Production: https://kindelora.pages.dev

## Delivery principles
- GitHub source control, Cloudflare Pages, zero-cost infrastructure.
- Public website, welcoming free guest experience; no mandatory signup.
- Separate deployment and rollback from KINDRA, VELORA and Oppel Enterprises.
- Test navigation, accessibility, mobile, PWA, privacy and pricing before production.
- Current public indicative Plus pricing: $6.99/month or $69.99/year upfront (as shown on the homepage); billing currency, VAT treatment, and final checkout terms require confirmation before payment activation. No live payments.
- PLUS checkout is intentionally disabled until PayFast merchant approval, secure identity and server-side entitlement verification, and E2E payment tests are complete.
- Automated guards: `premium-static-security.yml`, `plus-checkout-guard.yml`; live read-only checks: `production-premium-smoke.yml` (a green run is not evidence of full paid launch readiness).
- Preserve existing Direct Upload production while migrating to Git-connected Cloudflare.
