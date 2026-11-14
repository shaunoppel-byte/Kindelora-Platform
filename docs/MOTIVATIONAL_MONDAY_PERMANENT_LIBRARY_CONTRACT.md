# KINDELORA PLUS — Permanent Motivational Monday Library Contract

Founder requirement confirmed 14 November 2026. This is a **mandatory product and release requirement**, not evidence of implementation or deployment.

## Permanent weekly archive
- Each successfully approved and published weekly message becomes an immutable, individually addressable archive edition, not an overwritten featured-message slot.
- Each edition has a stable `id`, title, theme, full text, quotation and attribution, publication UTC timestamp, intended Monday date, first-party audio URL, artwork URL, editorial version, and release/approval evidence. A missing MP3 or unverified paid access blocks release under the global release standard.
- The current featured edition is the latest eligible published edition; older editions remain browseable by date and theme and searchable without losing their original wording or narration.
- Draft, preview, revoked and unpublished entries must never be displayed as published editions. Correcting a published edition requires a versioned revision with an audit trail; preserve stable IDs and favorite references.
- Retention is indefinite by default. Exceptional legal/safety takedown may hide access while preserving a controlled audit record. Never promise availability against lawful removal or service failure.

## PLUS favorites
- Authenticated active PLUS subscribers may save or unsave any published edition using a stable edition ID. Favorites are user-scoped server-side records, not global flags or client-only localStorage.
- Unfavoriting removes only the personal bookmark; it **must not delete or alter the archived edition**.
- Favorites persist across supported devices after sign-in and must not leak between users. Avoid logging sensitive identity or reading preferences unnecessarily.
- Guests, free users and expired PLUS accounts must be denied at the server for archive details and favorites reads/writes; UI-only hiding is insufficient. Account expiry does not destroy favorite associations; access can resume if entitlement is restored, subject to retention/privacy policy.
- Support account deletion and POPIA-aligned data handling, authorization tests, and a privacy-conscious export/deletion path before launch.

## Weekly publication transaction
1. Saturday: write and approve the script, prepare and verify matching complete MP3, assign permanent edition ID.
2. Sunday 15:00 SAST: editorial uniqueness, narration, mobile, accessibility, links, authentication and regression tests.
3. Sunday 20:00 SAST: documented GO/NO-GO with exact commit, reviewer, test evidence and rollback.
4. Sunday 23:00 SAST / 21:00 UTC: if and only if GO, publish the new edition atomically to the permanent archive and update the featured pointer. Never replace or erase older editions.
5. Verify archive entry, first-party audio, paid-only server access, favorite add/remove, persistence, and that previous editions still work. Roll back the featured pointer or edition visibility on failure, retaining previous editions.
6. Subscriber-local Monday 06:00–08:00 notifications only with verified opt-in, timezone and DST implementation.

## Acceptance tests required before claiming this feature live
- Publishing two editions retains both IDs and URLs, with newest featured.
- Repeated publish of the same edition ID is idempotent; no duplicate editions.
- Search/date ordering works across weeks; older text, artwork and MP3 remain accessible.
- Favorites add/remove is idempotent and isolated between accounts/devices; unbookmark never deletes an edition.
- Guest/free/expired users receive server-side denial for archive and favorites operations.
- Published entries cannot reference missing audio, invalid artwork or unapproved editorial status.
- Account deletion and privacy/retention controls are tested; rollback preserves previously published weeks.

## Current implementation status
The repository presently contains a preview-only editorial registry (`content/motivational-monday-registry.json`) with `publication_date: null`, and the blueprint describes searchable archive and authenticated favorites as future phases. This contract does not claim a working backend, production subscriptions, deployed archive, notifications, or migrated historical content. Implement and independently test those capabilities before marking them live.
