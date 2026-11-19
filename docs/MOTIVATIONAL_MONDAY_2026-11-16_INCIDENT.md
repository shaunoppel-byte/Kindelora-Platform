# 16 November 2026 Motivational Monday — non-publication incident

## Verified root causes (repository evidence, 19 November 2026)

The founder-approved message and Joanna MP3 did **not** have release authorization. The edition file `content/motivational-monday-2026-11-16-approved.json` explicitly says `release_decision: NO-GO`, `production_deployment: not_attempted`, and flags unverified mobile playback, PLUS authorization, independent review and quote attribution. `quality/monday-release-evidence.json` separately records `decision: NO-GO` with no reviewer or Sunday 20:00 GO timestamp. The editorial registry does not contain this edition and marks the historical archive incomplete. Therefore `scripts/check-monday-release-evidence.py` necessarily fails. Founder approval of the script and audio alone was not a release GO under the approved standard.

The approved audio metadata references `/assets/audio/motivational-monday-2026-11-16-approved.mp3` and records a later first-party recovery. That recovery does not establish that the asset was published to the **private** `PRIVATE_MONDAY_MEDIA` bucket as `editions/mm-2026-11-16.mp3`. The protected Monday API reads only the private bucket; a public Pages asset must not be used to bypass subscriber checks. This is an additional unverified delivery dependency, not proof of a missing file.

The Monday private endpoint previously used an obsolete email-based `subscriptions` query, inconsistent with the current `plus_subscriptions` identity-subject model. This PR aligns it to the verified member-ID entitlement helper; it does not activate PLUS or publish the edition.

## Recovery and prevention

1. Keep the 16 November edition unpublished until evidence-backed editorial, audio, private storage, device playback, subscriber authorization and guest/free/expired denial checks pass. Do not retroactively invent a Sunday GO.
2. Review quotation attribution, historical uniqueness and independent editorial approval. Record a new dated decision with actual evidence and reviewer; if releasing late, label it accurately rather than pretending it appeared on 16 November.
3. Upload approved text JSON and verified MP3 to private object storage using the expected edition keys; do not expose full text/audio under public static paths. Confirm that both web and installed PWA use the same protected API and that service-worker caching cannot leak it.
4. Test guest, registered free, paid active, expired, revoked and offline sessions on mobile and desktop, including direct MP3 URL attempts. Record live URL/device evidence.
5. Add release-status monitoring that alerts the founder when a scheduled edition remains NO-GO. Never equate content approval with publication or claim a release without a successful production probe.

## Multi-channel rule

All customer-facing account, billing, subscription and PLUS-content changes must be tested on both the responsive website and installed PWA. Other brands' websites/apps require separate implementation and deployment evidence; a KINDELORA repository change does not update them automatically.
