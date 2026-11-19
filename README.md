# KINDELORA Platform

Kindness-first website and installable PWA.

Production: https://kindelora.pages.dev

## Delivery principles
- GitHub source control, Cloudflare Pages, zero-cost infrastructure.
- Public website, welcoming free guest experience; no mandatory signup.
- Separate deployment and rollback from KINDRA, VELORA and Oppel Enterprises.
- Test navigation, accessibility, mobile, PWA, privacy and pricing before production.
- Current public indicative Plus pricing: $8.99/month or $80.99/year upfront (as shown on the homepage); USD is the founder-approved headline reference currency; actual PayFast checkout currency and final amount must be verified before payment activation. Oppel Enterprises is not VAT registered; do not claim VAT is charged or issue VAT invoices. Once registered, approved headline prices are intended to be inclusive of applicable taxes, subject to legal/tax review. Merchant verification is pending; MCP and recurring billing are reported enabled by the founder but their combined production behaviour remains unverified. No live payments.
- PLUS checkout is intentionally disabled until PayFast merchant approval, secure identity and server-side entitlement verification, and E2E payment tests are complete.
- Automated guards: `premium-static-security.yml`, `plus-checkout-guard.yml`; live read-only checks: `production-premium-smoke.yml` (a green run is not evidence of full paid launch readiness).
- Preserve existing Direct Upload production while migrating to Git-connected Cloudflare.
