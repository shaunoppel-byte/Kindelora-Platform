// Offline contract tests: membership must be granted by server-side paid status,
// not by a cookie, query parameter, or another member's subscription.
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { onRequestGet } from "../functions/api/member/entitlement.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const pepper = "offline-test-pepper-".repeat(3);
const tokenA = "a".repeat(64);
const tokenB = "b".repeat(64);
const digest = async token => Array.from(
  new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token + pepper))),
  byte => byte.toString(16).padStart(2, "0")
).join("");

const sessions = new Map([
  [await digest(tokenA), { id: "a", email_normalized: "a@example.test", email_verified_at: "2026-01-01" }],
  [await digest(tokenB), { id: "b", email_normalized: "b@example.test", email_verified_at: "2026-01-01" }]
]);

let active = new Set(["a@example.test"]);
const queries = [];
const env = {
  MEMBER_AUTH_ENABLED: "true",
  MEMBER_AUTH_PEPPER: pepper,
  DB: {
    prepare(sql) {
      queries.push(sql);
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes("FROM member_sessions")) return sessions.get(args[0]) || null;
              if (sql.includes("FROM subscriptions")) return active.has(args[0]) ? { id: "paid" } : null;
              throw new Error("Unexpected query");
            }
          };
        }
      };
    }
  }
};
const request = (token, extra = "") => new Request(
  "https://kindelora.pages.dev/api/member/entitlement?plus=true" + extra,
  { headers: token ? { cookie: "kindelora_session=" + token } : {} }
);
const get = async (token, extra) => {
  const response = await onRequestGet({ request: request(token, extra), env });
  assert.equal(response.headers.get("cache-control"), "no-store");
  return { status: response.status, body: await response.json() };
};

assert.deepEqual(await get(null), { status: 401, body: { authenticated: false, plus: false } });
assert.deepEqual(await get("f".repeat(64)), { status: 401, body: { authenticated: false, plus: false } });
assert.deepEqual(await get(tokenA), { status: 200, body: { authenticated: true, plus: true } });
assert.deepEqual(await get(tokenB, "&member=a"), { status: 200, body: { authenticated: true, plus: false } });
active = new Set();
assert.deepEqual(await get(tokenA), { status: 200, body: { authenticated: true, plus: false } });
assert.ok(queries.some(sql => sql.includes("email_verified_at IS NOT NULL") && sql.includes("current_period_end>?")));
console.log("PASS: guest denied; unknown session denied; paid account allowed; second account isolated; expired/removed entitlement denied (mock D1)");
