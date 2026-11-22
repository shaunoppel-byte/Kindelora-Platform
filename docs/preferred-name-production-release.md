# Preferred-name production release gate

**Do not assume GitHub merge applied a Cloudflare D1 migration.** The production error in My KINDELORA is consistent with a missing `member_preferences` table, but could also be a missing DB binding or an API configuration issue. Verify rather than guess.

1. In the Cloudflare account hosting `kindelora.pages.dev`, identify the D1 database bound as `DB` to the production Pages project. Do not use a preview or local D1 database.
2. From an authorised Cloudflare CLI session, run the **read-only** schema query (substitute the actual D1 database name):
   ```sh
   npx wrangler d1 execute <DB_NAME> --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='member_preferences';" --json | node scripts/check-member-preferences-d1.mjs
   ```
3. If missing, review `migrations/20261121_member_preferences.sql`, confirm the `members` table exists, take a D1 backup using the available Cloudflare backup/export capability, and apply **only** this idempotent migration to the correct production D1:
   ```sh
   npx wrangler d1 execute <DB_NAME> --remote --file migrations/20261121_member_preferences.sql
   ```
4. Repeat the read-only check. Sign in with a test member account; confirm `GET /api/member/preferences` returns HTTP 200, save a test name via UI, refresh to verify persistence, check welcome and farewell, and verify that signing out revokes the session.
5. Never print a member's chosen name, cookies, tokens, Cloudflare credentials or database contents into CI logs. Do not claim live until the end-to-end test succeeds.

**Rollback:** If application behaviour fails, roll back the UI/API deployment. Avoid dropping `member_preferences` and losing members' chosen names. This change does not require changes to PayFast, checkout, registration or existing auth tables.
