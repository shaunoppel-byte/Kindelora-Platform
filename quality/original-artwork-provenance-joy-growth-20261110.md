# KINDELORA original artwork provenance — 2026-11-10

## Scope
- `everyday-joy`: `/assets/affirmations/editorial-everyday-joy-oranges-20261110.svg` — a sunlit kitchen table with a bowl of oranges and a peeled orange, conveying a small, ordinary moment of pleasure.
- `steady-growth`: `/assets/affirmations/editorial-steady-growth-seedling-20261110.svg` — a young seedling in a terracotta pot inside a softly lit greenhouse, conveying patient, non-linear learning.

## Creation and rights
Both images are original hand-authored SVG vector compositions created for this repository on 2026-11-10. No third-party photographs, external image URLs, paid stock, fonts, scripts, embedded assets, or AI image credits were used. They may be used commercially by KINDELORA. Source files are the distributable assets.

## QA and release gates
- [x] Source artwork files committed to this branch.
- [x] Affirmation IDs and text retained unchanged.
- [x] Both remote image assignments replaced with local paths.
- [x] No external network dependencies in either SVG.
- [ ] Run `node scripts/audit-affirmation-artwork.mjs` in GitHub Actions or a clean checkout.
- [ ] Confirm static CI, image loading and responsive mobile cropping.
- [ ] Independently inspect the scenes at mobile dimensions for readability, theme fit and visual originality.
- [ ] Compare visually/perceptually against all 400 images (different paths alone are insufficient).
- [ ] Confirm Cloudflare production deployment after merge.

## Rollback
Revert the commit that changes `affirmation-library.js` or revert this PR; the previous URLs are available in git history. Do not remove old files until production verification and rollback window have passed.

## Editorial note
These artwork changes do not approve editorial-review-only message batches or change public message counts.
