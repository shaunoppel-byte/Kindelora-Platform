# KINDELORA artwork provenance — affirmations 393–394

Created 2026-11-12. Both illustrations are original hand-authored SVG compositions created for KINDELORA in this delivery run, with no third-party image assets, fonts, raster references, external links, or paid services. Commercial-use provenance: original work produced for the founder's repository; no external license dependencies.

| Affirmation | Scene | File |
|---|---|---|
| 393, The Value of Presence — Intention | Two people sharing a warm cafe conversation, phone put aside | `assets/affirmations/original-presence-conversation-393.svg` |
| 394, The Value of Presence — Reflection | Quiet reading nook, open book and wildflowers | `assets/affirmations/original-presence-reading-nook-394.svg` |

Original affirmation wording and IDs are unchanged. Both files are 1200 × 1500 SVGs with descriptive accessibility labels. Their subjects, palette, shapes and composition are distinct from one another; perceptual comparison against the entire library is **not yet completed**. They contain no overlay text and are intended for the existing card treatment.

## Release gates — NOT YET APPROVED

- [ ] Validate SVG XML/security and render on mobile and desktop; check crop, legibility and contrast.
- [ ] Run `node scripts/audit-affirmation-artwork.mjs` and check image existence and full-library visual/perceptual uniqueness.
- [ ] Run applicable catalogue integrity, static and integration CI workflows and confirm green for the final merged SHA.
- [ ] Verify Cloudflare live URLs and app presentation after deployment.

## Rollback

Revert the affirmation-library.js mapping commit `9d272150885fd1101aff2e20ad3f6a75bc4f1abe` (or the eventual merge commit) to restore the prior images; the old local artwork files remain intact. No public deployment is authorized solely by this PR.
