import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { PLUS_PLANS, selectPlusPlan, quotePlusZar } from '../functions/_lib/plus-pricing.mjs';
test('approved prices and frequencies', () => {
  assert.equal(PLUS_PLANS.monthly.usdMinor, 899);
  assert.equal(PLUS_PLANS.annual.usdMinor, 8999);
  assert.equal(PLUS_PLANS.monthly.payfastFrequency, 3);
  assert.equal(PLUS_PLANS.annual.payfastFrequency, 6);
});
test('rejects client-controlled or unknown plans', () => {
  for (const x of ['', 'free', 'MONTHLY', {}, null]) assert.throws(() => selectPlusPlan(x));
});
test('requires approved, unexpired, matching ZAR quote', () => {
  const good = {approved:true,sourceCurrency:'USD',settlementCurrency:'ZAR',zarMinor:16500,usdMinor:899,expiresAtMs:Date.now()+60000};
  assert.equal(quotePlusZar('monthly',good).settlementZarMinor,16500);
  for (const mutation of [{approved:false},{sourceCurrency:'ZAR'},{settlementCurrency:'USD'},{zarMinor:899},{usdMinor:8999},{expiresAtMs:0}]) {
    assert.throws(() => quotePlusZar('monthly',{...good,...mutation}));
  }
  assert.throws(() => quotePlusZar('annual',good));
});
