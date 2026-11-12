# Artwork provenance and release gate — 12 November 2026

## Original assets (editorial candidate; not production-approved)
- **affirmation-391**: `/assets/affirmations/original-release-work-391.svg` — original vector composition of a hand-written work being released into morning light; intended to support "I can share thoughtful work before it feels flawless."
- **affirmation-392**: `/assets/affirmations/original-kintsugi-contribution-392.svg` — original vector composition of a gold-repaired ceramic bowl and olive branch; intended to support "Meaningful contribution does not require perfection."

Both SVG sources were authored specifically for KINDELORA in this delivery, using original geometry, gradients and shapes. No third-party photographs, stock images, external fonts, scripts, linked images or paid assets were incorporated. The illustrations may be used commercially by the project; record any further editorial sign-off separately.

## Preliminary static QA
- Each SVG declares `xmlns`, `viewBox="0 0 1200 1500"`, an accessible `role="img"` and an `aria-label`.
- Both files were fetched back successfully from the branch after creation.
- Two catalogue mappings changed; original affirmation text remains unchanged.
- Distinct subjects and compositions were intentionally chosen.

## Unverified / release blockers
- SVG XML parsing, sanitizer/security scan, actual browser/mobile visual inspection, 400-image perceptual uniqueness audit, contrast/cropping checks, full static tests and GitHub Actions CI have **not** been established by this record.
- These assets must remain a **draft release candidate** until the above checks pass. Do not treat separate paths as proof of unique underlying art.
- No Cloudflare production deployment or public-library count change is claimed.

## Rollback
Revert the branch's catalogue mapping commit and the two SVG additions (or revert the eventual merge commit) to restore the previous image assignments. Preserve affirmation text and the original bulk SVG assets.
