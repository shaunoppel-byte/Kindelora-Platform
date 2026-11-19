# P0 public email registration
Status: NO-GO until production E2E acceptance.
Founder-approved replacement of invitation-only signup with verified public email registration.
1. Apply D1 member schema and migration 0002 to correct Cloudflare environment; verify binding and secrets.
2. Configure approved transactional email sender and API secret in Cloudflare; never commit credentials.
3. Implement rate-limited registration-request endpoint with generic response, strong password hash, 15-minute single-use hashed token and delivery confirmation.
4. Implement atomic verify-email endpoint: consume valid unexpired token and create verified member; reject duplicates and replay.
5. Implement password reset and abuse protections. Only enable public UI after production smoke and negative tests pass.
6. Test invalid email, forged/expired/replayed token, throttling, provider downtime, concurrent requests, login/logout, mobile/PWA.
7. PayFast checkout stays disabled until sandbox signed payment, verified ITN and entitlements pass.
No self-verified accounts or simulated successful payments are permitted.