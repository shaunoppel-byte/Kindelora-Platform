# KINDELORA transactional email — zero-cost configuration
Chosen candidate: Resend Free (currently 3,000 emails/month, 100/day). This is a quota, not an unlimited commitment.
1. Create a free account at https://resend.com and verify a domain/subdomain owned by Oppel Enterprises. Pages.dev is not a sender domain.
2. Store RESEND_API_KEY as an encrypted Cloudflare Pages secret; store REGISTRATION_FROM_EMAIL as the verified sender.
3. Leave PUBLIC_REGISTRATION_ENABLED unset/false until D1 migrations, rate-limited registration and atomic verification endpoints, password reset, Turnstile and production negative tests pass.
4. Never expose the verification token in client-side logs, analytics, referrers or GitHub. Verification links must be handled only by a protected server-side flow.
5. This PR provides an isolated delivery helper only. It does NOT activate email delivery, registration or payments.
6. Limit sends below the provider free quota and do not enable paid overages.
