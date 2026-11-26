// Offline schema contract: ensure persistence is prepared without activating checkout.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('migrations/0001_plus_persistence.sql','utf8');
const middleware=readFileSync('functions/_middleware.js','utf8');
for(const table of ['plus_customers','plus_orders','plus_payment_events','plus_subscriptions'])
 assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS '+table+'\\s*\\('));
assert.match(sql,/identity_subject TEXT NOT NULL UNIQUE/);
assert.match(sql,/provider_event_reference TEXT NOT NULL UNIQUE/);
assert.match(sql,/payment_reference TEXT UNIQUE/);
assert.match(sql,/CHECK \(brand = 'KIN'\)/);
assert.match(sql,/CHECK \(currency = 'ZAR'\)/);
assert.match(sql,/FOREIGN KEY|REFERENCES plus_customers\(id\)/);
assert.match(middleware,/checkoutAvailable:\s*configured/);
assert.match(middleware,/\.every\(k=>env\[k\]==='true'\)/);
assert.match(middleware,/membershipVerificationAvailable:\s*false/);
console.log('PASS: dormant D1 schema constraints and fail-closed checkout retained');
