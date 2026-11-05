# KINDELORA Plus — Affirmation Media Production Standard

## Release principle
The 300 current scripts are editorial drafts, not approved subscriber content. Do not expose drafts through the public app, service worker, or unauthenticated static JSON. No paid library release until server-verified entitlement, privacy, editorial approval and browser tests pass.

## Required experiences
1. Accessible, selectable written affirmation with theme and ID.
2. Branded visual card, responsive on mobile; member may download a high-quality print asset.
3. Two genuinely recorded, quality-reviewed voice tracks (male and female choice), with transcript, pause/replay and no autoplay.
4. Search, favourites, collections, and sharing that does not reveal personal member data.

## Download and print requirements
- Mandatory official logo artwork from `icon.svg` and KINDELORA wordmark on **every** export; do not allow unbranded variants.
- A genuine QR code encoding `https://kindelora.pages.dev/`, with quiet zone, high contrast and physical-device scan verification.
- URL printed in human-readable form for people who cannot scan QR.
- At least 2400 x 3000 px portrait source photography, legally licensed for commercial redistribution and printing, with image rights recorded for each asset.
- Export a self-contained 2400 x 3000 SVG master; provide 300-DPI-equivalent 8 x 10 inch PNG/JPEG exports after raster-render QA. SVG dimensions alone do not certify photo sharpness.
- Keep readable text separate from the photographic layer, avoid faces under quote text, preserve safe margins and readable contrast.
- No automatic upscaling to pretend a low-resolution source is print-ready. Review print proof and verify image licensing before approval.
- QR scan QA: Android and iOS devices, screen and physical 8x10 print; ensure the URL remains correct after deployment changes.
- No tracking parameters or user IDs in QR codes; point to a stable public landing page.
- Accessibility: full text outside image, descriptive alt text, keyboard support and sufficient contrast.
- Print exports are personal-use unless explicit licensing permits further commercial distribution.

## Export workflow
`pip install Pillow qrcode`
`python scripts/export_affirmation_card.py --id <approved-id> --photo <licensed-2400x3000-photo> --license-ref <asset-rights-record> --out <output.svg>`

The exporter **refuses** unpublished or unapproved affirmations and photos smaller than the print target. A nonempty license reference is required, but the rights record must still be reviewed independently. The QR is generated as vector shapes; the actual original icon is embedded in every export. Review rendered SVG in browsers and print proof before member release.

## Audio quality gates
Record both voice versions with clear commercial usage rights and consistent pronunciation, pace and loudness. Perform human listening QA of every track, check script-to-audio accuracy, remove clipped or distorted recordings, and validate mobile streaming and accessible controls. Device speech synthesis does not qualify as a professional recording.

## Security and rollback
Paid content must be delivered only through server-verified entitlement checks; a hidden link or front-end-only lock is not security. Keep public preview separate from premium files. Stage and verify first; deploy only with known rollback point and hosted CI green.
