# KINDELORA Affirmation Library — approved quality benchmark

The source of truth for existing affirmation cards is `affirmations/library.json`. The current published inventory is **3 unique affirmations**. This is distinct from `message-catalogue.json`, which must not be altered by affirmation work.

## Required standard for every new affirmation
- A separately selected or commissioned high-quality photograph with a coherent warm, cinematic look; no baked-in titles, hearts, QR codes, logos or typography.
- Text remains accessible HTML, with correct heading and quote, no clipping at mobile widths.
- Mobile-first one-column card, aligned controls, consistent whitespace, responsive desktop layout, descriptive alt text.
- Browsing and downloads remain free for guests. Save heart opens Plus membership information for non-subscribers; persistent saving requires verified subscriber entitlement.
- A genuine downloadable **complete affirmation card**, including its quote, not merely an unrelated photograph or an old illustration. QR claims must match actual visible functionality.
- Check image source licensing, attribution requirements and image availability before publication. Prefer stable first-party assets over third-party image URLs.
- Test mobile and desktop, download bytes/content, Save gating, keyboard focus, screen reader labels, broken links, and no console errors before release.
- Roll back via the previous production commit if critical UX or access issues occur.

## Release gates
1. Inventory and editorial review; no duplicate affirmation IDs.
2. Visual and accessibility QA on each card.
3. Automated tests and production smoke test.
4. Release only after verification; never describe a card as published based solely on a staged manifest.

Current known limitation: homepage photographic images are third-party URLs, while PNG download links point to the earlier composite-derived card artwork. These are not yet a single coherent image-to-download design. Do not declare full-library premium certification until the downloadable card assets are remastered and verified.
