import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('PLUS checkout remains fail-closed until payment verification is implemented', async () => {
 const [middleware, checkout, schema] = await Promise.all([
  readFile('functions/_middleware.js','utf8'),
  readFile('functions/api/plus/checkout.js','utf8'),
  readFile('migrations/0001_plus_persistence.sql','utf8')
 ]);
 assert.match(middleware,/checkoutAvailable:\s*configured/);
 assert.match(middleware, /membershipVerificationAvailable:\s*false/);
 assert.match(middleware, /\^\\\/\(\?:api\\\/\)\?\(\?:plus\|premium\|members\)/);
 assert.match(checkout, /checkout_unavailable/);
 assert.match(checkout, /status:\s*503/);
 assert.match(schema, /CHECK\s*\(currency\s*=\s*'ZAR'\)/i);
 assert.match(schema, /provider_event_reference\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i);
 assert.match(schema, /payment_reference\s+TEXT\s+UNIQUE/i);
 assert.match(schema, /CHECK\s*\(amount_minor\s*>\s*0\)/i);
 assert.match(schema, /CHECK\s*\(provider\s*=\s*'PayFast'\)/i);
});
