import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {hostedCheckoutSignatureInput,restApiSignatureInput,payfastEncode} from '../functions/_lib/payfast-canonicalization.mjs';
test('hosted preserves input order, REST sorts keys', () => {
  const fields={merchant_key:'key',merchant_id:'123',amount:'10.00'};
  assert.equal(hostedCheckoutSignatureInput(fields),'merchant_key=key&merchant_id=123&amount=10.00');
  assert.equal(restApiSignatureInput(fields),'amount=10.00&merchant_id=123&merchant_key=key');
});
test('empty and signature fields omitted; passphrase last', () => {
  assert.equal(hostedCheckoutSignatureInput({merchant_id:'123',signature:'ignored',empty:'',missing:null},'secret phrase'),'merchant_id=123&passphrase=secret+phrase');
});
test('encoding is stable for spaces, unicode and reserved characters', () => {
  assert.equal(payfastEncode('Hello World & café'),'Hello+World+%26+caf%C3%A9');
  assert.equal(hostedCheckoutSignatureInput({item_name:'A & B'}),'item_name=A+%26+B');
});
test('invalid field names and values rejected', () => {
  assert.throws(()=>hostedCheckoutSignatureInput({'bad&name':'x'}),TypeError);
  assert.throws(()=>restApiSignatureInput({amount:{value:1}}),TypeError);
  assert.throws(()=>hostedCheckoutSignatureInput([]),TypeError);
});
test('deterministic offline MD5 digest only; not an official PayFast fixture', () => {
  const s=hostedCheckoutSignatureInput({merchant_id:'123',amount:'10.00'},'demo');
  assert.equal(createHash('md5').update(s).digest('hex'),createHash('md5').update('merchant_id=123&amount=10.00&passphrase=demo').digest('hex'));
});
