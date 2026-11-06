# Private Affirmation Artwork release runbook

Status: BLOCKED — do not merge the paid-library branch until all acceptance criteria pass.

## Private storage
Bind a **private** Cloudflare R2 bucket to Pages Functions as `PRIVATE_AFFIRMATION_ARTWORK`. Do not enable a public bucket domain or expose object credentials. Confirm the Cloudflare account's current R2 free-tier eligibility and costs before creating it; the zero-cost requirement is mandatory.

Upload exactly these six PNG objects to the bucket:
- `published/one-breath.png` from `affirmations/kindelora-premium-one-breath.png`
- `published/worthy-now.png` from `affirmations/kindelora-premium-worthy-now.png`
- `published/begin-again.png` from `affirmations/kindelora-premium-begin-again.png`
- `published/small-steps.png` from `affirmations/artwork/small-steps-still-count.png`
- `published/rest-is-worthy.png` from `affirmations/artwork/rest-is-part-of-growing.png`
- `published/light-returns.png` from `affirmations/artwork/the-light-returns.png`

## Public asset remediation
Only the three founder-approved free samples may remain public. Remove legacy premium PNGs, legacy SVG originals, and premium entries from any publicly served manifest, gallery, review route, cached HTML and app service-worker precache. Verify old URLs return 404/410 after cache invalidation. Historical public copies cannot be retroactively revoked; create fresh exclusive artwork for a genuinely exclusive premium tier.

## End-to-end acceptance
Verify guest 401, verified unpaid 403, expired subscription 403, revoked session 401, active paid 200 for catalogue and images; verify an unknown artwork ID returns 404, a missing private object fails closed, and all responses set no-store. Confirm cross-account isolation, mobile experience, downloads, and subscription expiry. Only then merge and deploy. Rollback: revert the PR and disable the private API route.

The three free homepage cards stay available to guests. Do not describe the full library as released while the R2 binding, live payment verification or member onboarding remains unvalidated.
