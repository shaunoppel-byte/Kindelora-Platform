# Privacy-by-design and POPIA release gate — Kindelora

Status: engineering baseline / NOT a legal opinion, compliance certification or deployed Privacy Notice. Owner and Information Officer to review before publication.

## Business-specific processing inventory to verify
Member email and sessions, private reflections, favourites, affirmations, notification preferences and Plus billing; distinguish browser-local data from server-synchronised data and do not claim paid access is live.

## Required controls (verify with evidence, not assumptions)
1. Maintain data inventory: every form, API, D1/table, browser store, cookie, email, payment provider, AI provider, analytics tool, logs, backups and data destination. Document purpose, lawful basis, necessity, recipients, transfer countries and retention/deletion.
2. Identify the actual legal responsible party, physical/contact address, Information Officer and rights-request contact. No placeholder identity may be published as fact.
3. Present a readable business-specific Privacy Notice at/before collection (POPIA s18) and link it from footer, forms, registration/account settings where applicable. Explain mandatory versus optional data, purposes, rights, recipients, overseas transfers, retention and complaint route. Separate optional marketing consent; do not bundle it into service acceptance.
4. Minimise personal data; never log passwords, secrets, session tokens, full payment card data or private conversation content. Use password hashing with strong salts, encrypted transport, least-privilege server credentials, hardened cookies, session revocation and server-side account isolation where applicable.
5. Restrict access to private records, drafts, AI memories and payment metadata at the API/database layer. Test two-account isolation, unauthenticated and forged-token access, deletion/recovery, expired sessions, privacy-safe caching and failed provider calls.
6. Review POPIA s19 security risk controls, s21 written operator safeguards, s22 breach response/notification, s72 cross-border transfer conditions and applicable rules on children/special personal information. Confirm actual processor agreements, locations and retention settings before claiming compliance.
7. Implement access/correction/deletion/objection request handling, reasonable identity verification, documented retention exceptions, audit trail without excess personal data, backup expiry and deletion propagation.
8. Test privacy notice links, separate marketing consent, account settings, mobile keyboard/screen reader experience, nonproduction fixtures, CI and deployed browser flows. Record exact evidence, commit and environment; no customer data in tests.
9. Incident playbook: contain and investigate, notify Information Officer, preserve minimal evidence, assess unauthorised access/acquisition, notify Information Regulator and affected persons as soon as reasonably possible where POPIA s22 applies, record actions and remediate.
10. Gate release: no paid-member launch or claims of POPIA compliance without verified implementation, legal review and owner approval. Preserve zero-cost/non-deploying controls and rollback.

## Founder decisions required before public legal copy
Confirm legal entity/trading name and address for this business; Information Officer and contact; processors and actual hosting/AI/payment destinations; retention schedule; legal review of rights and cross-border notices. Do not invent these details.

References: https://www.gov.za/documents/protection-personal-information-act ; https://inforegulator.org.za/2025/08/19/fact-sheet-handling-of-security-compromises/
