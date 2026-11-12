# Motivational Monday — Release acceptance checklist
Reference: founder-approved cinematic design (12 November 2026), docs/MOTIVATIONAL_MONDAY_BLUEPRINT.md, PR #263.

## Automated checks (latest redesign commit f38b875)
- [ ] Exact commit GitHub Actions checks green (as of inspection: no runs returned; no combined statuses returned)
- [ ] Validate HTML structure, link targets and console errors
- [ ] Verify no external paid API or secrets introduced
- [ ] Confirm approved image rights and self-hosted production asset; current hero and card imagery use externally hosted Unsplash URLs

## Visual parity — human acceptance
- [ ] 1440px laptop: navigation, premium purple/gold sunrise, typography, prominent two CTAs, weekly message card, experience list
- [ ] 768px tablet: no horizontal scroll; readable message; stacked columns
- [ ] 360/390/412px phone: nav wrap, no clipped hero text or CTAs, accessible tap targets, readable card and bottom panels
- [ ] Contrast WCAG AA for body text; keyboard focus and reduced motion
- [ ] Check visual parity against founder-supplied image; note deliberate responsive differences
- [ ] Test actual smartphone screenshots, not just CSS assumptions

## Functional acceptance
- [ ] Home navigation and product page links work in Cloudflare production
- [ ] Listen works when browser supports speechSynthesis; unavailable browsers receive disabled control
- [ ] Share works through native share or clipboard fallback; copy link works on HTTPS
- [ ] PLUS archive/favourites/weekly delivery are clearly labelled planned, not active
- [ ] Editorial quote attribution checked, content approved, historic uniqueness QA completed or clearly disclosed as incomplete
- [ ] Existing affirmations, film, homepage, account and membership flows unaffected
- [ ] PWA manifest scope, service worker caching and offline behavior checked on real mobile device

## Production
- [ ] Mergeability resolved, code review approved
- [ ] CI passed on exact release SHA
- [ ] Cloudflare Direct Upload vs Git-connected deployment path verified
- [ ] Backup and rollback instructions tested
- [ ] Deploy only with founder release approval
- [ ] Record production URL, deployment ID, timestamp and post-deployment smoke tests

**Status: NO-GO until all applicable P0 gates are met.** Passing an earlier commit's CI does not validate a newer redesign commit.
