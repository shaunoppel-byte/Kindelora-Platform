import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {canonicalItnPayload,isMd5Hex} from '../functions/_lib/payfast-itn-canonical.js';
test('canonical ITN excludes signature, keeps submitted order, encodes values and appends secret',()=>{
 const form=new URLSearchParams('merchant_id=10000100&m_payment_id=order-123&item_name=Kindelora+PLUS&amount_gross=199.99&signature=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
 const data=canonicalItnPayload(form,'a secret');
 assert.equal(data,'merchant_id=10000100&m_payment_id=order-123&item_name=Kindelora+PLUS&amount_gross=199.99&passphrase=a+secret');
 assert.equal(isMd5Hex(createHash('md5').update(data).digest('hex')),true);
 assert.ok(!data.includes('signature='));
});
test('rejects duplicates and missing signature',()=>{
 assert.throws(()=>canonicalItnPayload(new URLSearchParams('merchant_id=1&merchant_id=2&signature=x'),'secret'),/duplicate/);
 assert.throws(()=>canonicalItnPayload(new URLSearchParams('merchant_id=1'),'secret'),/signature/);
});
test('rejects malformed or empty secrets',()=>{
 assert.throws(()=>canonicalItnPayload(new URLSearchParams('signature=x'),' '),/passphrase/);
 assert.equal(isMd5Hex('not a signature'),false);
});
