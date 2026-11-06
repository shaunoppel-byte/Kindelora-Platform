# KINDELORA R0 operating policy and launch gates

**Non-negotiable:** No new paid hosting, API, storage, email, CI, AI or SaaS subscription. No card required for a supposedly free service unless the founder explicitly approves the associated billing risk.

## Existing infrastructure first
- Keep GitHub and Cloudflare Pages.
- Reuse Pages Functions for membership authorization; keep private sessions server-side.
- Reuse existing D1 schema only if D1 is provisioned within a confirmed free allowance.
- Evaluate Cloudflare R2 free-tier capacity, request quotas, billing prerequisites and account-level usage before provisioning. Do not assume R2 is zero-cost under all traffic.
- No premium image may be hosted in the public Pages build. Moving it behind a hidden link or client-side gate does not protect it.

## Zero-cost release phases
1. Keep exactly three approved free downloadable cards on the homepage.
2. Test membership gates offline with mock D1: guest 401, unpaid 403, expired 403, active Plus 200; test private image 404 and storage 503. No real charge required.
3. Confirm a private R2 bucket is available at R0 **without an unacceptable billing risk**. Bind it as `PRIVATE_AFFIRMATION_ARTWORK`. If not available, keep the paid library disabled and do not substitute publicly hosted assets.
4. Migrate private artwork into the private bucket. Delete premium originals and derivative images from public site, public manifests, service worker and cached routes. Previously public images cannot be made exclusive retroactively; produce new exclusive premium artwork before commercial launch.
5. Run real-browser verification of member registration, verification, session isolation, library access, and logout before enabling a paid plan.
6. Payment activation only after a verified provider integration, explicit founder approval, and cost review. Transaction fees must be disclosed; R0 infrastructure does not imply zero fees per sale.

## Cost safeguards
Check provider dashboards and free-plan terms before provisioning. Use build-time optimization, bounded file sizes, no polling, and no third-party paid AI calls. Prefer CI smoke tests over frequent paid browser automation. Maintain a manual revert path for every production change.

## Current blockers
- No confirmed private object storage binding or production D1 configuration.
- No confirmed end-to-end paid subscription flow.
- Existing public premium artwork files remain downloadable.
- Draft PR #45 conflicts with main and must not be merged unchanged.

**Release rule:** never describe protected library or payments as live until tested on production with real provider configuration.
