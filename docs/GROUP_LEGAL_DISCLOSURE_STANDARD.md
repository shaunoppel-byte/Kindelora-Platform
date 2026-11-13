# Oppel Enterprises Group — Legal Identity & Disclosure Standard v1.0

**Scope:** KINDELORA website, installed PWA, future apps, marketing landing pages, subscription and checkout flows. Reuse for all Group-operated brands, including Oppel Enterprises services and any future brands only once legal-entity ownership/contracting is verified.

## Canonical legal identity
- Legal operator: **Oppel Enterprises Group (Pty) Ltd**
- Registration: **2026/907492/07**
- Jurisdiction: South Africa
- Brand identity remains independent: **KINDELORA**

## Mandatory implementation
1. Every public commercial entry point must visibly identify the legal operator and registration number, with a reachable legal-information page.
2. Terms, Privacy/POPIA disclosures, checkout, payment merchant, invoices, transactional emails and app views must consistently identify the correct contracting entity. Do not imply a different legal entity operates a brand without a documented transfer/authority.
3. Collect and verify registered/business physical address, contact email, customer-support contacts, VAT status (if applicable), and consumer disclosures before accepting payments. Do not invent missing details.
4. Keep legal information accessible and legible on mobile, desktop and installed PWA; respect brand aesthetics.
5. Avoid dead links, duplicates, outdated registration details and stale PWA caches. Include legal disclosure regression checks in release QA.
6. Maintain group-level legal-identity records as source of truth and review whenever company structure or payment details change.

## Release gates
- Legal footer and legal page visible on desktop/mobile/PWA.
- Privacy and Terms links resolve to applicable real documents.
- Business details consistent with payment gateway and bank KYC.
- Legal counsel/accountant review statutory completeness before commercial launch.
- Deployment verification, not just PR merge, is required to mark complete.

**Status:** Identity/footer and legal-information page implemented in this branch. Full legal disclosures, payment/legal policy harmonisation, all additional brands and production PWA validation remain follow-up work.
