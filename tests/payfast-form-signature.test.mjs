import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createHash} from 'node:crypto';
import {canonicalPayfastForm,signPayfastForm} from '../functions/_lib/payfast-form-signature.mjs';
const fields={merchant_id:'10000100',merchant_key:'46f0cd694581a',return_url:'https://example.org/return',cancel_url:'https://example.org/cancel',notify_url:'https://example.org/notify',m_payment_id:'order_123',amount:'165.00',item_name:'KINDELORA Plus',subscription_type:'1',recurring_amount:'165.00',frequency:'3',cycles:'0'};
test('PayFast hosted form canonical order and encoding',()=>{
 const raw=canonicalPayfastForm(fields,'secret phrase');
 assert.ok(raw.startsWith('merchant_id=10000100&merchant_key=46f0cd694581a&return_url='));
 assert.ok(raw.includes('item_name=KINDELORA+Plus'));
 assert.ok(raw.endsWith('&passphrase=secret+phrase'));
 assert.ok(raw.indexOf('amount=')<raw.indexOf('subscription_type='));
});
test('Worker MD5 agrees with independent Node crypto reference',()=>{
 for(const passphrase of ['secret phrase','a','x'.repeat(100),'é🙂']) {
   const raw=canonicalPayfastForm(fields,passphrase);
   assert.equal(signPayfastForm(fields,passphrase),createHash('md5').update(raw,'utf8').digest('hex'));
 }
});
test('signature rejects missing passphrase, merchant and unexpected fields',()=>{
 assert.throws(()=>signPayfastForm(fields,''));
 assert.throws(()=>signPayfastForm({...fields,merchant_id:''},'secret'));
 assert.throws(()=>signPayfastForm({...fields,amount:'165.00',malicious:'yes'},'secret'));
});
test('signature changes with price and recurring frequency',()=>{
 const a=signPayfastForm(fields,'secret');
 assert.notEqual(a,signPayfastForm({...fields,amount:'165.01'},'secret'));
 assert.notEqual(a,signPayfastForm({...fields,frequency:'6'},'secret'));
});
